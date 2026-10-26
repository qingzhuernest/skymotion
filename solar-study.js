/** Controlled solar comparisons: one place across time, or one UTC instant across places. */
(() => {
  if (document.body.dataset.page !== 'diagrams' || !uiWorkspace) return;
  const words = {
    title: ['地点与时间', 'Place & time'],
    compareTime: ['比较时刻', 'Compare times'],
    comparePlace: ['比较地点', 'Compare places'],
    chooseCity: ['选择城市或调整坐标', 'Choose a city or adjust coordinates'],
    customSite: ['自定义地点', 'Custom location'],
    time: ['同一地点 · 不同时刻', 'One place · Different times'],
    place: ['同一瞬间 · 不同地点', 'One instant · Different places'],
    timeHelp: [
      '拖动下方时刻滑条，比较当前时刻及前后两个时刻。地点和日期保持不变。',
      'Drag the timeline below to move all three positions. The place and date stay fixed.',
    ],
    placeHelp: [
      '固定同一 UTC 瞬间，比较不同地点的天空。各地真太阳时和日期可能不同。',
      'Keep one UTC instant fixed and compare local skies. Apparent solar times and local dates can differ.',
    ],
    interval: ['比当前早 / 晚', 'Before / after the current time'],
    hour: ['1 小时', '1 hour'],
    three: ['3 小时', '3 hours'],
    six: ['6 小时', '6 hours'],
    current: ['当前地点', 'Current location'],
    second: ['对照地点 A', 'Location A'],
    third: ['对照地点 B', 'Location B'],
    lat: ['纬度 / °', 'Latitude / °'],
    lon: ['经度 / °', 'Longitude / °'],
    latitude: ['比较纬度', 'Compare latitudes'],
    longitude: ['比较经度', 'Compare longitudes'],
    earlier: ['较早', 'Earlier'],
    now: ['当前', 'Now'],
    later: ['较晚', 'Later'],
    solar: ['当地真太阳时', 'Apparent solar time'],
    utc: ['同一瞬间 · UTC', 'Shared instant · UTC'],
    alt: ['高度', 'Altitude'],
    az: ['方位', 'Azimuth'],
    above: ['地平线上方', 'Above horizon'],
    below: ['地平线下方', 'Below horizon'],
    north: ['北', 'N'],
    east: ['东', 'E'],
    south: ['南', 'S'],
    west: ['西', 'W'],
    zenith: ['天顶', 'Zenith'],
    model: [
      '天空半球 · 几何地平线 · 不计大气折射',
      'Sky hemisphere · Geometric horizon · No refraction',
    ],
    legend: [
      '实线为地平线上方的日轨迹，虚线为地平线下方。方位从正北顺时针量起。',
      'Solid paths are above the horizon; dashed paths are below. Azimuth is measured clockwise from north.',
    ],
    rollover: [
      '跨越午夜时，对照点使用相邻日期。',
      'Comparisons crossing midnight use the adjacent date.',
    ],
    ideal: [
      '理想模型没有对应的唯一 UTC 瞬间。请在“太阳计算方式”中关闭理想实验，再比较不同地点。',
      'An ideal declination has no unique UTC instant. Turn off the ideal model under Solar calculation to compare places.',
    ],
    idealTime: [
      '理想模型 · 固定赤纬，不模拟相邻日期的变化。',
      'Ideal model · Fixed declination; adjacent-day changes are not modeled.',
    ],
    outside: [
      '此对照时刻超出 1900–2100 年范围。',
      'This comparison falls outside the 1900–2100 range.',
    ],
    invalid: ['请输入范围内的经纬度。', 'Enter latitude and longitude within the stated ranges.'],
    noChange: [
      '对照点仅用于比较，不改变当前观测地点。日期和时刻在下方统一调整。',
      'Comparison sites do not change the primary observation location. Adjust the shared date and time below.',
    ],
    summary: ['太阳位置读数', 'Solar position readings'],
    sample: ['对照', 'Comparison'],
  };
  const english = () => document.documentElement.lang.startsWith('en');
  const t = (key) => words[key][english() ? 1 : 0];
  let mode = 'time',
    interval = 180,
    preset = 'latitude',
    custom = [null, null],
    active = false,
    lastKey = '',
    result = null;
  const colors = ['#d8bc86', '#a8c9bb', '#d7afa9'],
    cache = new Map();
  const ns = 'http://www.w3.org/2000/svg';
  function el(tag, cls, parent) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (parent) parent.append(n);
    return n;
  }
  function svg(tag, attrs, parent) {
    const n = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (parent) parent.append(n);
    return n;
  }
  function text(node, value) {
    if (node.textContent !== value) node.textContent = value;
  }
  function button(key, parent, action) {
    const b = el('button', '', parent);
    b.type = 'button';
    b.dataset.word = key;
    b.onclick = action;
    return b;
  }
  function caption(key, parent) {
    const n = el('p', 'solar-study-muted', parent);
    n.dataset.word = key;
    return n;
  }
  const rail = el('section', 'ui-diagram-details solar-study-controls');
  rail.id = 'solarStudyControls';
  rail.dataset.for = 'solarStudy';
  rail.dataset.i18nSkip = '';
  rail.hidden = true;
  const title = el('h2', '', rail);
  title.dataset.word = 'title';
  const switcher = el('div', 'solar-study-switch', rail);
  const modes = ['time', 'place'].map((key) =>
    button(key === 'time' ? 'compareTime' : 'comparePlace', switcher, () => {
      mode = key;
      lastKey = '';
      sync();
    }),
  );
  const help = caption('timeHelp', rail);
  const timeControls = el('div', 'solar-study-time-options', rail),
    intervalLabel = el('label', '', timeControls);
  const intervalText = el('span', '', intervalLabel);
  intervalText.dataset.word = 'interval';
  const select = el('select', '', intervalLabel);
  select.id = 'solarStudyInterval';
  for (const [value, key] of [
    [60, 'hour'],
    [180, 'three'],
    [360, 'six'],
  ]) {
    const o = el('option', '', select);
    o.value = value;
    o.dataset.word = key;
  }
  select.value = interval;
  select.onchange = () => {
    interval = Number(select.value);
    lastKey = '';
    sync();
  };
  const siteControls = el('div', 'solar-study-site-options', rail),
    examples = el('div', 'solar-study-presets', siteControls);
  const presets = ['latitude', 'longitude'].map((key) =>
    button(key, examples, () => {
      preset = key;
      custom = [null, null];
      lastKey = '';
      sync();
    }),
  );
  const primary = el('p', 'solar-study-primary', siteControls);
  const cityPickers = [];
  const fields = [0, 1].map((index) => {
    const group = el('fieldset', '', siteControls),
      legend = el('legend', '', group);
    legend.dataset.word = index ? 'third' : 'second';
    const cityLabel = el('label', '', group),
      cityText = el('span', '', cityLabel);
    cityText.dataset.word = 'chooseCity';
    const city = el('select', '', cityLabel);
    city.id = `solarStudy${index}city`;
    cityPickers.push(city);
    city.onchange = () => {
      const values = city.value.split(',').map(Number);
      if (values.length !== 2 || !values.every(Number.isFinite)) return;
      custom[index] = { lat: values[0], lon: values[1] };
      fields[index].forEach((input) => input.removeAttribute('aria-invalid'));
      lastKey = '';
      sync();
    };
    const pair = el('div', 'solar-study-coordinates', group);
    return ['lat', 'lon'].map((key) => {
      const label = el('label', '', pair),
        span = el('span', '', label);
      span.dataset.word = key;
      const input = el('input', '', label);
      input.type = 'number';
      input.step = 'any';
      input.min = key === 'lat' ? -90 : -180;
      input.max = key === 'lat' ? 90 : 180;
      input.id = `solarStudy${index}${key}`;
      input.dataset.field = key;
      input.addEventListener('change', () => {
        const values = fields[index].map((n) => n.valueAsNumber);
        if (
          fields[index].some((n) => !n.validity.valid || n.value === '') ||
          values.some((v) => !Number.isFinite(v))
        ) {
          input.setAttribute('aria-invalid', 'true');
          text(status, t('invalid'));
          return;
        }
        fields[index].forEach((n) => n.removeAttribute('aria-invalid'));
        custom[index] = { lat: values[0], lon: values[1] };
        lastKey = '';
        sync();
      });
      return input;
    });
  });
  const status = el('p', 'solar-study-status', rail);
  status.setAttribute('role', 'status');
  const note = caption('noChange', rail);
  const panel = el('section', 'solar-study-panel', uiWorkspace.plot);
  panel.id = 'solarStudyPanel';
  panel.hidden = true;
  panel.dataset.i18nSkip = '';
  const header = el('header', 'solar-study-heading', panel),
    heading = el('h2', '', header),
    anchor = el('p', '', header);
  const drawing = el('div', 'solar-study-drawings', panel),
    blocked = el('p', 'solar-study-blocked', panel);
  blocked.hidden = true;
  const cards = Array.from({ length: 3 }, (_, i) => {
    const card = el('figure', 'solar-study-card', drawing),
      name = el('figcaption', '', card),
      image = svg(
        'svg',
        {
          viewBox: '0 0 480 470',
          role: 'img',
          'aria-label': '',
          preserveAspectRatio: 'xMidYMid meet',
        },
        card,
      );
    const grid = svg(
      'g',
      { fill: 'none', stroke: '#9daeb5', 'stroke-opacity': '.25', 'stroke-width': '1' },
      image,
    );
    svg(
      'ellipse',
      { cx: 240, cy: 255, rx: 172, ry: 45, fill: '#a8c9bb', 'fill-opacity': '.035' },
      grid,
    );
    svg('path', { d: 'M68 255 A172 172 0 0 1 412 255' }, grid);
    // Vertical great circles in the local east/north/up frame.
    for (const axis of ['north', 'east']) {
      const pts = Array.from({ length: 49 }, (_, j) => {
        const a = (j * Math.PI) / 48;
        return project({
          x: axis === 'east' ? Math.cos(a) : 0,
          z: axis === 'north' ? Math.cos(a) : 0,
          y: Math.sin(a),
        });
      });
      svg('path', { d: path(pts) }, grid);
    }
    const labels = svg('g', { fill: '#bdc9cd', 'font-size': '18', 'text-anchor': 'middle' }, image);
    const directions = [];
    for (const [key, x, y] of [
      ['north', 240, 199],
      ['south', 240, 322],
      ['east', 431, 260],
      ['west', 49, 260],
      ['zenith', 240, 65],
    ]) {
      directions.push([svg('text', { x, y }, labels), key]);
    }
    svg('circle', { cx: 240, cy: 255, r: 3, fill: '#c5d0d3' }, image);
    const trajectory = svg('g', { fill: 'none', 'stroke-width': '2' }, image);
    const visible = svg('path', { stroke: colors[i] }, trajectory),
      hidden = svg(
        'path',
        { stroke: colors[i], 'stroke-opacity': '.35', 'stroke-dasharray': '4 6' },
        trajectory,
      );
    const markers = Array.from({ length: 3 }, (_, j) => {
      const g = svg('g', {}, image),
        line = svg(
          'line',
          { x1: 240, y1: 255, stroke: colors[j], 'stroke-width': '1', 'stroke-opacity': '.38' },
          g,
        ),
        dot = svg('circle', { r: 8, stroke: colors[j], 'stroke-width': '2' }, g),
        label = svg('text', { fill: colors[j], 'font-size': '18', 'text-anchor': 'middle' }, g);
      return { g, line, dot, label };
    });
    return { card, name, image, directions, visible, hidden, markers };
  });
  const tableWrap = el('div', 'solar-study-readings', panel),
    table = el('table', '', tableWrap),
    tableCaption = el('caption', '', table);
  tableCaption.dataset.word = 'summary';
  const thead = el('thead', '', table),
    tr = el('tr', '', thead);
  for (const key of ['sample', 'solar', 'alt', 'az']) {
    const th = el('th', '', tr);
    th.scope = 'col';
    th.dataset.word = key;
  }
  const tbody = el('tbody', '', table),
    rows = Array.from({ length: 3 }, () => {
      const row = el('tr', '', tbody);
      return Array.from({ length: 4 }, (_, i) => {
        const n = el(i ? 'td' : 'th', '', row);
        if (!i) n.scope = 'row';
        return n;
      });
    });
  const footer = caption('legend', rail);
  caption('model', rail);
  const grip = uiWorkspace.rail.querySelector('.motion-menu-grip');
  if (grip) (grip.closest('.motion-menu-header') || grip).after(rail);
  else uiWorkspace.rail.prepend(rail);
  uiWorkspace.details.push(rail);
  uiWorkspace.nodes.push(panel);
  function project(p) {
    return { x: 240 + p.x * 172, y: 255 - p.y * 172 - p.z * 45 };
  }
  function path(points) {
    return points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  }
  function paths(points, above) {
    let d = '',
      previous = null;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i];
      let from = a,
        to = b;
      if (a.alt >= 0 !== b.alt >= 0) {
        const k = -a.y / (b.y - a.y),
          cross = { x: a.x + (b.x - a.x) * k, y: 0, z: a.z + (b.z - a.z) * k, alt: 0 };
        if (a.alt >= 0 === above) to = cross;
        else from = cross;
      } else if (a.alt >= 0 !== above) {
        previous = null;
        continue;
      }
      const p = project(from),
        q = project(to);
      if (!previous || Math.hypot(previous.x - p.x, previous.y - p.y) > 0.1)
        d += `M${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
      d += `L${q.x.toFixed(2)} ${q.y.toFixed(2)}`;
      previous = q;
    }
    return d;
  }
  function at(instant, lat, lon) {
    const observer = new Astronomy.Observer(lat, lon, 0),
      eq = Astronomy.Equator('Sun', new Date(instant), observer, true, true),
      h = Astronomy.Horizon(new Date(instant), observer, eq.ra, eq.dec),
      a = (h.altitude * Math.PI) / 180,
      z = (h.azimuth * Math.PI) / 180;
    return {
      x: Math.cos(a) * Math.sin(z),
      y: Math.sin(a),
      z: Math.cos(a) * Math.cos(z),
      alt: h.altitude,
      az: h.azimuth,
    };
  }
  function dayPath(date, lat, lon) {
    const key = JSON.stringify([date, lat, lon, state.manual, state.manual ? state.dec : 0]);
    if (cache.has(key)) return cache.get(key);
    const noon = state.manual ? 0 : solarNoonUTC(date, lon),
      points = Array.from({ length: 97 }, (_, i) =>
        state.manual ? solar(lat, state.dec, i * 15) : at(noon + (i * 15 - 720) * 60000, lat, lon),
      );
    const p = { above: paths(points, true), below: paths(points, false) };
    if (cache.size >= 24) cache.delete(cache.keys().next().value);
    cache.set(key, p);
    return p;
  }
  function clock(value) {
    if (!Number.isFinite(value)) return '—';
    const n = ((Math.round(value) % 1440) + 1440) % 1440;
    return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  }
  function locationText(lat, lon) {
    return `${Math.abs(lat).toFixed(1)}°${lat < 0 ? 'S' : 'N'} · ${Math.abs(lon).toFixed(1)}°${lon < 0 ? 'W' : 'E'}`;
  }
  function sites() {
    return [
      { lat: state.lat, lon: state.lon },
      ...[0, 1].map(
        (i) =>
          custom[i] ||
          (preset === 'latitude'
            ? { lat: i ? (Math.abs(state.lat) < 0.1 ? -40 : -state.lat) : 0, lon: state.lon }
            : { lat: state.lat, lon: ((state.lon + (i ? -60 : 60) + 540) % 360) - 180 }),
      ),
    ];
  }
  function comparison() {
    const utc = instantUTC().getTime();
    if (mode === 'place') {
      if (state.manual) return { blocked: true, samples: [], utc };
      return {
        utc,
        samples: sites().map((s, i) => {
          const local = observerClockAt(utc, s.lon);
          return {
            ...s,
            name: t(['current', 'second', 'third'][i]),
            date: local?.date,
            time: local?.time,
            instant: utc,
            point: local ? at(utc, s.lat, s.lon) : null,
          };
        }),
      };
    }
    return {
      utc,
      samples: [-interval, 0, interval].map((offset, i) => {
        const raw = state.time + offset,
          days = Math.floor(raw / 1440),
          minute = raw - days * 1440,
          date = new Date(Date.parse(state.date + 'T12:00:00Z') + days * 86400000)
            .toISOString()
            .slice(0, 10),
          valid = SkyMotionSession.validDate(date);
        return {
          lat: state.lat,
          lon: state.lon,
          name: t(['earlier', 'now', 'later'][i]),
          date,
          time: minute,
          instant: valid && !state.manual ? instantUTC(minute, date, state.lon).getTime() : null,
          point: (state.manual || valid)
            ? state.manual
              ? solar(state.lat, state.dec, minute)
              : skyRaw('Sun', minute, date, state.lat, state.lon)
            : null,
        };
      }),
    };
  }
  function sync() {
    const wasActive = active;
    active =
      uiWorkspace.selected === 'solarStudy' &&
      state.body === 'sun' &&
      window.SkyCustomization?.active === true;
    if (!active) return;
    if (!wasActive)
      requestAnimationFrame(() =>
        document.querySelector('[data-rail-section=conditions]')?.click(),
      );
    const key = JSON.stringify([
      mode,
      interval,
      preset,
      custom,
      state.date,
      state.time,
      state.lat,
      state.lon,
      state.manual,
      state.dec,
      english(),
    ]);
    if (key === lastKey) return;
    lastKey = key;
    result = comparison();
    result.conditions = {
      date: state.date,
      time: state.time,
      lat: state.lat,
      lon: state.lon,
      manual: state.manual,
      dec: state.dec,
    };
    panel.dataset.mode = mode;
    for (const root of [rail, panel])
      for (const n of root.querySelectorAll('[data-word]')) text(n, t(n.dataset.word));
    text(help, t(mode === 'time' ? 'timeHelp' : 'placeHelp'));
    modes.forEach((b, i) => b.setAttribute('aria-pressed', String(mode === ['time', 'place'][i])));
    presets.forEach((b, i) =>
      b.setAttribute(
        'aria-pressed',
        String(!custom.some(Boolean) && preset === ['latitude', 'longitude'][i]),
      ),
    );
    timeControls.hidden = mode !== 'time';
    siteControls.hidden = mode !== 'place';
    text(primary, `${t('current')} · ${locationText(state.lat, state.lon)}`);
    const locations = sites();
    cityPickers.forEach((city, i) => {
      city.replaceChildren();
      const customOption = el('option', '', city);
      customOption.value = '';
      customOption.textContent = t('customSite');
      for (const option of document.querySelectorAll('#place option')) {
        if (option.value.split(',').length === 2) city.append(option.cloneNode(true));
      }
      city.value =
        [...city.options].find((option) => {
          const values = option.value.split(',').map(Number);
          return (
            values.length === 2 &&
            Math.abs(values[0] - locations[i + 1].lat) < 1e-6 &&
            Math.abs(values[1] - locations[i + 1].lon) < 1e-6
          );
        })?.value || '';
    });
    fields.forEach((pair, i) =>
      pair.forEach((n, j) => {
        if (document.activeElement !== n && !n.hasAttribute('aria-invalid'))
          n.value = Number(locations[i + 1][j ? 'lon' : 'lat'].toFixed(4));
        if (!n.dataset.scrubbable) {
          n.dataset.scrubbable = 'true';
          const key = j ? 'lon' : 'lat';
          SkyParameterControls.attach(n, {
            label: () => `${t(i ? 'third' : 'second')} · ${t(key)}`,
            min: Number(n.min),
            max: Number(n.max),
            step: 0.1,
            read: () => sites()[i + 1][key],
            begin: () => custom.map((site) => (site ? { ...site } : null)),
            preview(value) {
              custom[i] = { ...sites()[i + 1], [key]: value };
              n.removeAttribute('aria-invalid');
              lastKey = '';
              sync();
            },
            commit() {},
            cancel(before) {
              custom = before;
              lastKey = '';
              sync();
            },
          });
        } else SkyParameterControls.sync(n);
      }),
    );
    const ideal = mode === 'place' && state.manual;
    blocked.hidden = !ideal;
    drawing.hidden = ideal;
    tableWrap.hidden = ideal;
    footer.hidden = ideal;
    note.hidden = mode !== 'place';
    text(blocked, ideal ? t('ideal') : '');
    text(heading, t(mode));
    text(
      anchor,
      ideal
        ? ''
        : mode === 'place'
          ? `${t('utc')} · ${new Date(result.utc).toISOString().slice(0, 19).replace('T', ' ')}`
          : `${state.date} · ${locationText(state.lat, state.lon)}`,
    );
    if (!fields.flat().some((n) => n.hasAttribute('aria-invalid')))
      text(status, mode === 'time' ? t(state.manual ? 'idealTime' : 'rollover') : '');
    if (ideal) return;
    cards.forEach((card, i) => {
      card.card.hidden = mode === 'time' && i > 0;
      if (card.card.hidden) return;
      const sample = result.samples[i],
        pathDate = mode === 'place' ? sample.date : state.date,
        p =
          pathDate && (mode !== 'place' || sample.point)
            ? dayPath(pathDate, sample.lat, sample.lon)
            : { above: '', below: '' };
      card.visible.setAttribute('d', p.above);
      card.hidden.setAttribute('d', p.below);
      card.visible.setAttribute('stroke', mode === 'time' ? '#b9c5c6' : colors[i]);
      text(
        card.name,
        mode === 'time' ? t('solar') : `${sample.name} · ${locationText(sample.lat, sample.lon)}`,
      );
      card.image.setAttribute(
        'aria-label',
        `${t(mode)} · ${mode === 'time' ? locationText(state.lat, state.lon) : sample.name}`,
      );
      card.directions.forEach(([n, key]) => text(n, t(key)));
      card.markers.forEach((marker, j) => {
        const s = mode === 'time' ? result.samples[j] : j === 0 ? sample : null;
        marker.g.setAttribute('display', s?.point ? '' : 'none');
        if (!s?.point) return;
        const q = project(s.point),
          color = colors[mode === 'time' ? j : i],
          above = s.point.alt >= 0;
        for (const n of [marker.line, marker.dot]) n.setAttribute('stroke', color);
        marker.line.setAttribute('x2', q.x);
        marker.line.setAttribute('y2', q.y);
        marker.line.setAttribute('stroke-dasharray', above ? '' : '4 5');
        marker.dot.setAttribute('cx', q.x);
        marker.dot.setAttribute('cy', q.y);
        marker.dot.setAttribute('fill', above ? color : '#142638');
        marker.g.setAttribute('opacity', above ? '1' : '.6');
        text(marker.label, clock(s.time));
        marker.label.setAttribute('fill', color);
        marker.label.setAttribute('x', q.x);
        marker.label.setAttribute('y', q.y + (j === 1 ? -14 : 22));
      });
    });
    result.samples.forEach((s, i) => {
      const r = rows[i];
      text(r[0], s.name);
      r[2].dataset.label = t('alt');
      r[3].dataset.label = t('az');
      r[0].style.setProperty('--sample-color', colors[i]);
      text(r[1], s.date ? `${s.date} · ${clock(s.time)}` : '—');
      text(
        r[2],
        s.point
          ? `${s.point.alt.toFixed(1)}° · ${t(s.point.alt >= 0 ? 'above' : 'below')}`
          : t('outside'),
      );
      text(r[3], s.point ? `${s.point.az.toFixed(1)}°` : '—');
    });
  }
  window.SkySolarStudy = {
    sync,
    read: () => (result ? JSON.parse(JSON.stringify({ mode, ...result })) : null),
  };
  new ResizeObserver(() => {
    if (!active || uiWorkspace.tabs.classList.contains('workbench-route-tabs')) return;
    const tab = uiWorkspace.tabs.querySelector('[data-route-diagram=solarStudy]'),
      a = tab.getBoundingClientRect(),
      b = uiWorkspace.tabs.getBoundingClientRect();
    if (a.left < b.left || a.right > b.right)
      uiWorkspace.tabs.scrollLeft += a.left - b.left - (b.width - a.width) / 2;
  }).observe(uiWorkspace.tabs);
  document.addEventListener('skymotion:language', () => {
    lastKey = '';
    sync();
  });
  schedule();
})();
