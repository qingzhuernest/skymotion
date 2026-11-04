/** Portable experiment links. The URL fragment stays out of HTTP requests. */
(() => {
  'use strict';
  // Capture before workspace routing replaces the fragment with its active diagram.
  const incoming = location.hash.startsWith('#state=') ? location.hash.slice(7) : null;
  const MAX_BYTES = 600000,
    MAX_LINK = 2800;
  const encoder = new TextEncoder(),
    decoder = new TextDecoder('utf-8', { fatal: true });
  async function bytes(stream) {
    const reader = stream.getReader(),
      chunks = [];
    let length = 0;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > MAX_BYTES) throw new Error('size');
        chunks.push(value);
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    const result = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
  function base64(data) {
    let text = '';
    for (const byte of data) text += String.fromCharCode(byte);
    return btoa(text).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  }
  async function encode(payload) {
    const raw = encoder.encode(JSON.stringify(payload));
    if (raw.length > MAX_BYTES) throw new Error('size');
    const compressed = typeof CompressionStream === 'function';
    const data = compressed
      ? await bytes(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate')))
      : raw;
    const token = (compressed ? '1z.' : '1j.') + base64(data);
    if (token.length > MAX_LINK) throw new Error('size');
    return token;
  }
  async function decode(token) {
    if (
      typeof token !== 'string' ||
      token.length > MAX_LINK ||
      !/^1[zj]\.[A-Za-z0-9_-]+$/.test(token)
    )
      throw new Error('format');
    const encoded = token.slice(3).replaceAll('-', '+').replaceAll('_', '/');
    const data = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const raw =
      token[1] === 'z'
        ? await bytes(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate')))
        : data;
    if (raw.length > MAX_BYTES) throw new Error('size');
    const payload = JSON.parse(decoder.decode(raw));
    if (!payload || payload.version !== 1 || !['sun', 'moon'].includes(payload.experiment?.body))
      throw new Error('version');
    return payload;
  }
  async function link(payload) {
    const url = new URL(location.href);
    url.pathname = url.pathname.replace(
      /(?:lab|diagrams|analemma)(?:\.en)?(?:\.html)?\/?$/,
      document.documentElement.lang === 'en' ? 'lab.en.html' : 'lab.html',
    );
    url.search = '';
    url.hash = 'state=' + (await encode(payload));
    if (url.href.length > MAX_LINK) throw new Error('size');
    return url.href;
  }
  window.SkyExperimentShare = { encode, decode, link, maxLinkLength: MAX_LINK };
  let generation = 0;
  async function restore(token) {
    const request = ++generation;
    let ok = false;
    try {
      const payload = await decode(token);
      if (request !== generation) return;
      ok = window.skyWorkspacePresentation?.restoreShared(payload) === true;
    } catch {}
    if (request !== generation) return;
    const host = window.skyWorkspacePresentation?.shareControl;
    if (!host) return;
    host.dataset.shareResult = ok ? 'restored' : 'invalid';
    host.dispatchEvent(new Event('share-result'));
    if (!ok) window.SkyWorkbenchMenu?.openLayout();
  }
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      // State owners register in their own DOMContentLoaded handlers first.
      if (incoming !== null) queueMicrotask(() => restore(incoming));
    },
    { once: true },
  );
  // Opening another link in this tab can be a fragment-only navigation.
  window.addEventListener('hashchange', (event) => {
    if (!location.hash.startsWith('#state=')) {
      generation++;
      return;
    }
    event.stopImmediatePropagation();
    restore(location.hash.slice(7));
  });
})();
