/** Read-only retrieval: one query analysis, an inverted text index and sourced answers. */
const HAN = /\p{Script=Han}/u;
const ENGLISH_STOPS = new Set(
  'a an the what which who how why do does i is are am be can could would you me my please tell about of in on to for it this that'.split(
    ' ',
  ),
);
const OPERATIONS = [
  ['delete', /删除|移除|清空|\b(delete|remove)\b/i],
  ['import', /导入|\bimport\b/i],
  ['export', /导出|\bexport\b/i],
  ['rename', /重命名|改名|更名|\brename\b/i],
  ['restore', /恢复|重置|\b(restore|reset)\b/i],
  ['copy', /复制|\bcopy\b/i],
  ['save', /保存|存档|\bsave\b/i],
  ['disable', /关闭|隐藏|关掉|停止|暂停|\b(disable|hide)\b|turn\s*off/i],
];
const USAGE =
  /打开|开启|启用|关闭|设置|调节|修改|更改|切换|保存|导入|导出|添加|删除|重置|操作|使用|用法|教程|怎么用|如何用|\b(usage|instructions|tutorial|open|enable|disable|configure|adjust|save|import|export|add|delete|reset|use)\b/i;
const UI_CONTROLS =
  /按钮|菜单|开关|设置|切换|调节|修改|更改|实验台|界面|\b(button|menu|switch|settings|interface)\b/i;
const SCIENCE =
  /为什么|为何|原理|定义|公式|区别|关系|成因|原因|什么是|是什么|怎么算|如何计算|怎么计算|怎样计算|计算公式|whatis|whatare|whatkindofobject|why|definition|formula|difference/;
const corpusCache = new WeakMap();

