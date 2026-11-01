/* Local lexical retrieval; no scientific state reads, writes, or generated facts. */
export function normalize(value) {
  return String(value).normalize('NFKC').toLowerCase()
    .replace(/太样/g,'太阳').replace(/軌/g,'轨').replace(/兩/g,'两').replace(/陽/g,'阳')
    .replace(/比較/g,'比较').replace(/緯/g,'纬').replace(/顯示/g,'显示')
    .replace(/[^\p{L}\p{N}]/gu,'');
}
function tokens(text) {
  const words = String(text).normalize('NFKC').toLowerCase().match(/[a-z]+|\d+|[\u3400-\u9fff]+/g)||[];
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
