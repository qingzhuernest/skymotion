/** Reading navigation: native anchors remain usable without JavaScript. */
(() => {
  const toc = document.querySelector('.document-toc');
  const content = document.querySelector('.document-content');
  if (!toc || !content) return;
  const topButton = document.createElement('button');
  topButton.className = 'document-back-top';
  topButton.type = 'button';
  topButton.hidden = true;
  topButton.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 6-6 6 6M12 6v14"/></svg><span></span>';
  const label = () => {
    topButton.lastElementChild.textContent =
      document.documentElement.lang === 'en' ? 'Back to top' : '返回顶部';
  };
  label();
  topButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: !window.SkyPreferences?.smoothScroll
        ? 'auto'
        : 'smooth',
    });
    const heading = document.querySelector('.document-title');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  });
  document.body.append(topButton);
  const revealDocument = () => {
    const tabs = document.querySelector('.document-links');
    const selected = tabs?.querySelector('[aria-current="page"]');
    if (selected) tabs.scrollLeft = selected.offsetLeft - tabs.offsetLeft - 16;
  };
  Promise.resolve(window.skyFirstFontsReady).then(revealDocument);
  document.addEventListener('skymotion:language', revealDocument);
  const sections = [...content.querySelectorAll(':scope > section')];
  const links = [...toc.querySelectorAll('a')];
  let pending = false;
  function update() {
    pending = false;
    topButton.hidden =
      scrollY < Math.min(480, innerHeight * 0.75) ||
      !!document.querySelector('.document-entrance');
    let current = sections[0];
    for (const section of sections)
      if (section.getBoundingClientRect().top <= 100) current = section;
    for (const link of links) {
      if (link.hash === '#' + current?.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  const schedule = () => {
    if (!pending) {
      pending = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('load', schedule, { once: true });
  document.addEventListener('skymotion:language', label);
  update();
})();
