/** Optional original-diagram + 3D workspace. The parent owns the only scientific clock. */
(function () {
  'use strict';
  if (document.body.dataset.page !== 'diagrams' || !uiWorkspace) return;
  const plot = uiWorkspace.plot;
  const heading = document.querySelector('.ui-heading');
  const parameters = document.getElementById('uiParametersButton');
  if (!plot || !heading) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ui-linked-toggle';
  button.textContent = '三维对照';
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-controls', 'uiLinkedScenes');
  // Keep it outside the diagram tablist: tab routing only accepts diagram buttons.
  heading.insertBefore(button, parameters || null);

  const wrapper = document.createElement('div');
  wrapper.id = 'uiLinkedScenes';
  wrapper.className = 'ui-linked-scenes';
  const note = document.createElement('p');
  note.className = 'ui-linked-note';
  note.textContent = '原图解显示当地 / 全球条件；三维说明空间关系，地球姿态按UTC，比例为示意。';
  const pane = document.createElement('section');
  pane.className = 'ui-linked-space';
  pane.setAttribute('aria-label', '同一 UTC 时刻的三维空间关系');
  plot.parentNode.insertBefore(wrapper, plot);
  wrapper.append(note, plot, pane);

  const explanation = document.createElement('p');
  explanation.className = 'ui-linked-menu-note';
  explanation.textContent =
    '三维对照：原图解用于读取当地或全球条件；三维画面解释空间关系，使用同一 UTC。大小与距离为示意，地球姿态按UTC计算，不代替原图解的地理读数。';
  const rail = document.querySelector('.ui-parameters');
  if (rail) rail.append(explanation);

  let enabled = false;
  let frame = null;
  let lastMessage = '';
  const initialRequest = new URLSearchParams(location.search).get('compare') === '1';

  function blockReason() {
    if (state.body === 'sun' && state.manual) return '先切回日期观测，再与真实星历三维模型对照。';
    if (uiWorkspace.selected === 'solarCompare') return '请选择单张关联图解，再开启三维对照。';
    return '';
  }

  function redrawAfterLayout() {
    // A single resize invalidation after a user layout change, never a parallel animation loop.
    requestAnimationFrame(() => {
      if (typeof schedule === 'function') schedule();
      else window.dispatchEvent(new Event('resize'));
    });
  }

  function setEnabled(next) {
    if (next && blockReason()) return;
    if (enabled === next) return;
    enabled = next;
    if (enabled && typeof settleMotion === 'function') settleMotion();
    wrapper.classList.toggle('is-linked', enabled);
    button.setAttribute('aria-pressed', String(enabled));
    lastMessage = '';
    if (enabled) {
      frame = document.createElement('iframe');
      frame.title = '三维太阳系空间关系：与原图解共享 UTC';
      frame.className = 'ui-linked-frame';
      frame.src = 'space/?embed=1';
      frame.setAttribute('loading', 'eager');
      frame.addEventListener('load', () => {
        lastMessage = '';
        sync();
      });
      pane.append(frame);
    } else {
      // Removing the browsing context stops WebGL and playback while the original plot remains.
      if (frame) frame.remove();
      frame = null;
    }
    redrawAfterLayout();
  }

  function sync() {
    const reason = blockReason();
    button.disabled = Boolean(reason);
    button.title = reason || '原关联图解与三维空间关系并排；共用下方时间控制。';
    if (reason && enabled) setEnabled(false);
    if (!enabled || !frame?.contentWindow) return;
    const date = instantUTC(state.time, state.date, state.lon);
    if (!date || !Number.isFinite(date.getTime())) return;
    const message = {
      type: 'skymotion:sync',
      date: date.toISOString(),
      view: state.body === 'moon' ? 'earthmoon' : 'overview',
    };
    const key = JSON.stringify(message);
    if (key === lastMessage) return;
    lastMessage = key;
    frame.contentWindow.postMessage(message, location.origin);
  }

  button.addEventListener('click', () => setEnabled(!enabled));
  window.addEventListener('message', (event) => {
    if (
      event.origin !== location.origin ||
      event.source !== frame?.contentWindow ||
      event.data?.type !== 'skymotion:ready'
    )
      return;
    lastMessage = '';
    sync();
  });
  window.SolarSpaceLabCompare = {
    sync,
    readSelection: () => frame?.contentWindow?.SolarSpaceView?.readSelection() || null,
    restore(next, selection) {
      setEnabled(next);
      const current = frame;
      if (!selection || !current) return;
      const apply = () => {
        if (frame === current) current.contentWindow?.SolarSpaceView?.restoreSelection(selection);
      };
      if (current.contentWindow?.SolarSpaceView) apply();
      else current.addEventListener('load', apply, { once: true });
    },
    get enabled() {
      return enabled;
    },
  };
  sync();
  if (initialRequest && !blockReason()) setEnabled(true);
})();
