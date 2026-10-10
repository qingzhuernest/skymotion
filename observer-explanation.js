/** Explain view clipping without altering the sky projection or scientific trajectory. */
(() => {
  if (document.body.dataset.page !== 'lab') return;
  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.querySelector('.ui-viewbar');
    const plot = document.querySelector('.ui-plot');
    if (!bar || !plot) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'observer-explanation-button';
    button.textContent = 'ⓘ 轨迹说明';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'observerExplanation');
    const dialog = document.createElement('dialog');
    dialog.id = 'observerExplanation';
    dialog.className = 'observer-explanation';
    dialog.tabIndex = -1;
    dialog.setAttribute('aria-labelledby', 'observerExplanationTitle');
    dialog.innerHTML = `
      <header><h2 id="observerExplanationTitle">为什么轨迹没有接到地平线？</h2></header>
      <p>金黄色是太阳、浅蓝色是月球的当天轨迹。天空与地面的分界线表示<strong>高度0°的地平线</strong>；天体升落是视线方向穿过地平线，并不是天体落到地面。</p>
      <ul>
        <li><strong>转到身后：</strong>这张图只画面向的前方半球。轨迹到达左右侧的视野边界时会截断，此处仍可能高于地平线；左右边界在正投影中呈弧形，不等于图片的竖直边缘。拖动转身，就能看到另一段轨迹。地面的方位盘和网格随视角转动，帮助辨认转向；上方箭头表示正前方，蓝点表示观察者站位。</li>
        <li><strong>当日时间端点：</strong>轨迹只覆盖所选当地日期00:00—24:00。月球在一天内还沿轨道运动，时间端点可能在天空中，也不一定重合；这不是月出或月落。</li>
        <li><strong>真正的升落：</strong>只有高度降到或升过0°时，轨迹才与地平线相交。本项目按天体中心计算，未计大气折射、视半径和地形遮挡。</li>
      </ul>
      <p class="observer-explanation-example">例如：北京夏至附近，太阳从东北升起、西北落下。面向南时，升落位置在身后，因此前方太阳轨迹的两端可以停在空中；转向东、北或西再比较。</p>`;
    bar.append(button);
    document.body.append(dialog);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let animation = null, generation = 0;
    function close() {
      if (!dialog.open) return;
      const token = ++generation;
      animation?.cancel();
      animation = reduced.matches ? null : dialog.animate([
        { opacity: 1, transform: 'translateY(0) scale(1)' },
        { opacity: 1, transform: 'translateY(-1px) scale(1.012)', offset: .18 },
        { opacity: 0, transform: 'translateY(12px) scale(.96)' },
      ], { duration: 240, easing: 'cubic-bezier(.2,0,0,1)' });
      (animation?.finished.catch(() => {}) || Promise.resolve()).then(() => {
        if (token !== generation) return;
        dialog.close(); button.focus({ preventScroll: true });
      });
    }
    button.onclick = () => {
      generation++; animation?.cancel();
      if (!dialog.open) dialog.showModal();
      if (!reduced.matches) animation = dialog.animate([
        { opacity: .35, transform: 'translateY(12px) scale(.94)' },
        { opacity: 1, transform: 'translateY(-1px) scale(1.016)', offset: .7 },
        { opacity: 1, transform: 'translateY(.3px) scale(.997)', offset: .87 },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ], { duration: 320, easing: 'cubic-bezier(.2,0,0,1)' });
      dialog.focus({ preventScroll: true });
    };
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right ||
          event.clientY < box.top || event.clientY > box.bottom) close();
    });
    function sync() {
      button.hidden = state.view !== 'observer' || plot.dataset.kind !== 'sky';
    }
    const observer = new MutationObserver(sync);
    observer.observe(bar, { attributes: true, subtree: true, attributeFilter: ['aria-pressed'] });
    observer.observe(plot, { attributes: true, attributeFilter: ['data-kind'] });
    sync();
  }, { once: true });
})();
