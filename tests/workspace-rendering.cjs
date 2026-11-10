/** Five/six plots remain readable; stable UI refreshes do not rewrite control metadata. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:43817/').replace(/\/?$/, '/');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox','--use-angle=swiftshader'] });
  try {
    for (const width of [1440, 960]) {
      const page = await browser.newPage({ viewport: { width, height: 850 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + 'lab.en.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !!window.SkyLabExperiment && !document.querySelector('.layout-launch').disabled);
      await page.locator('.layout-launch').click();
      for (const count of [5,6]) {
        await page.evaluate(()=>{uiWorkspace.plot.scrollTop=0;});
        await page.evaluate(count => {
          SkyWorkbenchMenu.select('skyPanel');
          const ids=['skyPanel','chartPanel','contextPanel','riseSetPanel','solarGeometryPanel','analemmaPanel'];
          for(const id of ids.slice(0,count)) skyWorkspacePresentation.addView(id);
        }, count);
        await page.waitForFunction(count => skyWorkspacePresentation.views.length === count, count);
        const rows = await page.locator('.ui-diagram-card:visible').evaluateAll(nodes => nodes.map(n => ({ top:n.offsetTop,height:n.clientHeight, surface:n.querySelector('.ui-diagram-surface').clientHeight })));
        assert.equal(new Set(rows.map(row => row.top)).size,3,'Every pane has an explicit row');
        assert(rows.every(row => row.height >= 238 && row.surface >= 100),'Toolbar cannot consume the scientific plot');
        assert(await page.locator('.workspace-divider-y').evaluate(n=>n.hidden),'A two-row handle must not cover a three-row plot');
        assert(await page.locator('[data-proportion=rowRatio]').isDisabled());
        // Actual painted pixels catch stale IntersectionObserver decisions after revealing panes.
        await page.waitForFunction(()=>{const c=document.getElementById('chart');if(!canPaint(c))return false;const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return pixels.some((value,i)=>i%4===3&&value>0);});
        const last = page.locator('.ui-diagram-card:visible').last();
        await last.scrollIntoViewIfNeeded();
        await page.waitForFunction(()=>{const cards=[...document.querySelectorAll('.ui-diagram-card')].filter(c=>!c.hidden),canvas=cards.at(-1).querySelector('canvas');if(!canPaint(canvas))return false;const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;return pixels.some((value,i)=>i%4===3&&value>0);});
        assert(await last.evaluate(n=>{const r=n.getBoundingClientRect(),p=n.closest('.ui-plot').getBoundingClientRect();return r.bottom<=p.bottom+1;}),'The final row is reachable inside the plot');
      }
      const writes = await page.evaluate(async () => {
        const records=[]; const observer=new MutationObserver(list=>records.push(...list));
        const roots=[document.querySelector('#workbenchViews'),document.querySelector('.dt-rail-navigation'),...document.querySelectorAll('.ui-diagram-card-head')];
        for(const root of roots.filter(Boolean)) observer.observe(root,{subtree:true,attributes:true,childList:true,characterData:true});
        for(let i=0;i<10;i++) renderUIWorkspace();
        await Promise.resolve(); observer.disconnect();
        return records.map(r=>(r.target.id||r.target.className)+' '+r.attributeName);
      });
      assert.deepEqual(writes,[],'An unchanged sidebar and pane toolbar should not create mutation work');
      assert.equal(await page.locator('canvas[aria-pressed],.dt-scroll[aria-pressed]').count(),0,'Only view buttons have pressed state');
      await page.evaluate(()=>selectObservationBody('moon'));
      await page.waitForFunction(()=>state.body==='moon');
      assert(!await page.locator('[data-workbench-view=analemmaPanel]').isVisible());
      await page.evaluate(()=>selectObservationBody('sun'));
      await page.setViewportSize({width:390,height:844});
      await page.waitForFunction(()=>matchMedia('(max-width:760px)').matches);
      assert.equal(await page.locator('.ui-diagram-card:visible').count(),1);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      assert.deepEqual(errors,[]);
      await page.close();
    }
    console.log('PASS five/six plots, scroll reachability, usable canvas height, correct splitters, stable control DOM, button-only pressed semantics, body changes and mobile layout');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
