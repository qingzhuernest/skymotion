/* Local lexical retrieval; no scientific state reads, writes, or generated facts. */
function canonical(value) {
  return String(value).normalize('NFKC').toLowerCase()
    .replace(/太样/g,'太阳').replace(/軌/g,'轨').replace(/兩/g,'两').replace(/陽/g,'阳')
    .replace(/比較/g,'比较').replace(/緯/g,'纬').replace(/顯示/g,'显示')
    .replace(/行星半月/g,'行星伴月');
}
export function normalize(value) {return canonical(value).replace(/[^\p{L}\p{N}]/gu,'');}
function tokens(text) {
  const words = canonical(text).match(/[a-z]+|\d+|[\u3400-\u9fff]+/g)||[];
  return words.flatMap(word=> /[\u3400-\u9fff]/.test(word)
    ? Array.from({length:Math.max(1,word.length-1)},(_,i)=>word.slice(i,i+2)) : [word.replace(/(ing|es|s)$/,'')]);
}
export function guard(query) {
  if (/(天气|新闻|股票|写小说|写代码|weather|stock price|latest news|write (a )?(story|code))/i.test(query)) return 'outside';
  if (/(今天|明天|现在|此刻|today|tomorrow|right now|current)/i.test(query) &&
      /(几点|多少|几时|高度|方位|日出|日落|时刻|sunset|sunrise|altitude|azimuth|what time|how (high|long))/i.test(query)) return 'dynamic';
  if (/(日出|日落|月出|月落|太阳高度|月球高度|sunrise|sunset|solar altitude|moonrise|moonset)/i.test(query) &&
      /(几点|几时|多少度|是多少|精确时刻|what time|exact time|how high|calculate)/i.test(query)) return 'dynamic';
  if (/(帮我|替我|直接|please|can you).*(设置|添加|保存|点击|set |add |save |click )/i.test(query)) return 'action';
  return null;
}
export function createSearch(records) {
  const documents = records.map(card=>{
    const fields=[card.title,...card.aliases,card.en?.title||''];
    return {card,forms:fields.map(normalize),terms:tokens([...fields,...fields,card.answer,...card.steps].join(' '))};
  });
  const frequency=new Map();
  for (const doc of documents) for (const token of new Set(doc.terms)) frequency.set(token,(frequency.get(token)||0)+1);
  const average=documents.reduce((n,d)=>n+d.terms.length,0)/documents.length;
  return query=>{
    const cleaned=normalize(query), terms=[...new Set(tokens(query))];
    if (!cleaned || !terms.length) return [];
    return documents.map(({card,forms,terms:document})=>{
      let score=0, matched=0;
      for(const term of terms){
        const count=document.filter(t=>t===term).length;
        if(!count)continue;
        matched++;
        const idf=Math.log(1+(records.length-(frequency.get(term)||0)+0.5)/((frequency.get(term)||0)+0.5));
        score+=idf*count*2.2/(count+1.2*(0.25+0.75*document.length/average));
      }
      const exact=forms.some(form=>form===cleaned || (form.length>=6&&cleaned.includes(form)));
      const coverage=matched/terms.length;
      return {card,score:score+(exact?1000:0),exact,coverage};
    }).filter(hit=>hit.score>0).sort((a,b)=>b.score-a.score).slice(0,5);
  };
}

// Explicit, reviewed task plans supplement retrieval; scientific questions remain distinct.
export function interpretTask(query) {
  const text=normalize(query);
  if(/是什么|什么是|为什么|原理|定义|whatis|why|definition/.test(text))return null;
  const planet=[['火星','Mars'],['金星','Venus'],['水星','Mercury'],['木星','Jupiter'],['土星','Saturn']]
    .find(([zh,en])=>text.includes(zh)||text.includes(en.toLowerCase()));
  if(planet&&/月球|月亮|moon/.test(text)&&/相对|位置|角距|夹角|伴月|比较|relative|position|separation|compare/.test(text))
    return {id:'site:MOON-012',intent:'compare',planet};
  if(/行星伴月|planetmoon|planetnearmoon/.test(text)){
    const intent=/开启|启用|开关|enable|turnon/.test(text)?'enable':/打开|进入|open/.test(text)?'open':'howto';
    return {id:'site:MOON-011',intent,variant:intent==='howto'?null:intent};
  }
  if(/太阳.{0,2}视运动|太阳日轨迹|apparentsolarmotion|observethesun/.test(text)
      &&/如何|怎么|怎样|观察|看|使用|how|observe/.test(text)
      &&!/城市|不同地点|不同纬度|同屏|叠加|cities|city|overlay/.test(text))
    return {id:'site:LAB-001',intent:'observe'};
  return null;
}

export function selectAnswer(query,hits,records) {
  const task=interpretTask(query);
  if(task){
    const card=records.find(card=>card.id===task.id);
    if(card&&card.status!=='draft'){
      const answer={...card,...(card.variants?.[task.variant]||{})};
      if(task.planet){
        const [zh,en]=task.planet;
        for(const field of ['title','answer'])answer[field]=answer[field].replaceAll('目标行星',zh);
        answer.steps=answer.steps.map(step=>step.replaceAll('目标行星',zh));
        if(answer.en)answer.en={...answer.en,title:answer.en.title.replaceAll('the target planet',en),
          answer:answer.en.answer.replaceAll('the target planet',en),steps:answer.en.steps.map(step=>step.replaceAll('the target planet',en))};
      }
      return {card:answer,reason:'reviewed_task_plan',intent:task.intent};
    }
    return {reason:'task_not_reviewed',intent:task.intent};
  }
  const top=hits[0];
  const strong=top&&(top.exact||(top.coverage>=0.72&&top.score>=12&&top.score>(hits[1]?.score||0)*1.28));
  if(strong&&top.card.status!=='draft')return {card:top.card,reason:'strong_reviewed_lexical_match'};
  if(top?.exact)return {card:top.card,reason:'explicit_draft_lookup'};
  return {reason:top?.card.status==='draft'?'draft_or_weak_match':'weak_or_ambiguous_match'};
}
