/** Documentation roles, local references, downloads and the shared entrance. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
const documents = ['docs', 'guide', 'project-guide', 'development-guide'];
(async () => {
  const browser = await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',args:['--no-sandbox']});
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({viewport:{width,height:960},reducedMotion:'reduce'});
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      for (const language of ['zh','en']) {
        for (const document of documents) {
          await page.goto(`${base}${document}${language === 'en' ? '.en' : ''}.html?lang=${language}`);
          await page.waitForFunction(() => document.documentElement.hasAttribute('data-fonts-ready'));
          const skip = page.locator('.entrance-continue');
          if (await skip.count()) await skip.click();
          await page.waitForFunction(() => !document.querySelector('.document-entrance'));
          assert.equal(await page.locator('.page-nav a').count(),4);
          assert.match(await page.locator('.page-nav [aria-current="page"]').getAttribute('href'),/docs/);
          assert.equal(await page.locator('.document-links a').count(),4);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,`${document}/${width}`);
          // A contained table can still be unreadable when long tokens squeeze its columns.
          const narrowCells = await page.locator('.document-page table').evaluateAll(tables =>
            tables.flatMap(table => [...table.rows].flatMap(row => [...row.cells]
              .filter(cell => cell.getBoundingClientRect().width < 140)
              .map(cell => cell.textContent.slice(0,60)))));
          assert.deepEqual(narrowCells,[],`${document}/${language}/${width}: compressed table columns`);
          if (document === 'development-guide') {
            const columns = await page.locator('.document-source-table tbody tr').first().locator('td').evaluateAll(cells =>
              cells.map(cell => cell.getBoundingClientRect().width));
            assert(columns[0] >= 190 && columns[1] >= 200,`Source index columns: ${columns}`);
            const firstFile = page.locator('.document-source-table tbody code').first();
            const fileLines = await firstFile.evaluate(code => code.getClientRects().length);
            assert.equal(fileLines,1,'app.js remains a readable single-line filename');
          }
          const links = await page.locator('.document-page a[href]').evaluateAll(ns => ns.map(n => n.getAttribute('href')));
          for (const href of links) {
            if (/^https?:/.test(href)) continue;
            const target = new URL(href,page.url()), relative = decodeURIComponent(target.pathname).slice(1);
            const filename = path.resolve(relative.endsWith('/') ? relative+'index.html' : relative);
            assert(fs.existsSync(filename),href);
            if (target.hash) {
              const source = fs.readFileSync(filename,'utf8');
              assert(source.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`),href);
            }
          }
          assert(await page.locator('a[download]').isVisible());
          await page.locator('.document-toc summary').click();
          await page.locator('.document-toc ol').waitFor({state:'visible'});
        }
      }
      assert.deepEqual(errors,[]);
      await context.close();
    }
    const page = await browser.newPage();
    for (const route of ['lab.html','diagrams.html','analemma.html','sundial.html','space/index.html','lunar/index.html','contact.html']) {
      await page.goto(base+route+'?lang=zh');
      assert.equal(await page.locator('.page-nav a').filter({hasText:'文档中心'}).count(),1,route);
      assert.equal(await page.locator('.page-nav a').filter({hasText:'学习指南'}).count(),0,route);
    }
    const source = JSON.parse(fs.readFileSync('docs/document-content.json','utf8'));
    assert.equal(Object.keys(source.state_dictionary).length,56);
    assert(source.documents.find(d=>d.page==='guide').sections.length>=18);
    assert(source.documents.find(d=>d.page==='project-guide').sections.length>=20);
    assert(source.documents.find(d=>d.page==='development-guide').sections.length>=20);
    console.log('PASS four documents in both languages at 390/1440px, local links, Markdown, contents and unified navigation');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