function canonical(value) {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/的/g, '')
    .replace(/太样/g, '太阳')
    .replace(/軌/g, '轨')
    .replace(/兩/g, '两')
    .replace(/陽/g, '阳')
    .replace(/比較/g, '比较')
    .replace(/緯/g, '纬')
    .replace(/顯示/g, '显示')
    .replace(/行星半月/g, '行星伴月')
    .replace(/太阳高度角/g, '太阳高度')
    .replace(/观察城市|观测城市|预设城市|观测地点|观察地点/g, '地点')
    .replace(/竖直立杆高度|立杆高度|杆高度/g, '杆高')
    .replace(/新增|增加/g, '添加');
}
export function normalize(value) {
  return canonical(value).replace(/[^\p{L}\p{N}]/gu, '');
}
function stem(word) {
  if (word.length < 4) return word;
  if (/ies$/.test(word)) return word.slice(0, -3) + 'y';
  if (/(sses|shes|ches|xes|zes)$/.test(word)) return word.slice(0, -2);
  return /s$/.test(word) && !/(ss|us|is)$/.test(word) ? word.slice(0, -1) : word;
}
function tokens(text) {
  const words = canonical(text).match(/[a-z]+|\d+|[\u3400-\u9fff]+/g) || [];
  return words.flatMap((word) =>
    HAN.test(word)
      ? Array.from({ length: Math.max(1, word.length - 1) }, (_, i) => word.slice(i, i + 2))
      : [stem(word)],
  );
}
export function questionCore(value) {
  // English boundaries are handled before removing spaces: 'theme' must remain 'theme'.
  let text = String(value).replace(
    /^(?:(?:can you tell me|please explain|tell me about|what kind of object is|what is|what are|explain|the)\s+)+/i,
    '',
  );
  text = normalize(text).replace(/到底|究竟/g, '');
  let previous;
  do {
    previous = text;
    text = text
      .replace(
        /^(请问|请|简单解释|介绍一下|介绍|我想知道|我想|我应该|请解释|解释一下|解释|告诉我|能不能|可不可以|可以|能否|能|帮我|替我|计算|如何|怎么样|怎样|怎么才能|怎么|什么是|什么叫|何为|在哪里|哪里|查看|观察|观测|使用|显示|打开|开启|启用|进入|选择|调节|调整|设置|更改|修改|改变|切换|了解|看看)/,
        '',
      )
      .replace(
        /(取决于哪些量|由哪些量决定|怎样快速计算|如何计算|怎么计算|怎样计算|计算方法|怎么算|如何求|怎么求|应该怎么操作|该怎么操作|怎么操作|怎样操作|如何使用|怎么使用|怎么用|是什么意思|是什么|怎么理解|如何理解|是怎么回事|怎样观察|怎么看|怎么调|怎么设置|在哪里|源码|代码|函数说明|(?<!自)定义|吗|呢)$/,
        '',
      );
  } while (text !== previous);
  return text;
}
export function operation(value) {
  return OPERATIONS.find(([, pattern]) => pattern.test(String(value)))?.[0] || null;
}
function classify(value, normalized, usage) {
  if (
    /源码|代码|开发|函数|接口|\.js\b|\.css\b|\b(state|api|source|code|architecture)\b/i.test(value)
  )
    return 'developer';
  if (
    /公式|怎么算|如何计算|怎么计算|怎样计算|how.*calculate/i.test(value) &&
    !UI_CONTROLS.test(value)
  )
    return 'science';
  // 'Why does the Sun use fusion?' is an explanation, not a request to use a control.
  const cause = /为什么|为何|\bwhy\b/i.test(value);
  const action =
    /打开|开启|关闭|保存|导入|导出|删除|添加|重置|\b(open|enable|disable|save|import|export|delete|add|reset)\b/i.test(
      value,
    );
  if (cause && !action && !UI_CONTROLS.test(value)) return 'science';
  if (usage) return 'howto';
  if (SCIENCE.test(normalized) || (/解释|含义|概念/.test(value) && !/如何|怎样|怎么/.test(value)))
    return 'science';
  if (
    !/如何|怎么|怎样|操作|使用|查看|观察|how|show/i.test(value) &&
    /颜色|组成|有哪些|多少颗|八大行星|恒星|太阳系.*行星|color|composition|whichplanets/.test(
      normalized,
    )
  )
    return 'science';
  if (
    !/图|自定义|界面|按钮/.test(value) &&
    /太阳系|八大行星/.test(value) &&
    /排列|顺序/.test(value)
  )
    return 'science';
  if (/教学|课堂|学生|一节课|教学任务|\b(lesson|teaching)\b/i.test(value)) return 'teaching';
  return 'howto';
}
export function analyzeQuery(value) {
  const text = String(value).trim(),
    normalized = normalize(text),
    usage = USAGE.test(text);
  const core = questionCore(text),
    kind = classify(text, normalized, usage);
  const terms = [
    ...new Set(
      HAN.test(text)
        ? tokens(core.length >= 2 ? core : text)
        : tokens(text).filter((word) => !ENGLISH_STOPS.has(word)),
    ),
  ];
  return { text, normalized, core, kind, usage, operation: operation(text), terms };
}
function analysis(value) {
  return typeof value === 'string' ? analyzeQuery(value) : value;
}
export function queryKind(value) {
  return analyzeQuery(value).kind;
}
export function compatible(value, card) {
  const query = analysis(value);
  return !(
    (query.kind === 'howto' && query.usage && card.intent === 'science') ||
    (card.intent === 'developer' && query.kind !== 'developer')
  );
}

