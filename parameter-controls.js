/** Shared drag-to-preview controls. Each gesture commits once; Escape restores its start. */
(() => {
  const DAY = 86400000;
  const controls = new WeakMap();
  function attach(input, options) {
    const date = options.kind === 'date';
    const range = document.createElement('input');
    range.type = 'range';
    range.className = 'parameter-scrub';
    range.dataset.scrub = input.dataset.field;
    range.setAttribute(
      'aria-label',
      typeof options.label === 'function' ? options.label() : options.label,
    );
    const label = input.closest('label'),
      wrapper = document.createElement('div');
    wrapper.className = 'parameter-field';
    if (label) {
      label.before(wrapper);
      wrapper.append(label, range);
    } else {
      input.after(wrapper);
      wrapper.append(range);
    }
    let before = null,
      pending = null,
      frame = 0,
      pointerActive = false,
      cancelledPointer = false;
    const encode = (value) =>
      date ? Math.round(Date.parse(value + 'T00:00:00Z') / DAY) : Number(value);
    const decode = (value) =>
      date ? new Date(value * DAY).toISOString().slice(0, 10) : Number(value);
    function sync() {
      range.setAttribute(
        'aria-label',
        typeof options.label === 'function' ? options.label() : options.label,
      );
      const value = options.read();
      const numeric = encode(value);
      if (date && Number.isFinite(numeric)) {
        const year = Number(String(value).slice(0, 4));
        range.min = Date.UTC(year, 0, 1) / DAY;
        range.max = Date.UTC(year, 11, 31) / DAY;
        range.step = 1;
      } else {
        range.min = options.min;
        range.max = options.max;
        range.step = options.step || 1;
      }
      range.value = numeric;
      range.disabled = input.disabled;
      wrapper.hidden = label?.hidden || false;
      range.setAttribute('aria-valuetext', options.format ? options.format(value) : String(value));
      range.dataset.committedValue = range.value;
    }
    function start() {
      if (range.disabled || before !== null) return;
      before = options.begin();
    }
    function flush() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (pending === null) return;
      options.preview(pending);
      pending = null;
      sync();
    }
    function finish() {
      if (before === null) return;
      flush();
      const saved = before;
      before = null;
      options.commit(saved);
      sync();
    }
    function cancel() {
      if (before === null) return;
      cancelAnimationFrame(frame);
      frame = 0;
      pending = null;
      const saved = before;
      before = null;
      options.cancel(saved);
      sync();
    }
    range.addEventListener('pointerdown', () => {
      pointerActive = true;
      cancelledPointer = false;
      start();
    });
    range.addEventListener('pointerup', () => {
      pointerActive = false;
      cancelledPointer = false;
    });
    range.addEventListener('input', () => {
      if (cancelledPointer) {
        sync();
        return;
      }
      start();
      pending = decode(Number(range.value));
      if (!frame) frame = requestAnimationFrame(flush);
    });
    range.addEventListener('change', finish);
    range.addEventListener('blur', () => {
      finish();
      pointerActive = false;
      cancelledPointer = false;
    });
    range.addEventListener('pointercancel', () => {
      cancel();
      pointerActive = false;
      cancelledPointer = false;
    });
    range.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && options.save) {
        event.preventDefault();
        event.stopPropagation();
        finish();
        options.save();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && options.undo) {
        event.preventDefault();
        event.stopPropagation();
        finish();
        options.undo(event.shiftKey);
        return;
      }
      if (event.key === 'Escape' && before !== null) {
        event.preventDefault();
        event.stopPropagation();
        cancelledPointer = pointerActive;
        cancel();
      }
    });
    const control = { sync };
    controls.set(input, control);
    sync();
    return control;
  }
  window.SkyParameterControls = {
    attach,
    sync: (input) => controls.get(input)?.sync(),
  };
})();
