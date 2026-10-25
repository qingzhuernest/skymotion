/* Use the same tab navigation a person uses in the reference workbench. */
exports.selectDiagram = async (page, id) => {
  const viewTab = page.locator('[data-rail-section="views"]');
  if (await viewTab.count()) {
    if (await page.evaluate(() => matchMedia('(max-width:760px)').matches))
      await exports.openDrawer(page);
    await viewTab.click();
    const rememberedView =
      id === 'skyPanel' ? await page.evaluate(() => state.view) : null;
    const entry =
      id === 'skyPanel'
        ? page.locator(
            `.workbench-viewpoints button[data-view=${JSON.stringify(rememberedView)}]`,
          )
        : page.locator(`[data-diagram="${id}"]`);
    await entry.evaluate((node) => {
      const group = node.closest('details');
      if (group) group.open = true;
    });
    await entry.click();
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    if (await page.locator('#uiParameterDrawer').evaluate((node) => node.open))
      await page.locator('#uiDrawerClose').click();
    await page.waitForFunction(() => !document.getElementById('uiParameterDrawer').open);
  } else await page.locator(`[data-diagram="${id}"]`).click();
};
exports.openWorkbench = async (page) => {
  if (await page.evaluate(() => window.SkyCustomization?.active === false))
    await page.locator('.layout-launch').click();
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const references = page.locator('[data-rail-section="references"]');
  if (await page.locator('#workbenchViews').count()) {
    if (await page.evaluate(() => matchMedia('(max-width:760px)').matches))
      await exports.openDrawer(page);
    await references.click();
    if (await page.locator('.dt-panel').isVisible()) return;
  }
  const source = await page.locator('.dt-panel').getAttribute('data-canvas');
  if (
    !(await page.locator('.dt-panel').isVisible()) ||
    (source && !(await page.locator('#' + source).isVisible()))
  )
    await page.locator('.diagram-tool-launch:visible').first().click();
};
exports.addTool = async (page, type) => {
  await exports.openWorkbench(page);
  const fold = page.locator('.dt-collapse');
  if ((await fold.getAttribute('aria-expanded')) === 'false') await fold.click();
  if (
    (await page.locator('[data-dt-view=library]').getAttribute('aria-current')) !== 'page'
  )
    await page.locator('[data-dt-view=library]').click();
  await page.locator('.dt-advanced').evaluate((node) => (node.open = true));
  if (type === 'build') await page.locator('[data-build-kind=rod]').click();
  else await page.locator(`[data-tool-type="${type}"]`).click();
};

exports.enterCustomization = async (page) => {
  if (!(await page.locator('.layout-launch').count())) return;
  await page.waitForFunction(() => !!window.SkyCustomization);
  if (await page.evaluate(() => SkyCustomization.active)) return;
  const selected = await page.evaluate(() =>
    typeof uiWorkspace === 'undefined' || !uiWorkspace
      ? null
      : window.SkySiteCatalog.availableViews(state.body).some(
            (view) => view.editing && view.id === location.hash.slice(1),
          )
        ? location.hash.slice(1)
        : uiWorkspace.selected,
  );
  await page.locator('.layout-launch').click();
  await page.waitForTimeout(60);
  if (await page.locator('.dt-panel').isVisible())
    await page.locator('.dt-head button').last().click();
  if (!selected) return;
  const tab = page.locator(`[data-diagram="${selected}"]`);
  if (await tab.count()) {
    await exports.selectDiagram(page, selected);
    await page.waitForFunction(
      (selected) =>
        uiWorkspace.selected === selected &&
        (selected === 'solarCompare'
          ? skyWorkspacePresentation.active
          : !skyWorkspacePresentation.active),
      selected,
    );
  }
};

exports.objectAction = async (page, name) => {
  if (!(await page.locator('#dt-object-menu').isVisible())) {
    const tab = page.locator('[data-dt-view=objects]');
    if (await tab.isVisible()) await tab.click();
    if (await page.locator('.dt-back-list').isVisible())
      await page.locator('.dt-back-list').click();
    await page.locator('.dt-more').click();
  }
  await page
    .getByRole('menuitem', {
      name:
        name === '保存' ? '保存本图对象' : name === 'Save' ? 'Save plot objects' : name,
      exact: true,
    })
    .click();
};