export function guard(query) {
  const plain = query.replace(/<[^>]*>/g, '').trim();
  if (/^(你好|您好|嗨|hello|hi)[！!。.，, ]*$/i.test(plain)) return 'greeting';
  if (/应怎样回答|该怎样答|怎样回复|如何回答|怎么答/.test(query)) return null;
  if (/公式|原理|计算方法|如何计算|怎么计算/.test(query) && !/几点|多少度|具体数值/.test(query))
    return null;
  const guidance = /如何|怎么|怎样|哪里|观察|查看|how.*(observe|view|use)|where/i.test(query);
  if (
    /^(天气|weather)$|天气预报|明天.*(下雨|晴天)|新闻|股票|写.{0,4}小说|weather forecast|stock price|latest news|write (a )?story/i.test(
      plain,
    )
  )
    return 'outside';
  if (
    /太阳|月球|月亮|行星|火星|金星|土星|木星|影长|高度|方位|升落|日出|日落|sun|moon|planet|shadow|altitude|azimuth/i.test(
      query,
    ) &&
    (!guidance || /几点|多少|几时|what time|how high/i.test(query)) &&
    /(今天|明天|现在|此刻|today|tomorrow|right now|current)/i.test(query) &&
    /(几点|多少|几时|高度|方位|日出|日落|时刻|sunset|sunrise|altitude|azimuth|what time|how (high|long))/i.test(
      query,
    )
  )
    return 'dynamic';
  if (
    /(日出|日落|月出|月落|太阳高度|月球高度|sunrise|sunset|solar altitude|moonrise|moonset)/i.test(
      query,
    ) &&
    /(几点|几时|多少度|是多少|精确时刻|what time|exact time|how high|calculate)/i.test(query)
  )
    return 'dynamic';
  if (/(帮我|替我|直接|please|can you).*(设置|添加|保存|点击|set |add |save |click )/i.test(query))
    return 'action';
  return null;
}

function corpus(records) {
  if (!corpusCache.has(records)) {
    const byId = new Map(records.map((card) => [card.id, card]));
    const topics = [],
      toggles = [];
    for (const card of records) {
      if (card.status !== 'draft')
        for (const term of card.taskTerms || []) topics.push({ card, term: normalize(term) });
      if (card.variants?.disable)
        for (const term of card.disableTerms || []) toggles.push({ card, term: normalize(term) });
    }
    topics.sort((a, b) => b.term.length - a.term.length);
    toggles.sort((a, b) => b.term.length - a.term.length);
    corpusCache.set(records, { byId, topics, toggles });
  }
  return corpusCache.get(records);
}
export function createSearch(records) {
  const postings = new Map(),
    cores = new Map(),
    forms = new Map();
  const add = (map, key, index) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(index);
  };
  const documents = records.map((card, index) => {
    const fields = [card.title, ...card.aliases, card.en?.title || ''];
    const terms = tokens(
      [
        ...fields,
        ...fields,
        card.answer,
        ...card.steps,
        card.en?.answer || '',
        ...(card.en?.steps || []),
        card.fullText || '',
        card.fullTextEn || '',
      ].join(' '),
    );
    const counts = new Map();
    for (const term of terms) counts.set(term, (counts.get(term) || 0) + 1);
    for (const term of counts.keys()) add(postings, term, index);
    const normalized = fields.map(normalize),
      questionCores = fields.map(questionCore);
    for (const form of normalized) if (form) add(forms, form, index);
    for (const core of questionCores) if (core.length >= 2) add(cores, core, index);
    return {
      card,
      forms: normalized,
      cores: new Set(questionCores),
      counts,
      length: terms.length,
      operation: operation(card.title),
    };
  });
  const average = documents.reduce((sum, doc) => sum + doc.length, 0) / documents.length || 1;
  const idfs = new Map(
    [...postings].map(([term, rows]) => [
      term,
      Math.log(1 + (records.length - rows.size + 0.5) / (rows.size + 0.5)),
    ]),
  );
  for (const doc of documents) doc.lengthPenalty = 1.2 * (0.25 + (0.75 * doc.length) / average);
  const byId = new Map(documents.map((doc) => [doc.card.id, doc]));
  corpus(records);
  const retrieve = (value) => {
    const query = analysis(value);
    if (!query.normalized || !query.terms.length) return [];
    const candidates = new Set();
    for (const term of query.terms)
      for (const index of postings.get(term) || []) candidates.add(index);
    for (const index of forms.get(query.normalized) || []) candidates.add(index);
    for (const index of cores.get(query.core) || []) candidates.add(index);
    const hits = [];
    for (const index of candidates) {
      const doc = documents[index],
        card = doc.card;
      if (!compatible(query, card)) continue;
      let score = 0,
        matched = 0;
      for (const term of query.terms) {
        const count = doc.counts.get(term) || 0;
        if (!count) continue;
        matched++;
        score += (idfs.get(term) * count * 2.2) / (count + doc.lengthPenalty);
      }
      const titleExact = doc.forms[0] === query.normalized;
      const aliasExact = doc.forms.slice(1).includes(query.normalized);
      const coreExact = query.core.length >= 2 && doc.cores.has(query.core);
      const contained = doc.forms.some(
        (form) => form.length >= 6 && query.normalized.includes(form),
      );
      const opposite = query.operation && doc.operation && query.operation !== doc.operation;
      const exact = !opposite && (titleExact || aliasExact || contained);
      if (!opposite)
        score += titleExact ? 2000 : aliasExact ? 1800 : contained ? 1000 : coreExact ? 800 : 0;
      if ((exact || coreExact) && card.status !== 'draft') score += 250;
      if (query.kind === 'science' && card.intent === 'science' && matched) score += 12;
      if (query.kind === 'teaching' && card.id.startsWith('GUIDE:') && matched) score += 12;
      if (opposite) score *= 0.1;
      if (score > 0)
        hits.push({
          card,
          score,
          exact,
          coreExact: coreExact && !opposite,
          coverage: matched / query.terms.length,
        });
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, 5);
  };
  retrieve.evidence = (value, id) => {
    const query = analysis(value),
      doc = byId.get(id);
    if (!doc || !query.terms.length || !compatible(query, doc.card)) return null;
    return {
      card: doc.card,
      coverage: query.terms.filter((term) => doc.counts.has(term)).length / query.terms.length,
    };
  };
  return retrieve;
}

