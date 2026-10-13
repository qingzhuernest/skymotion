/** Shared bilingual presentation. Astronomy values, DOM IDs and input values remain unchanged. */
(() => {
  const base = new URL(".", document.currentScript.src);
  const storageKey = "skymotion-language";
  let language = window.skyPageLanguage || document.documentElement.dataset.renderedLanguage || "zh";
  if (!window.skyPageLanguage) {
    try { language = new URLSearchParams(location.search).get("lang") || localStorage.getItem(storageKey) || language; } catch {}
  }
  language = !window.skyLanguageBootExpired && language === "en" ? "en" : "zh";
  let dictionary = {},
    fragments = null;
  const cache = new Map(),
    originals = new WeakMap(),
    attributes = new WeakMap();
  const chinese = /[\u3400-\u9fff]/;
  const normalize = (value) => String(value).replace(/\s+/g, " ").trim();
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function installDictionary(maps) {
    const merged = Object.assign({}, ...maps, { "☾ 月相": "☾ Moon" });
    dictionary = {};
    // Prefer canonical keys: raw whitespace variants must not swallow word separators.
    for (const [key, value] of Object.entries(merged))
      if (key === normalize(key)) dictionary[key] = value;
    for (const [key, value] of Object.entries(merged))
      if (!(normalize(key) in dictionary)) dictionary[normalize(key)] = value;
    const terms = Object.keys(dictionary)
      .filter((key) => chinese.test(key) && key.length <= 120)
      .sort((a, b) => b.length - a.length);
    fragments = new RegExp(terms.map(escape).join("|"), "g");
    cache.clear();
  }
  if (window.skyEnglishDictionary) installDictionary([window.skyEnglishDictionary]);
  function translate(value) {
    if (language !== "en" || !chinese.test(String(value))) return value;
    const source = String(value),
      key = normalize(source);
    if (cache.has(source)) return cache.get(source);
    let result = dictionary[key];
    if (!result) {
      result = key
        .replace(
          /(\d{4})年(\d{1,2})月(\d{1,2})日/g,
          (_, y, m, d) => `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`,
        )
        .replace(
          /(\d{1,2})月(\d{1,2})日/g,
          (_, m, d) => `${m.padStart(2, "0")}/${d.padStart(2, "0")}`,
        );
      if (fragments)
        result = result.replace(fragments, (match) => dictionary[match]);
    }
    if (cache.size >= 4096) cache.clear();
    cache.set(source, result);
    return result;
  }
  window.skyTranslate = translate;
  window.skyLanguage = () => language;
  // Canvas annotations share the same translations and English font as DOM controls.
  for (const method of ["fillText", "strokeText", "measureText"]) {
    const native = CanvasRenderingContext2D.prototype[method];
    CanvasRenderingContext2D.prototype[method] = function (value, ...args) {
      const font = this.font;
      if (language === "en")
        this.font = font.replace(
          /"SkyMotion Reading"|SkyMotion Reading/g,
          '"SkyMotion Charter"',
        );
      try {
        return native.call(this, translate(value), ...args);
      } finally {
        this.font = font;
      }
    };
  }
  const skipped = (element) =>
    element.closest("script,style,code,pre,[data-i18n-skip]");
  function text(node) {
    if (!node.parentElement || skipped(node.parentElement)) return;
    const current = node.nodeValue;
    if (!originals.has(node) && node.parentElement.dataset.i18nCn) {
      try {
        const pairs = JSON.parse(node.parentElement.dataset.i18nCn);
        if (Object.prototype.hasOwnProperty.call(pairs,current)) originals.set(node,{zh:pairs[current],en:current});
      } catch {}
    }
    const saved = originals.get(node);
    if (language === "zh") {
      if (saved && current === saved.en) node.nodeValue = saved.zh;
      return;
    }
    if (!chinese.test(current)) return;
    let en = translate(current);
    // Preserve word boundaries around inline emphasis and links in English prose.
    if (
      node.previousSibling?.nodeType === Node.ELEMENT_NODE &&
      /[A-Za-z0-9]$/.test(node.previousSibling.textContent) &&
      /^[A-Za-z0-9]/.test(en)
    )
      en = " " + en;
    if (
      node.nextSibling?.nodeType === Node.ELEMENT_NODE &&
      /[A-Za-z0-9]$/.test(en) &&
      /^[A-Za-z0-9]/.test(node.nextSibling.textContent)
    )
      en += " ";
    if (en !== current) {
      originals.set(node, { zh: current, en });
      node.nodeValue = en;
    }
  }
  const translatedAttributes = ["title", "aria-label", "placeholder", "alt"];
  function element(node) {
    if (skipped(node)) return;
    let saved = attributes.get(node);
    if (!saved) {
      saved = {};
      if (node.dataset.i18nCnAttrs) {
        try { for (const [name,zh] of Object.entries(JSON.parse(node.dataset.i18nCnAttrs))) saved[name] = {zh,en:node.getAttribute(name)}; } catch {}
      }
      attributes.set(node, saved);
    }
    for (const name of translatedAttributes) {
      const current = node.getAttribute(name);
      if (current === null) continue;
      if (language === "zh") {
        if (saved[name] && current === saved[name].en)
          node.setAttribute(name, saved[name].zh);
      } else if (chinese.test(current)) {
        const en = translate(current);
        if (en !== current) {
          saved[name] = { zh: current, en };
          node.setAttribute(name, en);
        }
      }
    }
  }
  function walk(root) {
    if (root.nodeType === Node.TEXT_NODE) return text(root);
    if (
      root.nodeType !== Node.ELEMENT_NODE &&
      root.nodeType !== Node.DOCUMENT_NODE
    )
      return;
    if (root.nodeType === Node.ELEMENT_NODE) element(root);
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.TEXT_NODE) text(node);
      else element(node);
    }
  }
  let button,
    dictionaryReady = false;
  function apply(next, persist = true) {
    language = next === "en" ? "en" : "zh";
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    if (button) {
      button.textContent = language === "en" ? "中文" : "English";
      button.setAttribute(
        "aria-label",
        language === "en" ? "切换为中文" : "Switch to English",
      );
    }
    if (persist)
      try {
        localStorage.setItem(storageKey, language);
      } catch {}
    for (const link of document.querySelectorAll(
      ".document-download[download]",
    )) {
      if (!link.dataset.originalHref)
        link.dataset.originalHref = (link.dataset.cnHref || link.getAttribute("href")).replace(/\.en\.md$/, ".md");
      const original = link.dataset.originalHref;
      link.setAttribute(
        "href",
        language === "en" ? original.replace(/\.md$/, ".en.md") : original,
      );
    }
    for (const link of document.querySelectorAll("a[href]:not([data-i18n-skip])")) {
      const original = link.dataset.cnHref || link.getAttribute("href").replace(/\.en\.html(?=[?#]|$)/,".html");
      const target = window.skyLocaleUrl?.(language,new URL(original,document.baseURI));
      if (target) {
        link.dataset.cnHref = original;
        link.setAttribute("href",target.pathname+target.search+target.hash);
      }
    }
    if ((language === "en") !== /\.en\.html$/.test(location.pathname)) {
      const target = window.skyLocaleUrl?.(language);
      if (target) history.replaceState(history.state,"",target.href);
    }
    walk(document.documentElement);
    document.dispatchEvent(
      new CustomEvent("skymotion:language", { detail: { language } }),
    );
    // Redraw annotations without resetting the current experiment.
    if (typeof schedule === "function") schedule();
  }
  const fontPromises = new Map();
  function prepareFonts(next) {
    const locale = next === "en" ? "en" : "zh";
    if (!fontPromises.has(locale)) {
      const family =
        locale === "en" ? "SkyMotion Charter" : "SkyMotion Reading";
      const sample =
        locale === "en" ? "Sun Moon observation 12:00" : "太阳月球观测日期";
      const styles =
        locale === "en"
          ? ["400", "700", "italic 400", "italic 700"]
          : ["400", "700"];
      const promise = Promise.all(
        styles.map((style) =>
          document.fonts.load(`${style} 16px "${family}"`, sample),
        ),
      );
      fontPromises.set(locale, promise);
      promise.catch(() => fontPromises.delete(locale));
    }
    return fontPromises.get(locale);
  }
  let changeGeneration = 0;
  async function change(next, persist = true) {
    const generation = ++changeGeneration;
    if (button) button.disabled = true;
    try {
      await prepareFonts(next);
      if (generation === changeGeneration) apply(next, persist);
    } finally {
      if (button && generation === changeGeneration) button.disabled = false;
    }
  }
  function reveal() {
    clearTimeout(window.skyLanguageBoot);
    delete document.documentElement.dataset.languagePending;
    document.dispatchEvent(new CustomEvent("skymotion:ready"));
  }
  window.skySetLanguage = change;
  document.documentElement.lang = language === "en" ? "en" : "zh-CN";
  let presentationObserved = false;
  function observePresentation() {
    if (presentationObserved) return;
    presentationObserved = true;
    const observer = new MutationObserver((records) => {
      const roots = new Set();
      for (const record of records) {
        if (record.type === "characterData") text(record.target);
        else if (record.type === "attributes") element(record.target);
        else for (const node of record.addedNodes) roots.add(node);
      }
      for (const root of roots) walk(root);
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: translatedAttributes,
    });
    addEventListener("storage", (event) => {
      if (event.key === storageKey)
        change(event.newValue, false).catch(console.error);
    });
  }
  let initGeneration = 0;
  let startupAborted = Boolean(window.skyLanguageBootExpired);
  window.skyLanguageStartupFallback = () => {
    startupAborted = true;
    initGeneration++;
    failure(
      new Error("Initial language preparation timed out; retry is available."),
    );
  };
  async function init() {
    const attempt = ++initGeneration;
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "language-toggle";
      button.dataset.i18nSkip = "";
      button.textContent = language === "en" ? "中文" : "English";
      button.setAttribute("aria-label", "Switch language / 切换语言");
      button.addEventListener("click", () => {
        if (dictionaryReady)
          change(language === "en" ? "zh" : "en").catch(console.error);
        else
          init()
            .then(() => change("en"))
            .catch(failure);
      });
      const nav = document.querySelector(".page-nav");
      if (nav) {
        const bar = document.createElement("div");
        bar.className = "language-nav";
        nav.before(bar);
        bar.append(nav, button);
      } else {
        (document.querySelector(".welcome-brand") || document.body).append(
          button,
        );
      }
    }
    button.disabled = true;
    const maps = window.skyEnglishDictionary ? [window.skyEnglishDictionary] : await Promise.all(
      ["i18n-lab.json", "i18n-space.json", "i18n-docs.json"].map(
        async (file) => {
          const response = await fetch(new URL(file, base));
          if (!response.ok)
            throw new Error(`Language resource unavailable: ${file}`);
          return response.json();
        },
      ),
    ).catch((error) => {
      if (attempt !== initGeneration) return null;
      throw error;
    });
    if (!maps || attempt !== initGeneration) return;
    if (!fragments) installDictionary(maps);
    dictionaryReady = true;
    button.removeAttribute("title");
    observePresentation();
    await prepareFonts(language);
    if (attempt !== initGeneration) return;
    if (!startupAborted) apply(language, false);
    clearTimeout(window.skyLanguageBoot);
    // Let translated controls, text measurements and the astronomy canvas settle before first paint.
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    reveal();
    button.disabled = false;
  }
  async function failure(error) {
    console.error(error);
    language = "zh";
    cache.clear();
    try {
      await prepareFonts("zh");
    } catch {}
    apply("zh", false);
    reveal();
    button.disabled = false;
    button.title = "English could not load. Click to retry.";
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",() => init().catch(failure),{once:true});
  else init().catch(failure);
})();
