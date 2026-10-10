/** Independent 3D clock and selections use the same browser-history grouping. */
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.SkyMotionSpaceHistory) return;
    SkyMotionHistory.register({
      read: () => ({
        scene: SkyMotionSpaceHistory.read(),
        immersive: SkyMotionImmersiveHistory?.read() || false,
      }),
      restore(snapshot) {
        SkyMotionImmersiveHistory?.restore(snapshot.immersive);
        SkyMotionSpaceHistory.restore(snapshot.scene);
      },
    });
  });
})();