export function interpretTask(query) {
  const text = normalize(query);
  if (/是什么|什么是|为什么|原理|定义|whatis|why|definition/.test(text)) return null;
  const planet = [
    ['火星', 'Mars'],
    ['金星', 'Venus'],
    ['水星', 'Mercury'],
    ['木星', 'Jupiter'],
    ['土星', 'Saturn'],
  ].find(([zh, en]) => text.includes(zh) || text.includes(en.toLowerCase()));
  if (
    planet &&
    /月球|月亮|moon/.test(text) &&
    /相对|位置|角距|夹角|伴月|比较|relative|position|separation|compare/.test(text)
  )
    return { id: 'site:MOON-012', intent: 'compare', planet };
  if (/行星伴月|planetmoon|planetnearmoon/.test(text)) {
    const intent = /关闭|禁用|关掉|disable|turnoff/.test(text)
      ? 'disable'
      : /开启|启用|开关|enable|turnon/.test(text)
        ? 'enable'
        : /打开|进入|open/.test(text)
          ? 'open'
          : 'howto';
    return { id: 'site:MOON-011', intent, variant: intent === 'howto' ? null : intent };
  }
  if (
    /太阳.{0,2}视运动|太阳日轨迹|apparentsolarmotion|observethesun/.test(text) &&
    /如何|怎么|怎样|观察|看|使用|how|observe/.test(text) &&
    !/城市|不同地点|不同纬度|同屏|叠加|cities|city|overlay/.test(text)
  )
    return { id: 'site:LAB-001', intent: 'observe' };
  return null;
}

