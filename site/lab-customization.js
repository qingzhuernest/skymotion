/** A mode switch for the existing laboratory, preserving its native viewpoint controls. */
(() => {
  if (!['lab', 'analemma'].includes(document.body.dataset.page)) return;
  const heading = document.querySelector('.ui-heading');
  if (!heading) return;
  let active = false;
  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'layout-launch';
  launch.dataset.i18nSkip = '';
  launch.disabled = true;
  launch.setAttribute('aria-controls', 'diagram-tool-panel');
  heading.append(launch);
  SkyCustomizationMode.install({
    launch,
    isActive: () => active,
    apply(value) {
      active = value;
      if (!active && uiWorkspace?.selected === 'sceneBuilder')
        uiWorkspace.selected = 'contextPanel';
    },
    changed: () => schedule(),
  });
  for (const b of document.querySelectorAll('[data-view],.ui-phase-button,.ui-moon-sky-button'))
    b.addEventListener('click', () => {
      if (uiWorkspace?.selected === 'sceneBuilder') {
        uiWorkspace.selected = 'contextPanel';
        schedule();
      }
    });
  schedule();
})();