exports.builderAction = async (page, kind) => {
  const selected = page
    .locator('.sb-object[aria-pressed=true]')
    .locator('..')
    .locator('.sb-row-more');
  await selected.click();
  const en = await page.evaluate(() => document.documentElement.lang === 'en');
  await page
    .getByRole('menuitem', {
      name: kind === 'copy' ? (en ? 'Duplicate' : '复制') : en ? 'Delete' : '删除',
      exact: true,
    })
    .click();
};

/* Secondary layout actions live in the existing Layout & saved views panel. */
exports.layoutAction = async (page, word) => {
  const drawerWasOpen = await page
    .locator('#uiParameterDrawer')
    .evaluate((node) => node.open);
  const trigger = page.locator('[data-word="options"]');
  const wasOpen = (await trigger.getAttribute('aria-expanded')) === 'true';
  if (!wasOpen) await trigger.click();
  const target =
    word === 'add'
      ? page.locator('.workbench-add-view[aria-pressed="false"]:visible').first()
      : page.locator(`#workspaceOptions [data-word="${word}"]`);
  await target.click();
  if (!wasOpen) await page.keyboard.press('Escape');
  if (
    !drawerWasOpen &&
    (await page.locator('#uiParameterDrawer').evaluate((node) => node.open))
  ) {
    await page.locator('#uiDrawerClose').click();
    await page.waitForFunction(() => !document.getElementById('uiParameterDrawer').open);
  }
};

exports.openLibrary = async (page) => {
  if (!(await page.locator('[data-dt-view=library]').isVisible()))
    await exports.openWorkbench(page);
  const library = page.locator('[data-dt-view=library]');
  if ((await library.getAttribute('aria-current')) !== 'page') await library.click();
  await page.locator('.dt-library').waitFor({ state: 'visible' });
  const tools = page.locator('.dt-advanced');
  if (!(await tools.evaluate((node) => node.open)))
    await tools.locator('summary').click();
  // The native disclosure can animate before its children become visible.
  // Wait for the tools a user can actually see, rather than only its open attribute.
  await tools.locator('[data-tool-type]').first().waitFor({ state: 'visible' });
};

// Phone editors live in the original modal parameter drawer. Close it before
// using the main navigation or plot, just as a person returns to the canvas.
exports.closeDrawer = async (page) => {
  const drawer = page.locator('#uiParameterDrawer');
  if ((await drawer.count()) && (await drawer.evaluate((node) => node.open))) {
    await page.locator('#uiDrawerClose').click();
    await page.waitForFunction(() => !document.getElementById('uiParameterDrawer').open);
  }
};
exports.toggleCustomization = async (page) => {
  await exports.closeDrawer(page);
  await page.locator('.layout-launch').click();
};

exports.openDrawer = async (page) => {
  await page.locator('#uiParameterDrawer').evaluate(async (node) => {
    await Promise.all(
      node.getAnimations().map((animation) => animation.finished.catch(() => {})),
    );
  });
  if (!(await page.locator('#uiParameterDrawer').evaluate((node) => node.open)))
    await page.locator('#uiParametersButton').click();
  await page.waitForFunction(() => {
    const node = document.getElementById('uiParameterDrawer');
    return (
      node.open &&
      node.getBoundingClientRect().left >= -1 &&
      node.getAnimations().every((animation) => animation.playState !== 'running')
    );
  });
};

// Native viewpoints now live in the content tree. Follow that navigation and
// return to the previous sidebar category so subsequent form interactions match
// the user's original task.
exports.selectViewpoint = async (page, view) => {
  const viewpoints = page.locator('.workbench-viewpoints');
  if (!(await viewpoints.count())) {
    await page.locator(`[data-view="${view}"]`).click();
    return;
  }
  const previous = await page
    .locator('[data-rail-section][aria-selected=true]')
    .getAttribute('data-rail-section');
  if (await page.evaluate(() => matchMedia('(max-width:760px)').matches))
    await exports.openDrawer(page);
  await page.locator('[data-rail-section=views]').click();
  await viewpoints.evaluate((node) => {
    node.closest('details').open = true;
  });
  await viewpoints.locator(`[data-view="${view}"]`).click();
  if (previous && previous !== 'views')
    await page.locator(`[data-rail-section="${previous}"]`).click();
  await exports.closeDrawer(page);
};
