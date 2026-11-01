/** Regression fixtures from short, paraphrased and scoped user questions. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {execFileSync}=require('node:child_process');
(async()=>{
 execFileSync('python3',['scripts/build-assistant-knowledge.py','--check'],{stdio:'inherit'});
 const {createSearch,selectAnswer,guard}=await import('../site/assistant/search.js');
 const {records}=JSON.parse(fs.readFileSync('site/assistant/knowledge.json'));
 assert.equal(records.filter(r=>!r.id.startsWith('science:BASIC-')).length,625);assert.equal(new Set(records.map(r=>r.id)).size,records.length);
 assert.equal(records.filter(r=>r.id.startsWith('science:BASIC-')).length,8);
 assert.equal(records.filter(r=>/^GUIDE:/.test(r.id)).length,18);
 assert.equal(records.filter(r=>/^MANUAL:/.test(r.id)).length,20);
 assert.equal(records.filter(r=>/^DEV:/.test(r.id)).length,88);
 assert(records.find(r=>r.id==='site:YEAR-018').title.includes('日晷'));
 const search=createSearch(records);
 const fixtures=[
  ['太阳轨迹','site:SUN-007'],['看看太阳路径','site:SUN-007'],['怎么显示太阳运行轨迹','site:SUN-007'],
  ['如何观察杆影长度','site:VIEW-003'],['影长怎么看','site:VIEW-003'],['查看日影','site:VIEW-003'],
  ['如何观察日出方位','site:SUN-025'],['日出方向','site:SUN-025'],['日落方位怎么看','site:SUN-025'],
  ['如何观察今天的太阳轨迹','site:SUN-007'],['如何查看今天的日出方向','site:SUN-025'],
  ['如何观察太阳视运动','site:LAB-001'],['打开行星伴月','site:MOON-011'],['开启行星半月','site:MOON-011'],
  ['如何观察月球和火星的相对位置','site:MOON-012'],
  ['全球地图','MANUAL:006'],['地轴与地平面','MANUAL:006'],['怎么打开全天高度曲线','MANUAL:007'],
  ['看看月相','MANUAL:009'],['月出方位','MANUAL:008'],['我想看日晷','MANUAL:012'],
  ['添加标注','MANUAL:013'],['搭建实验','MANUAL:015'],['排列图窗','MANUAL:016'],
  ['布局收藏','MANUAL:017'],['行星卫星群','MANUAL:018'],['键盘快捷键','MANUAL:019'],
  ['实验记录表','GUIDE:016'],['怎么评价学生','GUIDE:017'],
  ['什么是日行迹','science:ANA-001'],['为什么有四季','science:EARTH-004'],
  ['两个城市保存在完整实验','site:SAVE-002'],
  ['sun path','site:SUN-007'],['observe shadow length','site:VIEW-003'],['sunrise bearing','site:SUN-025']
 ];
 const results=fixtures.map(([query,id])=>{
  assert.equal(guard(query),null,query);const answer=selectAnswer(query,search(query),records);
  assert.equal(answer.card?.id,id,query+': '+answer.reason);assert.notEqual(answer.card.status,'draft');
  return {query,id,decision:'answer',reason:answer.reason};
 });
 for(const query of ['现在上海太阳高度多少','明天北京几点日落','天气预报','帮我添加城市'])assert(guard(query),query);
 const technical=search('material-controls.js');assert.equal(technical[0].card.title,'material-controls.js');
 assert(technical[0].card.sourceSha256);
 fs.writeFileSync('/tmp/assistant142-coverage.json',JSON.stringify({fixtures:results,guardChecks:4,knowledgeCount:records.length},null,2));
 console.log('PASS 35 short/scoped/bilingual queries, four refusal boundaries, 633 unique units including eight science basics, document freshness and developer lookup');
})().catch(e=>{console.error(e);process.exitCode=1;});
