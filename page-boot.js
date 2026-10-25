/** Pick the already generated language page before parsing visible content. */
(() => {
  const root = document.documentElement;
  const base = new URL('.', document.currentScript.src);
  // BEGIN GENERATED CATALOG
  // prettier-ignore
  const catalog = {
    "resourceVersion": "20261025-expressive109",
    "pages": [
      {
        "path": "index.html",
        "reading": false
      },
      {
        "path": "lab.html",
        "reading": false
      },
      {
        "path": "diagrams.html",
        "reading": false,
        "navigation": "lab.html"
      },
      {
        "path": "analemma.html",
        "reading": false,
        "navigation": "lab.html"
      },
      {
        "path": "sundial.html",
        "reading": false,
        "navigation": "lab.html"
      },
      {
        "path": "guide.html",
        "reading": true,
        "navigation": "docs.html"
      },
      {
        "path": "project-guide.html",
        "reading": true,
        "navigation": "docs.html"
      },
      {
        "path": "development-guide.html",
        "reading": true,
        "navigation": "docs.html"
      },
      {
        "path": "docs.html",
        "reading": false,
        "navigation": "docs.html"
      },
      {
        "path": "contact.html",
        "reading": false
      },
      {
        "path": "geography-review.html",
        "reading": false
      },
      {
        "path": "404.html",
        "reading": false
      },
      {
        "path": "space/index.html",
        "reading": false
      },
      {
        "path": "lunar/index.html",
        "reading": false,
        "navigation": "lab.html"
      }
    ],
    "groups": [
      [
        "天空与日影",
        "Sky & shadows"
      ],
      [
        "关联图解",
        "Related diagrams"
      ],
      [
        "对照与搭建",
        "Compare & build"
      ]
    ],
    "views": [
      {
        "id": "skyPanel",
        "group": 0,
        "labels": {
          "sun": [
            "天空与日影",
            "Sky & shadows"
          ],
          "moon": [
            "月球天空",
            "Lunar sky"
          ]
        }
      },
      {
        "id": "contextPanel",
        "group": 1,
        "labels": {
          "sun": [
            "地球与昼夜",
            "Earth & daylight"
          ],
          "moon": [
            "月相与关系",
            "Moon phase and relationships"
          ]
        }
      },
      {
        "id": "chartPanel",
        "group": 1,
        "labels": {
          "sun": [
            "全天高度曲线",
            "Daily altitude"
          ],
          "moon": [
            "逐日照明比例",
            "Daily illumination"
          ]
        }
      },
      {
        "id": "riseSetPanel",
        "group": 1,
        "labels": {
          "sun": [
            "日出日落方位",
            "Rise/set bearings"
          ],
          "moon": [
            "月出月落方位",
            "Moonrise and moonset"
          ]
        }
      },
      {
        "id": "solarGeometryPanel",
        "group": 1,
        "labels": {
          "sun": [
            "地轴与地平面",
            "Axis & horizon"
          ]
        }
      },
      {
        "id": "companionModule",
        "group": 1,
        "labels": {
          "moon": [
            "行星伴月",
            "Moon & planets"
          ]
        },
        "layout": {
          "moon": "solarGeometryPanel"
        }
      },
      {
        "id": "lunarOrbit",
        "group": 1,
        "labels": {
          "moon": [
            "地升地落",
            "Earthrise"
          ]
        }
      },
      {
        "id": "analemmaPanel",
        "group": 1,
        "labels": {
          "sun": [
            "日行迹",
            "Analemma"
          ]
        }
      },
      {
        "id": "solarCompare",
        "group": 2,
        "labels": {
          "sun": [
            "组合视图",
            "Combined views"
          ],
          "moon": [
            "组合视图",
            "Combined views"
          ]
        }
      },
      {
        "id": "solarStudy",
        "group": 2,
        "labels": {
          "sun": [
            "地点与时间对照",
            "Place & time comparison"
          ]
        },
        "editing": true,
        "sidebar": "conditions"
      },
      {
        "id": "sceneBuilder",
        "group": 2,
        "labels": {
          "sun": [
            "搭建实验",
            "Build experiment"
          ],
          "moon": [
            "搭建实验",
            "Build experiment"
          ]
        },
        "editing": true,
        "sidebar": "references"
      }
    ],
    "navigation": [
      [
        "index.html",
        [
          "欢迎页",
          "Welcome"
        ]
      ],
      [
        "lab.html",
        [
          "实验台",
          "Lab"
        ]
      ],
      [
        "docs.html",
        [
          "文档中心",
          "Documentation"
        ]
      ],
      [
        "space/",
        [
          "三维天空",
          "3D Sky"
        ]
      ]
    ],
    "groupIds": [
      "sky",
      "related",
      "compare"
    ]
  };
  // END GENERATED CATALOG
  const viewFor = (id, body) =>
    catalog.views.find((v) => v.id === id && v.labels[body]) ||
    catalog.views.find((v) => v.layout?.[body] === id);
  function freezeCatalog(value) {
    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) freezeCatalog(child);
      Object.freeze(value);
    }
    return value;
  }
  window.SkySiteCatalog = freezeCatalog({
    ...catalog,
    availableViews: (body, editing = true) =>
      catalog.views.filter((v) => v.labels[body] && (editing || !v.editing)),
    label: (id, body) => {
      const view = viewFor(id, body) || catalog.views.find((v) => v.id === id);
      return view && (view.labels[body] || view.labels.sun || view.labels.moon);
    },
    layoutId: (id, body) => viewFor(id, body)?.layout?.[body] || id,
  });
  const known = new Set(catalog.pages.map((page) => page.path));
  const readingPages = new Set(
    catalog.pages
      .filter((page) => page.reading)
      .map((page) => page.path.replace(/\.html$/, '')),
  );
  function readingKey(url) {
    return (
      url.pathname
        .split('/')
        .filter(Boolean)
        .pop()
        ?.replace(/\.en(?:\.html)?$|\.html$/, '') || ''
    );
  }
  const entryUrl = new URL(location.href),
    entryTheme = entryUrl.searchParams.get('sky-reading');
  const carriedSeen = (entryUrl.searchParams.get('sky-reading-seen') || '')
    .split(',')
    .filter((page) => readingPages.has(page));
  let seenReadings = new Set(),
    readingStorageWorks = true;
  const readingNamePrefix = 'skymotion-reading:' + base.origin + base.pathname + '|';
  let readingWindow = {};
  const ownsWindowName = !window.name || window.name.startsWith(readingNamePrefix);
  if (window.name.startsWith(readingNamePrefix)) {
    try {
      const saved = JSON.parse(window.name.slice(readingNamePrefix.length));
      readingWindow = Array.isArray(saved)
        ? { seen: saved }
        : saved && typeof saved === 'object'
          ? saved
          : {};
    } catch {}
  }
  const newReadingWindow = ownsWindowName && typeof readingWindow.windowId !== 'string';
  if (newReadingWindow)
    readingWindow.windowId =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
  function saveReadingWindow() {
    if (ownsWindowName) {
      readingWindow.seen = [...seenReadings];
      window.name = readingNamePrefix + JSON.stringify(readingWindow);
    }
  }
  function mergeReadingFallback() {
    if (!readingStorageWorks && window.name.startsWith(readingNamePrefix)) {
      try {
        const payload = JSON.parse(window.name.slice(readingNamePrefix.length));
        const saved = Array.isArray(payload) ? payload : payload?.seen;
        if (Array.isArray(saved))
          saved
            .filter((page) => readingPages.has(page))
            .forEach((page) => seenReadings.add(page));
      } catch {}
    }
  }
  let internalReferrer = false,
    welcomeReferrer = false;
  try {
    const referrer = new URL(document.referrer);
    internalReferrer =
      referrer.origin === base.origin && referrer.pathname.startsWith(base.pathname);
    welcomeReferrer =
      internalReferrer &&
      ['', 'index.html', 'index.en.html'].includes(
        referrer.pathname.slice(base.pathname.length),
      );
  } catch {}
  let embeddedAppFrame = false;
  try {
    embeddedAppFrame =
      window.parent !== window &&
      window.parent.location.origin === base.origin &&
      window.parent.location.pathname.startsWith(base.pathname);
  } catch {}
  const navigationType =
    performance.getEntriesByType('navigation')[0]?.type ||
    { 0: 'navigate', 1: 'reload', 2: 'back_forward' }[performance.navigation?.type] ||
    'navigate';
  // A popup may clone sessionStorage and report more than one history entry.
  // Its browsing-context name is independent, so it gets its own visit identity.
  const freshVisit =
    !embeddedAppFrame &&
    navigationType === 'navigate' &&
    !carriedSeen.length &&
    (newReadingWindow || !internalReferrer || (!ownsWindowName && history.length === 1));
  try {
    const saved = JSON.parse(sessionStorage.getItem('skymotion-reading-seen') || '[]');
    if (!freshVisit && Array.isArray(saved))
      seenReadings = new Set(saved.filter((page) => readingPages.has(page)));
    if (freshVisit) {
      sessionStorage.removeItem('skymotion-reading-seen');
      sessionStorage.removeItem('skymotion-ad-astra');
    }
  } catch {
    readingStorageWorks = false;
  }
  if (freshVisit) readingWindow.seen = [];
  if (ownsWindowName) window.name = readingNamePrefix + JSON.stringify(readingWindow);
  if (!freshVisit) mergeReadingFallback();
  if (!freshVisit && Array.isArray(history.state?.skyReadingSeen))
    history.state.skyReadingSeen
      .filter((page) => readingPages.has(page))
      .forEach((page) => seenReadings.add(page));
  carriedSeen.forEach((page) => seenReadings.add(page));
  saveReadingWindow();
  window.skyMarkReadingSeen = (page) => {
    seenReadings.add(page);
    try {
      sessionStorage.setItem('skymotion-reading-seen', JSON.stringify([...seenReadings]));
    } catch {
      readingStorageWorks = false;
    }
    saveReadingWindow();
    history.replaceState(
      { ...history.state, skyReadingSeen: [...seenReadings] },
      '',
      location.href,
    );
  };
  // Carry source theme and, when storage is denied, this visit's reading state.
  document.addEventListener(
    'click',
    (event) => {
      if (
        event.button !== 0 ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = event.target.closest?.('a[href]');
      if (
        !anchor ||
        anchor.hasAttribute('download') ||
        (anchor.target && anchor.target !== '_self')
      )
        return;
      const target = new URL(anchor.href, location.href);
      if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname))
        return;
      let path = target.pathname.slice(base.pathname.length);
      if (!path || path.endsWith('/')) path += 'index.html';
      if (!path.endsWith('.html')) path += '.html';
      if (!known.has(path.replace(/\.en\.html$/, '.html'))) return;
      if (readingKey(target) === readingKey(new URL(location.href))) return;
      mergeReadingFallback();
      if (!readingStorageWorks && seenReadings.size)
        target.searchParams.set('sky-reading-seen', [...seenReadings].join(','));
      if (readingPages.has(readingKey(target)) && !seenReadings.has(readingKey(target))) {
        const night =
          document.body.dataset.page === 'welcome' ||
          document.body.classList.contains('space-immersive') ||
          root.classList.contains('space-immersive');
        target.searchParams.set('sky-reading', night ? 'night' : 'paper');
      } else target.searchParams.delete('sky-reading');
      anchor.href = target.href;
    },
    { capture: true },
  );
  const isReading = readingPages.has(readingKey(entryUrl));
  if (isReading && !seenReadings.has(readingKey(entryUrl))) {
    const theme = ['night', 'paper'].includes(entryTheme)
      ? entryTheme
      : welcomeReferrer
        ? 'night'
        : 'paper';
    window.skyDocumentEntranceContext = { page: readingKey(entryUrl), theme };
    root.dataset.documentEntrance = theme;
    root.style.backgroundColor = theme === 'night' ? '#0b131e' : '#f4f7f8';
  }
  window.skyResetDocumentEntrance = () => {
    delete root.dataset.documentEntrance;
    root.style.removeProperty('background-color');
  };
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      if (window.skyDocumentEntranceContext && !window.skyDocumentEntranceInitialized)
        window.skyResetDocumentEntrance();
    },
    { once: true },
  );
  function localeUrl(next, value = location.href) {
    const url = new URL(value, document.baseURI);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname))
      return null;
    let path = url.pathname.slice(base.pathname.length);
    if (!path || path.endsWith('/')) path += 'index.html';
    if (!path.endsWith('.html')) path += '.html';
    const source = path.replace(/\.en\.html$/, '.html');
    if (!known.has(source)) return null;
    url.pathname =
      base.pathname + (next === 'en' ? source.replace(/\.html$/, '.en.html') : source);
    let explicitPreference = false;
    try {
      explicitPreference = Boolean(sessionStorage.getItem('skymotion-explicit-language'));
    } catch {}
    if (url.searchParams.has('lang') || explicitPreference)
      url.searchParams.set('lang', next);
    return url;
  }
  window.skyLocaleUrl = localeUrl;
  const rendered = root.dataset.renderedLanguage || 'zh';
  let preferred = null;
  try {
    preferred = localStorage.getItem('skymotion-language');
  } catch {}
  const explicit = new URLSearchParams(location.search).get('lang');
  let language = explicit || preferred || rendered;
  language = language === 'en' ? 'en' : 'zh';
  if (explicit === 'en' || explicit === 'zh') {
    try {
      localStorage.setItem('skymotion-language', language);
    } catch {}
    try {
      sessionStorage.setItem('skymotion-explicit-language', language);
    } catch {}
  }
  root.dataset.languagePending = '';
  const guard = document.createElement('style');
  guard.textContent =
    'html[data-language-pending] body,html[data-language-pending] body *{visibility:hidden!important}html[data-language-pending]{background:#f4f7f8}html[data-language-pending]::after{content:"";position:fixed;left:calc(50% - 12px);top:calc(50% - 12px);width:24px;height:24px;border:2px solid #cdd9de;border-top-color:#24576b;border-radius:50%;animation:sky-font-loading 1s linear infinite}@keyframes sky-font-loading{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){html[data-language-pending]::after{animation:none}}';
  guard.textContent +=
    'html[data-document-entrance] body > :not(.document-entrance):not(.font-load-notice){visibility:hidden!important}html[data-document-entrance]::after{display:none}';
  document.head.append(guard);
  if (rendered !== language) {
    const target = localeUrl(language);
    if (target && target.pathname !== location.pathname) {
      window.skyPageRedirecting = true;
      location.replace(target.href);
      return;
    }
  }
  if (
    entryUrl.searchParams.has('sky-reading') ||
    entryUrl.searchParams.has('sky-reading-seen')
  ) {
    entryUrl.searchParams.delete('sky-reading');
    entryUrl.searchParams.delete('sky-reading-seen');
    history.replaceState(
      { ...history.state, skyReadingSeen: [...seenReadings] },
      '',
      entryUrl.href,
    );
  }
  window.skyPageLanguage = language;
  root.lang = language === 'en' ? 'en' : 'zh-CN';
  root.dataset.languagePending = '';
  const files =
    language === 'en'
      ? ['charter_regular.woff2', 'charter_bold.woff2']
      : ['reading-regular.woff2', 'reading-bold.woff2'];
  for (const file of files) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.fetchPriority = 'high';
    link.href = new URL(
      'fonts/' + file + (language === 'zh' ? '?v=20261016-font41' : ''),
      base,
    );
    document.head.append(link);
  }
  const preparedFonts = new Map();
  window.skyPrepareFonts = (locale) => {
    locale = locale === 'en' ? 'en' : 'zh';
    if (!preparedFonts.has(locale)) {
      const family = locale === 'en' ? 'SkyMotion Charter' : 'SkyMotion Reading';
      const variants =
        locale === 'en'
          ? ['charter_regular.woff2', 'charter_bold.woff2']
          : ['reading-regular.woff2', 'reading-bold.woff2'];
      let expired = false,
        timer;
      const loading = Promise.all(
        variants.map((file, index) => {
          // Charter's legacy descent is positive; normalize line metrics for native text controls.
          const metrics =
            locale === 'en'
              ? { ascentOverride: '98%', descentOverride: '24%', lineGapOverride: '0%' }
              : {};
          const face = new FontFace(
            family,
            `url("${new URL('fonts/' + file + (locale === 'zh' ? '?v=20261016-font41' : ''), base)}")`,
            { weight: index ? '600 900' : '400 500', display: 'block', ...metrics },
          );
          return face.load().then((loaded) => {
            if (!expired) document.fonts.add(loaded);
            return loaded;
          });
        }),
      );
      const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          reject(new Error('Font loading timed out'));
        }, 8000);
      });
      const promise = Promise.race([loading, deadline]).finally(() =>
        clearTimeout(timer),
      );
      preparedFonts.set(locale, promise);
      promise.catch(() => {
        if (preparedFonts.get(locale) === promise) preparedFonts.delete(locale);
      });
    }
    return preparedFonts.get(locale);
  };
  window.skyFirstFontsReady = window.skyPrepareFonts(language).then(() => {
    // Static content already has the right language. It need not wait for experiments to initialize.
    delete root.dataset.languagePending;
    root.dataset.fontsReady = '';
    document.dispatchEvent(new Event('skymotion:fonts-ready'));
    performance.mark('skymotion-fonts-visible');
  });
  function showFontFailure() {
    root.dataset.fontLoadError = '';
    delete root.dataset.languagePending;
    const show = () => {
      if (document.querySelector('.font-load-notice')) return;
      const notice = document.createElement('aside');
      notice.className = 'font-load-notice';
      notice.dataset.i18nSkip = '';
      notice.setAttribute('role', 'status');
      const english = root.lang === 'en';
      const message = document.createElement('span');
      message.textContent = english
        ? 'Font loading failed. A fallback font is in use.'
        : '字体未能加载，暂用备用字体。';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = english ? 'Retry fonts' : '重试字体';
      retry.onclick = async () => {
        retry.disabled = true;
        try {
          await window.skyPrepareFonts(
            document.documentElement.lang === 'en' ? 'en' : 'zh',
          );
          delete root.dataset.fontLoadError;
          root.dataset.fontsReady = '';
          notice.remove();
          document.dispatchEvent(new Event('skymotion:fonts-ready'));
          if (typeof schedule === 'function') schedule();
        } catch {
          retry.disabled = false;
        }
      };
      notice.append(message, retry);
      document.body.append(notice);
    };
    if (document.body) show();
    else document.addEventListener('DOMContentLoaded', show, { once: true });
  }
  window.skyFirstFontsReady.catch(showFontFailure);
})();
