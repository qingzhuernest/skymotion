/** Corpus-wide generated coverage probes, not an independent accuracy benchmark. */
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {createSearch,selectAnswer,questionCore,guard,queryKind,compatible,selectSemanticAnswer}=await import('../site/assistant/search.js');
 const {records}=JSON.parse(fs.readFileSync('site/assistant/knowledge.json'));
 const search=createSearch(records),groups={},rows=[];
 for(const card of records){
  const core=questionCore(card.title);
  const question=card.intent==='developer'?'请问 '+card.title+' 源码':card.intent==='science'?'请解释一下'+core:'我想知道怎么'+core+'呢';
  const hits=search(question),blocked=guard(question),result=selectAnswer(question,hits,records);
  assert(!blocked||blocked==='action',card.id+': incorrect guard '+blocked);
  assert(hits.some(hit=>hit.card.id===card.id),card.id+': missing source in top five');
  assert(result.card,card.id+': '+result.reason);
  assert(result.card.answer.trim(),card.id);
  const group=card.id.split(':')[0];groups[group]=(groups[group]||0)+1;
  rows.push({source:card.id,question,selected:result.card.id,reason:result.reason,reviewStatus:result.card.status});
 }
 for(const q of ['太阳是什么','太阳的颜色','太阳高度怎么算','How do I calculate solar altitude?','如何使用太阳高度公式'])assert.equal(queryKind(q),'science',q);
 for(const q of ['如何打开太阳系','How do I open the Solar System?','为什么打开行星伴月后没有显示','什么是保存组合','在哪里设置日期','如何设置太阳计算方式','Solar System usage'])assert.equal(queryKind(q),'howto',q);
 const scienceCard=records.find(card=>card.id==='science:BASIC-005');
 assert(!compatible('How do I open the Solar System?',scienceCard));
 assert(!selectSemanticAnswer('How do I open the Solar System?',[{id:scienceCard.id,score:.95}], [{card:scienceCard,coverage:1}],records));
 assert.equal(selectAnswer('How do I open the Solar System?',search('How do I open the Solar System?'),records).card?.id,'MANUAL:018');
 const basics=[
  ['太阳是什么','science:BASIC-001'],['我想了解太阳到底是什么','science:BASIC-001'],['请简单解释什么是恒星','science:BASIC-008'],['介绍一下行星的定义','science:BASIC-007'],['What kind of object is the Sun?','science:BASIC-001'],['请问太阳是啥','science:BASIC-001'],
  ['太阳的颜色','science:BASIC-002'],['太阳到底什么颜色','science:BASIC-002'],
  ['太阳为什么会发光','science:BASIC-003'],['太阳系的行星','science:BASIC-004'],
  ['太阳系有多少颗行星','science:BASIC-004'],['八大行星的顺序','science:BASIC-004'],
  ['太阳系是什么','science:BASIC-005'],['月亮是什么','science:BASIC-006'],
  ['什么是行星','science:BASIC-007'],['什么是恒星','science:BASIC-008'],
  ['What is the Sun?','science:BASIC-001'],['What color is the Sun?','science:BASIC-002'],
  ['Why does the Sun shine?','science:BASIC-003'],['Solar System planets','science:BASIC-004'],
  ['What is the Solar System?','science:BASIC-005'],['What is the Moon?','science:BASIC-006'],
  ['What is a planet?','science:BASIC-007'],['What is a star?','science:BASIC-008']
 ];
 for(const [q,id] of basics){
  const answer=selectAnswer(q,search(q),records).card;assert.equal(answer?.id,id,q);
  assert.equal(answer.intent,'science');assert(answer.references?.length,q);
 }
 assert.equal(guard('你好'),'greeting');
 assert.notEqual(selectAnswer('太阳系行星从里往外怎么排列',search('太阳系行星从里往外怎么排列'),records).card?.intent,'howto');
 for(const q of ['如何打开太阳系','怎么使用三维天空'])assert.notEqual(selectAnswer(q,search(q),records).card?.intent,'science',q);
 const fixtures=[
  ['如何更改杆的高度','site:SUN-010'],['怎么调节界面字号','site:PREF-010'],
  ['如何选择观察城市','site:STATE-001'],['如何改变观测日期','site:STATE-002'],
  ['怎么导出设置','site:PREF-022'],['怎样导入设置','site:PREF-023'],
  ['删除收藏怎么操作','site:SAVE-005'],['如何查看月球轨迹','site:MOON-001'],
  ['怎么打开地升地落','MANUAL:010'],['怎么查看行星卫星群','MANUAL:018'],
  ['能解释一下经度吗','science:GEO-002'],['太阳高度如何计算','science:SUN-001'],
  ['正午太阳高度怎么算','science:SUN-002'],['帮我添加城市','site:EDIT-002']
 ];
 for(const [question,id] of fixtures)assert.equal(selectAnswer(question,search(question),records).card?.id,id,question);
 for(const question of ['关闭太阳轨迹','关闭地面影子','关闭行星伴月']){
  const result=selectAnswer(question,search(question),records);
  assert.equal(result.intent,'disable',question);
  assert(result.card.steps.some(step=>step.includes('关闭')),question);
 }
 assert.equal(selectAnswer('关闭影长读数',search('关闭影长读数'),records).reason==='documented_toggle_off',false);
 assert.equal(guard('天气影响伴月可见性吗'),null);
 assert.equal(guard('目前这个网站有多少功能'),null);
 for(const q of ['现在上海太阳高度多少','明天北京几点日落','天气预报','写一篇小说'])assert(guard(q),q);
 assert(!selectAnswer('如何控制火山爆发',search('如何控制火山爆发'),records).card);
 fs.writeFileSync('/tmp/assistant143-corpus-results.json',JSON.stringify({kind:'Source-derived coverage probes; not an independent accuracy evaluation',groups,total:rows.length,rows,extraFixtures:fixtures.length,oppositeActions:3},null,2));
 console.log(`PASS all ${records.length} source-derived rephrasings across website/science/teaching/manual/developer categories; 14 cross-feature questions, opposite actions, unknown topics and dynamic-value boundaries`);
})().catch(e=>{console.error(e);process.exitCode=1;});
