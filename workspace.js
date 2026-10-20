/**
 * 实验工作区与模式布局。
 */
/* Solar view compares coincident sky positions; lunar view centers on phase. */
const workspaceHomes = new Map();
let workspaceBody = null;
function isMoonOverlayActive() {
  return state.body === 'sun' && state.moonOverlay && !state.manual;
}
function moonOverlayPosition(time = state.time, exact = false) {
  if (exact) return skyRaw('Moon', time, state.date, state.lat, state.lon);
  const samples = ephemerisDay('Moon').samples,
    t = clamp(time, 0, 1440) / 5,
    i = Math.min(Math.floor(t), samples.length - 2),
    f = t - i,
    a = samples[i],
    b = samples[i + 1],
    x = a.x + (b.x - a.x) * f,
    y = a.y + (b.y - a.y) * f,
    z = a.z + (b.z - a.z) * f,
    n = Math.hypot(x, y, z);
  return {
    x: x / n,
    y: y / n,
    z: z / n,
    alt: Math.asin(clamp(y / n, -1, 1)) * deg,
    az: (Math.atan2(x, z) * deg + 360) % 360,
  };
}
function initWorkspace() {
  for (const selector of [
    '#contextPanel',
    '#stage',
    '.view-tabs',
    '.model-explanation',
    '.metrics',
    '#riseSetPanel',
  ]) {
    const node = document.querySelector(selector),
      home = document.createComment('home: ' + selector);
    node.before(home);
    workspaceHomes.set(selector, { node, home });
  }
  $('moonOverlay').onchange = (e) => {
    state.moonOverlay = e.target.checked;
    schedule();
  };
  $('lunarSkyDetails').addEventListener('toggle', schedule);
}
function updateWorkspaceLayout() {
  if (typeof uiWorkspace !== 'undefined' && uiWorkspace) {
    workspaceBody = state.body;
    return;
  }
  if (workspaceBody === state.body) return;
  workspaceBody = state.body;
  const moon = state.body === 'moon';
  $('phasePrimaryHost').hidden = !moon;
  $('lunarSkyDetails').hidden = !moon;
  if (moon) {
    $('phasePrimaryHost').append($('contextPanel'));
    $('moonSkyHead').append(document.querySelector('.view-tabs'));
    for (const selector of ['#stage', '.model-explanation', '.metrics', '#riseSetPanel'])
      $('moonSkyHost').append(workspaceHomes.get(selector).node);
  } else for (const { node, home } of workspaceHomes.values()) home.after(node);
  revealMotion(moon ? [$('phasePrimaryHost'), $('moonTimeline')] : [$('stage'), $('sunTimeline')]);
}
function updateWorkspaceUI() {
  const moon = state.body === 'moon',
    overlay = isMoonOverlayActive();
  $('solarOverlayBar').hidden = moon;
  $('moonOverlay').checked = overlay;
  $('moonOverlay').disabled = state.manual;
  $('moonOverlay').title = state.manual
    ? '月球叠加仅用于日期观测；理想实验不对应真实日期。'
    : '比较同一地点、日期和时刻的太阳与月球位置';
  $('moonOverlayKey').hidden = !overlay;
  $('moonOverlayChartKey').hidden = !overlay;
  $('primaryTrackText').textContent = moon ? '月球轨迹' : '太阳轨迹';
  $('displayContextNote').hidden = !moon;
  $('displayContextNote').textContent = '轨迹和角度线用于下方的辅助天空视图。';
  if (moon) {
    $('contextEyebrow').textContent = '月相形成';
    $('chartLegend').textContent = '固定观测时刻';
    $('sceneSubtitle').textContent =
      state.date + ' · 固定 ' + hhmm(state.time, true) + ' 当地真太阳时';
    $('moonDateNote').textContent = '按天改变日期比较月相；地点和时刻用于时间换算及辅助天空位置。';
  } else {
    if (state.manual) $('moonOverlayReadout').textContent = '仅日期观测可叠加月球';
    else if (overlay) {
      const m = moonOverlayPosition(state.time, true),
        phase = lunarPhase();
      $('moonOverlayReadout').textContent =
        phase.name +
        ' · ' +
        (phase.fraction * 100).toFixed(1) +
        '% · 月高 ' +
        m.alt.toFixed(1) +
        '°';
      $('plotNote').textContent += ' 月球与太阳共用地点、日期和时刻，月相图标为固定朝向示意。';
      $('sky').setAttribute('aria-label', '同一地点日期时刻的太阳与月球视运动交互图');
      $('chartLegend').textContent = '太阳';
    } else $('moonOverlayReadout').textContent = '同一地点、日期和时刻';
  }
}
