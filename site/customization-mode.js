/** One lifecycle for the site-wide customization switch; pages supply only their layout changes. */
(() => {
  window.SkyCustomizationMode = {
    install({ launch, isActive, apply, canExit = () => true, changed = () => {} }) {
      let changing = false;
      function refresh() {
        const active = isActive(),
          english = document.documentElement.lang.startsWith('en');
        launch.textContent = english
          ? active
            ? 'Finish customizing'
            : 'Customize'
          : active
            ? '完成自定义'
            : '进入自定义';
        launch.setAttribute('aria-pressed', String(active));
      }
      function change(value) {
        value = Boolean(value);
        if (isActive() === value) return true;
        if (changing) return false;
        changing = true;
        try {
          if (
            !value &&
            (window.SkyLabComparison?.validate?.() === false ||
              window.SkyDiagramTools?.leave?.() === false ||
              canExit() === false)
          )
            return false;
          apply(value);
          document.body.classList.toggle('customization-active', value);
          refresh();
          document.dispatchEvent(
            new CustomEvent('skymotion:customization', { detail: { active: value } }),
          );
          changed(value);
          return true;
        } finally {
          changing = false;
        }
      }
      const api = {
        get active() {
          return isActive();
        },
        enter: () => change(true),
        exit: () => change(false),
      };
      window.SkyCustomization = api;
      launch.disabled = document.documentElement.hasAttribute('data-language-pending');
      document.addEventListener(
        'skymotion:ready',
        () => {
          launch.disabled = false;
        },
        { once: true },
      );
      document.addEventListener('skymotion:language', refresh);
      launch.onclick = () => change(!isActive());
      refresh();
      return api;
    },
  };
})();