export function selectAnswer(value, hits, records) {
  const parsed = analysis(value),
    query = parsed.text,
    catalog = corpus(records);
  if (parsed.operation === 'disable') {
    const text = normalize(query);
    const toggle = catalog.toggles.find(({ term }) => term.length >= 2 && text.includes(term));
    if (toggle)
      return {
        card: { ...toggle.card, ...toggle.card.variants.disable },
        reason: 'documented_toggle_off',
        intent: 'disable',
      };
  }
  const task = interpretTask(query);
  if (task) {
    const card = catalog.byId.get(task.id);
    if (card && card.status !== 'draft') {
      const answer = { ...card, ...(card.variants?.[task.variant] || {}) };
      if (task.planet) {
        const [zh, en] = task.planet;
        for (const field of ['title', 'answer'])
          answer[field] = answer[field].replaceAll('目标行星', zh);
        answer.steps = answer.steps.map((step) => step.replaceAll('目标行星', zh));
        if (answer.en)
          answer.en = {
            ...answer.en,
            title: answer.en.title.replaceAll('the target planet', en),
            answer: answer.en.answer.replaceAll('the target planet', en),
            steps: answer.en.steps.map((step) => step.replaceAll('the target planet', en)),
          };
      }
      return { card: answer, reason: 'reviewed_task_plan', intent: task.intent };
    }
    return { reason: 'task_not_reviewed', intent: task.intent };
  }
  const top = hits[0];
  if (top?.exact)
    return {
      card: top.card,
      reason:
        top.card.status === 'draft' ? 'attributed_exact_source' : 'strong_reviewed_lexical_match',
    };
  const text = normalize(query);
  if (top?.coreExact && top.card.intent === 'science' && parsed.kind === 'science')
    return { card: top.card, reason: 'corpus_science_match' };
  if (parsed.kind === 'howto') {
    const topic = catalog.topics.find(
      ({ card, term }) =>
        text.includes(term) && (!parsed.operation || operation(card.title) === parsed.operation),
    );
    if (topic) return { card: topic.card, reason: 'documented_feature_topic', intent: 'howto' };
  }
  if (top?.coreExact && top.score - (hits[1]?.score || 0) > 20)
    return { card: top.card, reason: 'corpus_question_match' };
  if (
    top &&
    parsed.operation &&
    operation(top.card.title) === parsed.operation &&
    top.coverage >= 0.6 &&
    top.score >= 10 &&
    top.score > (hits[1]?.score || 0) * 1.5
  )
    return { card: top.card, reason: 'source_action_match' };
  const strong =
    top &&
    (top.exact ||
      (top.coverage >= 0.72 && top.score >= 12 && top.score > (hits[1]?.score || 0) * 1.28));
  if (strong)
    return {
      card: top.card,
      reason:
        top.card.status === 'draft' ? 'attributed_source_match' : 'strong_reviewed_lexical_match',
    };
  if (top?.exact) return { card: top.card, reason: 'explicit_draft_lookup' };
  return {
    reason: top?.card.status === 'draft' ? 'draft_or_weak_match' : 'weak_or_ambiguous_match',
  };
}

export function selectSemanticAnswer(value, matches, hits, records, evidence) {
  const parsed = analysis(value),
    catalog = corpus(records);
  matches = matches.filter((hit) => {
    const card = catalog.byId.get(hit.id);
    return card && compatible(parsed, card);
  });
  const top = matches[0],
    next = matches[1];
  if (!top || top.score < 0.7 || top.score - (next?.score || 0) < 0.07) return null;
  const card = catalog.byId.get(top.id),
    lexical = hits.find((hit) => hit.card.id === top.id) || evidence?.(parsed, top.id);
  if (!lexical || lexical.coverage < 0.5) return null;
  if (parsed.operation && operation(card.title) !== parsed.operation) return null;
  return card;
}

/** Rank fusion is used for suggestions only; it never relaxes answer evidence thresholds. */
export function combineCandidates(value, lexicalHits, semanticHits, records, limit = 3) {
  const parsed = analysis(value),
    byId = corpus(records).byId,
    scores = new Map();
  const add = (id, score) => {
    const card = byId.get(id);
    if (card && compatible(parsed, card)) scores.set(id, (scores.get(id) || 0) + score);
  };
  lexicalHits.forEach((hit, rank) =>
    add(hit.card.id, 1 / (61 + rank) + (hit.exact ? 0.04 : hit.coreExact ? 0.02 : 0)),
  );
  semanticHits
    .filter((hit) => hit.score >= 0.5)
    .forEach((hit, rank) => add(hit.id, 1 / (61 + rank)));
  return [...scores]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => byId.get(id));
}

export function contextualQuery(query, previousId) {
  // Only short anaphoric follow-ups inherit a city-comparison task, not every later 'save'.
  return previousId === 'site:EDIT-002' &&
    /^(怎么保存|如何保存|怎样保存|保存这个|保存这两个城市|怎么保存这两个城市|how (?:do i|to) save(?: (?:this|them|both))?)[?？。.!！]*$/i.test(
      query.trim(),
    )
    ? '两个城市保存在完整实验'
    : query;
}
