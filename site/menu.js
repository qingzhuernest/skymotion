/**
 * 分层菜单状态与各模块的可用性。
 */
/* Native disclosure sections and a modal mobile menu share the same controls. */
let menuReturnFocus = null;
function updateMenu() {
  const moon = state.body === 'moon',
    unified = document.body.dataset.page === 'diagrams';
  $('modelMenu').hidden = moon;
  // The unified workspace owns view-dependent visibility and captions.
  if (!unified) {
    $('seasonMenu').hidden = moon;
    $('shadowMenu').hidden = moon;
  }
  $('geometryLink').hidden = moon;
  $('lifeDevicesMenu').hidden = moon;
  const name = selectedPlaceName();
  $('conditionsSummary').textContent = name + ' · ' + state.date.slice(5);
  $('coordinatesSummary').textContent = coord(state.lat, 'lat') + ' / ' + coord(state.lon, 'lon');
  $('seasonSummary').textContent = Number(state.date.slice(5, 7)) + '月';
  $('modelSummary').textContent = state.manual
    ? '理想实验'
    : state.solarDateMode
      ? '固定时刻逐日观察'
      : '日期观测';
  if (!unified) {
    $('displaySummary').textContent =
      [
        state.track ? '轨迹' : null,
        state.angles ? '辅助线' : null,
        !moon && state.shadow ? '日影' : null,
        !moon && state.shadowTrace ? '杆尖影迹' : null,
      ]
        .filter(Boolean)
        .join(' · ') || '辅助显示已关闭';
  }
  $('chartLink').textContent = moon ? '逐日可见月面照明比例' : '全天太阳高度曲线';
  $('contextLink').textContent = moon ? '月相与日地月关系' : '太阳直射点与昼夜';
  $('eventsLink').textContent = moon ? '月出月落时刻与方位' : '日出日落时刻与方位';
  if (!unified) $('reset').textContent = moon ? '重置当前月相实验' : '重置当前太阳实验';
  $('modelMenu').classList.toggle('ideal-active', !moon && state.manual);
  $('date').disabled = !moon && state.manual;
  $('idealDateHint').hidden = moon || !state.manual;
  $('prevDay').disabled = (!moon && state.manual) || state.date === '1900-01-01';
  $('nextDay').disabled = (!moon && state.manual) || state.date === '2100-12-31';
  $('date').title =
    !moon && state.manual ? '理想实验不使用日期；可切回日期观测或拖动全年滑块。' : '观察日期';
}
function closeMenu() {
  if ($('settingsDialog').open) $('settingsDialog').close();
}
function initMenu() {
  const dialog = $('settingsDialog'),
    controls = $('controls'),
    dock = $('controlsDock'),
    mobile = matchMedia('(max-width:760px)');
  $('settingsBtn').onclick = () => {
    if (!mobile.matches) return;
    menuReturnFocus = document.activeElement;
    $('mobileControlsHost').append(controls);
    stop();
    dialog.showModal();
    $('settingsBtn').setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    $('closeSettings').focus();
  };
  $('closeSettings').onclick = () => closeMenu();
  $('dateObservationRestore').onclick = () => setDate(state.date);
  $('place').addEventListener('change', () => {
    if ($('place').value === 'custom') {
      $('coordinatesMenu').open = true;
      focusAfterReveal($('latInput'));
      $('latInput').select();
    }
  });
  dialog.addEventListener('close', () => {
    dock.append(controls);
    document.body.classList.remove('menu-open');
    $('settingsBtn').setAttribute('aria-expanded', 'false');
    const returnFocus = menuReturnFocus;
    menuReturnFocus = null;
    requestAnimationFrame(() => {
      const canFocus = (node) =>
        node?.isConnected && !node.closest('[inert]') && node.getClientRects().length > 0;
      if (canFocus(returnFocus)) {
        returnFocus.focus({ preventScroll: true });
        return;
      }
      const fallback = [
        '.motion-menu-edge:not([hidden])',
        '.motion-menu-grip:not([hidden])',
        '#uiParametersButton:not([hidden])',
        '#settingsBtn:not([hidden])',
      ]
        .map((selector) => document.querySelector(selector))
        .find(canFocus);
      fallback?.focus({ preventScroll: true });
    });
    schedule();
  });
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      closeMenu();
  });
  mobile.addEventListener('change', () => {
    if (!mobile.matches) closeMenu();
    schedule();
  });
  // Pure parameter disclosures do not change astronomy or the plotted canvas.
  for (const details of controls.querySelectorAll('details'))
    details.addEventListener('toggle', () => {
      if (details.querySelector('canvas')) schedule();
    });
  document.querySelectorAll('[data-study-target]').forEach(
    (b) =>
      (b.onclick = () => {
        const target = $(b.dataset.studyTarget);
        if (target.id === 'sundialPanel') {
          if (state.body !== 'sun') return;
          if (dialog.open) {
            dialog.addEventListener('close', () => openSundialDialog(), { once: true });
            closeMenu();
          } else openSundialDialog();
          return;
        }
        if (target.hidden) return;
        const disclosure = target.closest('details');
        if (disclosure) disclosure.open = true;
        const wasOpen = dialog.open;
        closeMenu();
        const jump = () => {
          target.scrollIntoView({
            behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth',
            block: 'start',
          });
          focusAfterReveal(target);
        };
        if (wasOpen) dialog.addEventListener('close', jump, { once: true });
        else jump();
      }),
  );
}
