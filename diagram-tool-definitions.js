/** Tool schemas and bilingual names, independent of editor state and DOM events. */
(() => {
  const field = (name, title, value, min, max, step = 1) => ({
    name,
    title,
    value,
    min,
    max,
    step,
  });
  const choice = (name, title, value, options) => ({ name, title, value, options });
  const date = () => field('date', '日期 YYYY-MM-DD|Date YYYY-MM-DD', 'date');
  const time = () =>
    field(
      'time',
      '当地真太阳时 HH:MM|Local apparent solar time HH:MM',
      'time',
      0,
      1440,
      1,
    );
  const lat = () => field('lat', '纬度 / °|Latitude / °', 'lat', -90, 90, 0.1);
  const lon = () => field('lon', '经度 / °|Longitude / °', 'lon', -180, 180, 0.1);
  const type = (id, title, fields) => ({ id, title, fields });
  const common = [
    type('note', '文字说明|Text note', [
      field('x', '水平位置 / %|Horizontal / %', 50, 0, 100),
      field('y', '竖直位置 / %|Vertical / %', 30, 0, 100),
    ]),
    type('emphasis', '重点圈|Highlight circle', [
      field('x', '水平位置 / %|Horizontal / %', 50, 0, 100),
      field('y', '竖直位置 / %|Vertical / %', 50, 0, 100),
      field('radius', '半径 / %|Radius / %', 10, 1, 40),
    ]),
  ];
  const definitions = {
    sky: [
      type('observer', '观察点 / 城市|Observer / city', [lat(), lon()]),
      type('curve', '日期对照曲线|Date comparison curve', [date()]),
      type('time', '时间标记|Time marker', [time()]),
      type('build', '摆放实验物体|Place experiment objects', []),
    ],
    globe: [
      type('observer', '观察点 / 城市|Observer / city', [lat(), lon()]),
      type('latitude', '纬度参考线|Latitude line', [lat()]),
      type('longitude', '经度参考线|Longitude line', [lon()]),
      type('ray', '观察点太阳方向|Sun direction at observer', [lat(), lon()]),
    ],
    altitude: [
      type('curve', '日期对照曲线|Date comparison curve', [date()]),
      type('level', '参考高度线|Altitude reference', [
        field('alt', '高度 / °|Altitude / °', 30, -90, 90),
      ]),
      type('time', '时间标记|Time marker', [time()]),
      type('measure', '两点时间 / 高度差|Measure time / altitude difference', [
        field('a', '第一个时刻 / 分钟|First time / minutes', 600, 0, 1440),
        field('b', '第二个时刻 / 分钟|Second time / minutes', 840, 0, 1440),
      ]),
    ],
    illumination: [
      type('curve', '月份对照曲线|Compare another month', [date()]),
      type('level', '照明比例参考线|Illumination reference', [
        field('value', '照明比例 / %|Illumination / %', 50, 0, 100),
      ]),
      type('date', '日期标记|Date marker', [date()]),
      type('measure', '两日照明差|Illumination difference', [
        field('a', '日期 A|Date A', 'date'),
        field('b', '日期 B|Date B', 'date'),
      ]),
    ],
    azimuth: [
      type('direction', '方向线|Direction', [
        field('az', '方位角 / °|Azimuth / °', 90, 0, 360),
      ]),
      type('ring', '方位参考圈|Bearing circle', [
        field('radius', '相对半径 / %|Relative radius / %', 70, 10, 120),
      ]),
      type('events', '日期 / 遮挡角对照|Date / obstruction comparison', [
        date(),
        field('obstruction', '地平遮挡角 / °|Horizon obstruction / °', 0, 0, 30, 0.5),
      ]),
    ],
    geometry: [
      type('observer', '观察者与当地竖杆|Observer and local vertical', [
        lat(),
        lon(),
        field(
          'height',
          '示意杆长 / 地球半径|Illustrative length / Earth radius',
          0.4,
          0.1,
          1,
          0.05,
        ),
      ]),
      type('ring', '空间参考圈|Spatial reference circle', [
        choice('plane', '所在平面|Plane', 'horizon', [
          'horizon:当地地平面|Local horizon',
          'equator:赤道面|Equator',
          'meridian:子午面|Meridian',
        ]),
        field('radius', '示意半径|Illustrative radius', 0.6, 0.2, 1.5, 0.1),
      ]),
      type('visibility', '原图显示开关|Original diagram visibility', [
        ...['axis', 'equator', 'horizon', 'zenith', 'sun'].map((name) =>
          choice(
            name,
            {
              axis: '地轴|Earth axis',
              equator: '赤道面|Equatorial plane',
              horizon: '地平面|Horizon plane',
              zenith: '天顶|Zenith',
              sun: '太阳方向|Sun direction',
            }[name],
            'yes',
            ['yes:显示|Show', 'no:隐藏|Hide'],
          ),
        ),
      ]),
      type('angle', '空间夹角|Spatial angle', [
        choice('a', '方向 A|Direction A', 'axis', [
          'axis:地轴|Earth axis',
          'sun:太阳方向|Sun direction',
          'zenith:天顶|Zenith',
          'north:当地北方|Local north',
        ]),
        choice('b', '方向 B|Direction B', 'zenith', [
          'axis:地轴|Earth axis',
          'sun:太阳方向|Sun direction',
          'zenith:天顶|Zenith',
          'north:当地北方|Local north',
        ]),
      ]),
      type('direction', '方向箭头|Direction vector', [
        choice('direction', '方向|Direction', 'sun', [
          'sun:太阳方向|Sun direction',
          'axis:地轴|Earth axis',
          'zenith:天顶|Zenith',
          'north:当地北方|Local north',
        ]),
      ]),
    ],
    phase: [
      type('snapshot', '记录指定日期月相|Dated phase snapshot', [
        date(),
        time(),
        choice('sight', '显示视线|Show sightline', 'yes', [
          'yes:显示|Show',
          'no:隐藏|Hide',
        ]),
      ]),
      type('phase', '指定相位标记|Phase position marker', [
        field('angle', '相位角 / °|Phase angle / °', 90, 0, 360),
      ]),
      type('rays', '平行光参考线|Parallel light references', [
        field('count', '条数|Line count', 5, 1, 15),
        field('spread', '相对间距|Relative spacing', 0.2, 0.05, 0.5, 0.05),
      ]),
      type('observer', '地球上的观察方向|Observer direction', [
        field('angle', '方向角 / °|Direction / °', 0, 0, 360),
      ]),
    ],
    companion: [
      type('snapshot', '日期位置与角距离|Dated positions and separation', [
        date(),
        time(),
      ]),
      type('trail', '连续位置轨迹|Position trail', [
        date(),
        time(),
        field('hours', '前后时间 / 小时|Hours before and after', 6, 1, 24),
        field('step', '采样间隔 / 小时|Sample interval / hours', 1, 0.5, 6, 0.5),
      ]),
    ],
    analemma: [
      type('track', '地点 / 时刻对照轨迹|Location / time comparison track', [
        lat(),
        lon(),
        field('clock', '每日固定时刻 / 分钟|Fixed daily time / minutes', 720, 0, 1439),
        choice('basis', '时间规则|Time basis', 'clock', [
          'clock:钟表时|Clock time',
          'apparent:当地真太阳时|Local apparent solar time',
        ]),
        field('offset', '钟表时区 / UTC 偏移|Clock zone / UTC offset', 8, -12, 14, 0.5),
      ]),
      type('date', '指定日期标记|Dated marker', [date()]),
      type('level', '高度参考圈 / 线|Altitude reference circle / line', [
        field('alt', '高度 / °|Altitude / °', 30, 0, 90),
      ]),
    ],
    lunar: [
      type('station', '固定月面站|Fixed lunar station', [
        field('angle', '相对近地侧角度 / °|Angle from near side / °', 0, 0, 360),
      ]),
      type('orbiter', '绕月参考位置|Reference orbiter', [
        field('angle', '绕月位置 / °|Orbital position / °', 258, 0, 360),
        field('height', '轨道高度 / km|Orbital height / km', 100, 50, 2000, 10),
      ]),
      type('sight', '视线与月缘可见性|Sightline and lunar-limb visibility', [
        field('angle', '绕月位置 / °|Orbital position / °', 270, 0, 360),
        field('height', '轨道高度 / km|Orbital height / km', 100, 50, 2000, 10),
      ]),
    ],
    space: [
      type('plane', '参考平面|Reference plane', [
        choice('plane', '平面|Plane', 'xz', [
          'xz:黄道参考面|Ecliptic reference',
          'xy:竖直 XY 面|Vertical XY',
          'yz:竖直 YZ 面|Vertical YZ',
        ]),
        field('radius', '显示半径 / 场景单位|Display radius / scene units', 20, 2, 100),
      ]),
      type('distance', '行星间距离|Distance between planets', [
        choice('a', '天体 A|Body A', 'Earth', [
          'Mercury:水星|Mercury',
          'Venus:金星|Venus',
          'Earth:地球|Earth',
          'Mars:火星|Mars',
          'Jupiter:木星|Jupiter',
          'Saturn:土星|Saturn',
        ]),
        choice('b', '天体 B|Body B', 'Mars', [
          'Mercury:水星|Mercury',
          'Venus:金星|Venus',
          'Earth:地球|Earth',
          'Mars:火星|Mars',
          'Jupiter:木星|Jupiter',
          'Saturn:土星|Saturn',
        ]),
      ]),
      type('angle', '日心夹角|Heliocentric angle', [
        choice('a', '天体 A|Body A', 'Earth', [
          'Mercury:水星|Mercury',
          'Venus:金星|Venus',
          'Earth:地球|Earth',
          'Mars:火星|Mars',
          'Jupiter:木星|Jupiter',
        ]),
        choice('b', '天体 B|Body B', 'Mars', [
          'Mercury:水星|Mercury',
          'Venus:金星|Venus',
          'Earth:地球|Earth',
          'Mars:火星|Mars',
          'Jupiter:木星|Jupiter',
        ]),
      ]),
      type('camera', '保存当前观察相机|Save current camera', []),
    ],
  };
  const titles = {
    globe: '地球与昼夜|Earth and daylight',
    altitude: '高度曲线|Altitude curve',
    illumination: '逐日照明比例|Daily illumination',
    azimuth: '升落方位|Rise and set bearings',
    geometry: '地轴与地平面|Axis and horizon',
    phase: '月相关系|Moon phase relationships',
    companion: '行星伴月|Moon–planet comparison',
    analemma: '日行迹|Analemma',
    lunar: '地升地落|Earthrise',
    space: '三维太阳系|3D Solar system',
    sky: '天空与时间对照|Sky and time comparisons',
  };
  function forModel(m) {
    let d = definitions[m.type] || [];
    if (m.type === 'sky' && m.body === 'moon')
      d = d.filter((x) => ['curve', 'time', 'build'].includes(x.id));
    if (m.type === 'altitude' && m.body === 'moon')
      d = d.filter((x) => ['curve', 'time'].includes(x.id));
    return [...d, ...common];
  }
  function normalize(objects, m, { validDate, nextId }) {
    // A legacy or hand-edited save may exceed the current limit. Keep its
    // oldest supported objects so one bad record cannot erase the whole plot.
    const out = [];
    const ids = new Set();
    for (const raw of objects) {
      if (out.length === 40) break;
      if (!raw || typeof raw !== 'object') continue;
      const def = forModel(m).find((d) => d.id === raw.type);
      if (!def || typeof raw.id !== 'string') continue;
      let id = raw.id.slice(0, 80);
      if (!id || ids.has(id)) {
        do id = nextId();
        while (ids.has(id));
      }
      ids.add(id);
      const o = {
        id,
        type: def.id,
        label: typeof raw.label === 'string' ? raw.label.slice(0, 60) : def.title,
        customLabel: raw.customLabel === true,
        visible: raw.visible !== false,
        locked: raw.locked === true,
      };
      if (!o.customLabel) {
        const n = Number.isInteger(raw.copyNumber)
          ? raw.copyNumber
          : Number(o.label.match(/ (\d+)$/)?.[1]);
        if (n >= 2 && n <= 999) o.copyNumber = n;
        o.label = def.title
          .split('|')
          .map((x) => x + (o.copyNumber ? ' ' + o.copyNumber : ''))
          .join('|');
      }
      if (
        !o.customLabel &&
        typeof raw.autoLabel === 'string' &&
        raw.autoLabel.length <= 160
      ) {
        o.autoLabel = raw.autoLabel;
        o.label = raw.autoLabel;
      }
      for (const f of def.fields) {
        const v = raw[f.name];
        if (f.options)
          o[f.name] = f.options.some((x) => x.split(':')[0] === v) ? v : f.value;
        else if (f.min !== undefined)
          o[f.name] = Number.isFinite(v)
            ? Math.max(f.min, Math.min(f.max, v))
            : Number.isFinite(f.value)
              ? f.value
              : 0;
        else if (f.value === 'date')
          o[f.name] = validDate(v) ? v : validDate(m.date) ? m.date : '1900-01-01';
        else o[f.name] = typeof v === 'string' ? v.slice(0, 100) : f.value;
      }
      if (
        def.id === 'camera' &&
        raw.camera &&
        ['azimuth', 'elevation', 'distance'].every((k) => Number.isFinite(raw.camera[k]))
      )
        o.camera = {
          azimuth: raw.camera.azimuth,
          elevation: Math.max(-1.5, Math.min(1.5, raw.camera.elevation)),
          distance: Math.max(0.5, Math.min(10000, raw.camera.distance)),
          selected:
            Number.isInteger(raw.camera.selected) &&
            raw.camera.selected >= 0 &&
            raw.camera.selected < 8
              ? raw.camera.selected
              : 2,
          view: ['overview', 'earthmoon', 'focus'].includes(raw.camera.view)
            ? raw.camera.view
            : 'overview',
          inspectingMoon: raw.camera.inspectingMoon === true,
        };
      out.push(o);
    }
    return out;
  }
  window.SkyDiagramDefinitions = Object.freeze({
    definitions,
    common,
    titles,
    forModel,
    normalize,
  });
})();
