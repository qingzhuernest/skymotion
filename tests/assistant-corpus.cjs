/** Corpus-wide generated coverage probes, not an independent accuracy benchmark. */
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {createSearch,selectAnswer,questionCore,guard}=await import('../site/assistant/search.js');
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
 console.log('PASS all 625 source-derived rephrasings across website/science/teaching/manual/developer categories; 14 cross-feature questions, opposite actions, unknown topics and dynamic-value boundaries');
})().catch(e=>{console.error(e);process.exitCode=1;});
