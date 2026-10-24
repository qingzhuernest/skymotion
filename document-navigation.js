/** Reading navigation: native anchors remain usable without JavaScript. */
(() => {
  const toc = document.querySelector('.document-toc');
  const content = document.querySelector('.document-content');
  if (!toc || !content) return;
  const wide = matchMedia('(min-width: 1280px)');
  const syncLayout = () => {
    toc.open = wide.matches;
  };
  syncLayout();
  wide.addEventListener('change', syncLayout);
  const progress = document.createElement('progress');
  progress.className = 'document-reading-progress';
  progress.max = 100;
  progress.setAttribute(
    'aria-label',
    document.documentElement.lang === 'en' ? 'Reading progress' : '阅读进度',
  );
  document.querySelector('.document-header').append(progress);
  const sections = [...content.querySelectorAll(':scope > section')];
  const links = [...toc.querySelectorAll('a')];
  let pending = false;
  function update() {
    pending = false;
    const maximum = document.documentElement.scrollHeight - innerHeight;
    progress.value =
      maximum > 0 ? Math.min(100, Math.max(0, (scrollY / maximum) * 100)) : 100;
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
  document.addEventListener('skymotion:language', () => {
    progress.setAttribute(
      'aria-label',
      document.documentElement.lang === 'en' ? 'Reading progress' : '阅读进度',
    );
  });
  update();
})();
