/** Browser-side contrast of a control, including the shared inset state layer. */
function controlContrast(element, mode = 'text') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.fillStyle = 'white';
  context.fillRect(0, 0, 1, 1);
  const ancestors = [];
  for (let node = element; node; node = node.parentElement) ancestors.unshift(node);
  const style = getComputedStyle(element);
  const outsideFocus = mode === 'focus' && parseFloat(style.outlineOffset) >= 0;
  for (const node of ancestors) {
    if (node === element && outsideFocus) continue;
    if (node === element && element.classList.contains('motion-selected')) {
      const marker = element.parentElement.querySelector(':scope > .motion-selection');
      const markerBounds = marker?.getBoundingClientRect();
      const elementBounds = element.getBoundingClientRect();
      if (
        marker?.checkVisibility() &&
        markerBounds.left <= elementBounds.left + elementBounds.width / 2 &&
        markerBounds.right >= elementBounds.left + elementBounds.width / 2
      ) {
        context.fillStyle = getComputedStyle(marker).backgroundColor;
        context.fillRect(0, 0, 1, 1);
      }
    }
    context.fillStyle = getComputedStyle(node).backgroundColor;
    context.fillRect(0, 0, 1, 1);
  }
  const bounds = element.getBoundingClientRect();
  const shadow = style.boxShadow;
  // The shared state layer covers the complete shape; thin inset borders do not.
  if (!outsideFocus && shadow.includes('inset')) {
    const lengths = [...shadow.matchAll(/(-?[\d.]+)px/g)].map((match) =>
      Number(match[1]),
    );
    const color = shadow.match(/(?:rgba?|color|oklab|oklch)\([^)]*\)/)?.[0];
    if (
      color &&
      lengths.length >= 4 &&
      lengths[3] >= Math.min(bounds.width, bounds.height) / 2
    ) {
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
    }
  }
  const background = [...context.getImageData(0, 0, 1, 1).data];
  context.fillStyle = mode === 'focus' ? style.outlineColor : style.color;
  context.fillRect(0, 0, 1, 1);
  const foreground = [...context.getImageData(0, 0, 1, 1).data];
  const luminance = (channels) => {
    const linear = channels.slice(0, 3).map((value) => {
      value /= 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const first = luminance(background),
    second = luminance(foreground);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
module.exports = { controlContrast };
