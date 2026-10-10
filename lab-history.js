/** Snapshot existing laboratory state; calculations and input handlers remain authoritative. */
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const scientificState = (source) =>
      Object.fromEntries(
        Object.entries(source).filter(
          ([key]) =>
            ![
              'yaw',
              'pitch',
              'zoom',
              'globeCameraLat',
              'globeCameraLon',
              'globeCameraReady',
              'analemmaYaw',
              'analemmaPitch',
              'analemmaZoom',
            ].includes(key),
        ),
      );
    SkyMotionHistory.register({
      parameterGesture(before, after) {
        return ['lat', 'lon', 'date', 'time', 'dec', 'manual', 'height'].some(
          (key) => before.active[key] !== after.active[key],
        );
      },
      read: () => ({
        active: scientificState(state),
        body: state.body,
        sun: scientificState(modeStates.sun),
        moon: scientificState(modeStates.moon),
        selected: uiWorkspace?.selected,
        moonPhase: uiWorkspace?.moonPhase,
        sundialLength,
        sundialView,
        sundialDragMode,
        linked: window.SolarSpaceLabCompare?.enabled || false,
        linkedSelection: window.SolarSpaceLabCompare?.readSelection?.() || null,
      }),
      restore(snapshot) {
        stop();
        analemmaPlaying = false;
        Object.assign(modeStates.sun, snapshot.sun, { playing: false });
        Object.assign(modeStates.moon, snapshot.moon, { playing: false });
        if (['analemma', 'sundial'].includes(document.body.dataset.page))
          state = { ...state, ...snapshot.active, playing: false };
        else {
          state = modeStates[snapshot.body === 'moon' ? 'moon' : 'sun'];
          Object.assign(state, snapshot.active, { playing: false });
        }
        sundialLength = snapshot.sundialLength;
        sundialView = snapshot.sundialView;
        sundialDragMode = snapshot.sundialDragMode;
        if (uiWorkspace) {
          uiWorkspace.selected = snapshot.selected;
          uiWorkspace.moonPhase = snapshot.moonPhase;
        }
        syncControls();
        settleMotion();
        render();
        window.SolarSpaceLabCompare?.restore?.(snapshot.linked, snapshot.linkedSelection);
      },
    });
  });
})();
