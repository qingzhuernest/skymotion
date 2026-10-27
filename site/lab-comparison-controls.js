/** Shared comparisons are edited through the common object workbench. */
(() => {
 if(document.body.dataset.page!=='lab')return;
 window.SkyLabComparison={sync(){},validate(){return !document.querySelector('.dt-panel:not([hidden]) [aria-invalid=true]');}};
})();
