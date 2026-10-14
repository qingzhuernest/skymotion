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
        const clean = (source, defaults) => {
          const value = SkyMotionSession.sanitizeMode(source, defaults);
          // Historical date-link snapshots must retain the prior analemma settings.
          // Session loading intentionally discards this temporary backup.
          const backup = source?.solarDateLinkBackup;
          if (backup && typeof backup === 'object' && !Array.isArray(backup)) {
            const checked = SkyMotionSession.sanitizeMode(backup, defaults);
            const fields = ['analemma', 'analemmaBasis', 'analemmaClock', 'analemmaIdeal'];
            if (fields.every(key => backup[key] === checked[key]))
              value.solarDateLinkBackup = Object.fromEntries(fields.map(key => [key, checked[key]]));
          }
          if (!value.manual) value.dec = dateDec(value.date);
          return value;
        };
        Object.assign(modeStates.sun, clean(snapshot.sun, modeStates.sun));
        Object.assign(modeStates.moon, clean(snapshot.moon, modeStates.moon));
        if (['analemma', 'sundial'].includes(document.body.dataset.page))
          state = clean(snapshot.active, state);
        else {
          state = modeStates[snapshot.body === 'moon' ? 'moon' : 'sun'];
          Object.assign(state, clean(snapshot.active, state));
        }
        if (SkyMotionSession.inRange(snapshot.sundialLength, 0.06, 0.3)) sundialLength = snapshot.sundialLength;
        if (['plate', 'device'].includes(snapshot.sundialView)) sundialView = snapshot.sundialView;
        if (['orbit', 'time'].includes(snapshot.sundialDragMode)) sundialDragMode = snapshot.sundialDragMode;
        if (uiWorkspace) {
          if (typeof snapshot.selected === 'string') uiWorkspace.selected = snapshot.selected;
          if (typeof snapshot.moonPhase === 'boolean') uiWorkspace.moonPhase = snapshot.moonPhase;
        }
        syncControls();
        settleMotion();
        render();
        window.SolarSpaceLabCompare?.restore?.(snapshot.linked === true, snapshot.linkedSelection);
      },
    });
  });
})();
