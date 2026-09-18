const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId = Object.fromEntries(FLOW.nodes.map(n=>[n.id,n]));
const specs = Object.fromEntries(DOCS.map(n=>[n.id,n]));
const labels = {ai:'✦ AI 输出',system:'系统处理',user:'用户操作',decision:'◇ 条件判断',error:'异常处理'};
let zoom = 1;
let selected = FLOW.defaultNode;
function point(n,side){return side==='left'?[n.x,n.y+n.h/2]:side==='right'?[n.x+n.w,n.y+n.h/2]:side==='top'?[n.x+n.w/2,n.y]:[n.x+n.w/2,n.y+n.h];}
function edgeMarkup(edge){
 const a=point(byId[edge.from],edge.a||'bottom'),b=point(byId[edge.to],edge.b||'top');
 const points=[a,...(edge.via||[]),b].map(p=>p.join(',')).join(' ');
 let label='';
 if(edge.label){const w=edge.label.length*10+14;label=`<g><rect x="${edge.lx-w/2}" y="${edge.ly-8}" width="${w}" height="17" rx="4" fill="#f7f8fb"/><text class="edge-label" x="${edge.lx}" y="${edge.ly+4}" text-anchor="middle">${esc(edge.label)}</text></g>`;}
 return `<polyline class="edge ${edge.dashed?'dashed':''}" points="${points}"/>${label}`;
}
function renderGraph(){
 $('#diagram').style.height=FLOW.height+'px';
 $('#diagram').innerHTML=`<svg class="edges" width="830" height="${FLOW.height}" aria-hidden="true"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#b8c2d2"/></marker></defs>${FLOW.edges.map(edgeMarkup).join('')}</svg>`+
 FLOW.phases.map((p,i)=>`<div class="phase-band" style="top:${p.y}px"><b>0${i+1}</b>${esc(p.title)}</div>`).join('')+
 FLOW.nodes.map(n=>`<article class="node ${n.type}" id="node-${n.id}" style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px" aria-label="${n.id} ${esc(n.title)}"><button class="node-main" data-select="${n.id}" aria-pressed="false"><div class="node-head"><span class="node-type">${labels[n.type]}</span><span class="node-id">${n.id}</span></div><h3>${esc(n.title)}</h3><p>${esc(n.description)}</p></button>${n.type==='ai'?`<div class="node-footer"><a href="${encodeURI(specs[n.id].file)}" target="_blank" rel="noopener" aria-label="${esc(n.title)}：打开 Markdown 文档">输出说明 .md ↗</a><span>可下载</span></div>`:''}${n.link?`<a class="node-go" href="${encodeURI(n.link)}">查看对应流程 →</a>`:''}${n.jump?`<button class="node-go node-go-button" data-jump="${n.jump}">↻ 回到 ${n.jump} 意图识别</button>`:''}</article>`).join('');
 document.querySelectorAll('[data-select]').forEach(el=>el.addEventListener('click',()=>selectNode(el.dataset.select,true)));
 FLOW.nodes.forEach(n=>{
  if(n.links){const links=document.createElement('div');links.className='node-links';links.innerHTML=n.links.map(link=>`<a href="${encodeURI(link.file)}">${esc(link.label)}</a>`).join('');$('#node-'+n.id).appendChild(links);}
  if(n.jumpLabel)$('#node-'+n.id+' [data-jump]').textContent='↻ '+n.jumpLabel;
 });
 document.querySelectorAll('[data-jump]').forEach(el=>el.addEventListener('click',()=>{selectNode(el.dataset.jump);$('#viewport').scrollTo({top:(byId[el.dataset.jump].y-35)*zoom,behavior:'smooth'});}));
 $('#phases').innerHTML=FLOW.phases.map((p,i)=>`<button class="phase-nav" data-phase="${i}"><span class="phase-index">0${i+1}</span><span><strong>${esc(p.title)}</strong><small>${esc(p.sub)}</small></span></button>`).join('');
 document.querySelectorAll('[data-phase]').forEach(el=>el.addEventListener('click',()=>$('#viewport').scrollTo({top:FLOW.phases[+el.dataset.phase].y*zoom,behavior:'smooth'})));
}
function selectNode(id,open=false){
 const n=byId[id];if(!n)return;selected=id;
 document.querySelectorAll('.node').forEach(el=>{const active=el.id==='node-'+id;el.classList.toggle('selected',active);el.querySelector('button').setAttribute('aria-pressed',String(active));});
 const d=specs[id];
 const section=(name,values)=>`<section class="detail-section"><h3>${name}</h3><ul>${values.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`;
 const next=n.fixedReply?['等待用户继续提问，再重新识别业务意图。']:FLOW.edges.filter(e=>e.from===id).map(e=>`${e.label?e.label+' → ':''}${byId[e.to].title}`);
 $('#detail').innerHTML=`<div class="detail-kicker">${esc(id)} / ${labels[n.type]}</div><h2>${esc(n.title)}</h2><p class="detail-summary">${esc(d?d.summary:n.description)}</p>`+(d?`<button class="doc-primary" data-read="${id}"><span>阅读 AI 输出说明<small>输入 · 输出示例 · 约束 · 验收</small></span><span>↗</span></button><div class="doc-links"><a href="${encodeURI(d.file)}" target="_blank" rel="noopener">打开 .md 原文件 ↗</a><a href="${encodeURI(d.file)}" download>下载 Markdown ↓</a></div>${section('节点输入',d.inputs)}${section('AI 需要输出',d.outputs)}${section('关键约束',d.rules)}`:`${section('处理规则',systemRules(n))}${section('后续流向',next.length?next:['使用当前上下文返回对应节点继续'])}`)+`<div class="detail-boundary">依据需求文档 §${FLOW.source}<br>${d?'字段名与 JSON 结构为建议输出契约，供研发评审。':'业务规则由系统执行；此页面用于流程评审。'}</div>`;
 if(d)$('#detail [data-read]').addEventListener('click',()=>openDoc(id));
 if(open&&innerWidth<=800)$('#inspector').classList.add('open');
}
function systemRules(n){
 if(n.fixedReply)return ['结合有效上下文后仍未识别到业务意图时，统一进入本分支。','系统原样返回上方固定引导，不调用 AI 生成、改写或补充文案。','本轮不进入楼盘或政策查询，保留会话并等待用户继续提问。'];
 if(n.rules)return n.rules;
 const rules={
 H00:['发送后显示“安安正在帮你找……”；成功后替换为结果。','开场语由管理端配置；引导问题默认随机展示 3 个。'],
 P00:['发送后显示 AI 回复中状态；成功后替换为结果。','开场语和推荐引导问题由管理端配置。'],
 HD2:['按已支持字段判断能否形成可执行查询，不将所有筛选项设为必填。','具体楼盘可直接查询；“帮我找房”需要补问。预算模糊范围由配置或追问确定。'],
 HS1:['确认字段能力并查询实际价格分布，再交给 AI 转换。','缺少地图、点位或标签依据时，保留未解析项并追问，不虚构通勤时间。'],
 HQ:['接口负责条件校验、过滤与排序，硬性条件优先。','自然结果不按运营推广顺序重排；如有商业推广需单独标识。','页面和顾问路径来自真实项目 ID 与已配置路由。'],
 HS:['最多展示 5 个项目；优先硬性条件、预算、区域、产品、面积户型、在售及可售情况。','零结果时不展示楼盘卡片，仅展示说明及通过验证的问题。','推荐问题校验全部失败时隐藏问题区，允许手动继续输入。'],
 HV:['对候选条件实际查库，去重、过滤无结果候选，最多保留 3 个。','优先保留区域调预算，其次保留预算换区域，再扩大区域，最后放宽全部限制。','放宽候选不改写原条件，用户点击后才发起下一轮。'],
 PT:['系统根据当前日期与政策起止时间判断已生效 / 即将生效 / 已失效。','发布时间不等于生效时间；时间缺失或口径不明时标为待核验。','“当前”展示有效政策；“最新”按配置时间字段倒序，同时展示状态。'],
 PN:['固定受限说明：“当前可以查询到该政策，但具体补贴标准和申请条件需要进入政策详情查看。”','展示真实详情入口，不生成无法从正文核实的政策内容。'],
 PS:['单次最多 5 条政策，卡片展示名称、标签、有效期、状态和真实详情入口。','零结果不展示政策卡片；推荐问题必须通过政策库校验。','概括普通回复建议 50–150 字；复杂政策信息由详情页承载。'],
 PV:['候选问题必须用政策库实际数据验证；最多显示 3 个。','解读类候选需要正文支持；无正文不诱导生成申请条件。','验证失败或无结果的候选不展示，保留手动提问入口。'],
 HM:['用户问题、AI 回答、业务卡片、推荐追问、当前条件、滚动位置一并保存。','进入详情或其他业务页后，1 天内返回恢复原会话。'],
 PM:['用户问题、AI 回答、业务卡片、推荐追问、当前条件、滚动位置一并保存。','进入详情或其他业务页后，1 天内返回恢复原会话。'],
 HE1:['展示“楼盘数据暂时没有查询成功，请稍后重试。”','保留当前条件，重试当前接口；查询错误不按无匹配数据处理。'],
 PE1:['展示“政策数据暂时没有查询成功，请稍后重试。”','保留当前条件，重试当前接口；查询错误不按无匹配数据处理。']
 };
 return rules[n.id]||[n.description,...(n.type==='error'?['保留本次输入、条件和历史结果；重试失败节点。']:[])];
}
function setZoom(value){zoom=Math.min(1.25,Math.max(.45,value));$('#diagram').style.transform=`scale(${zoom})`;$('#stage-wrap').style.width=830*zoom+'px';$('#stage-wrap').style.height=FLOW.height*zoom+'px';$('#zoom-value').value=Math.round(zoom*100)+'%';}
function fitWidth(){setZoom(innerWidth<=800?.9:Math.min(1,($('#viewport').clientWidth-26)/830));if(innerWidth<=800)$('#viewport').scrollLeft=Math.max(0,(830*zoom-$('#viewport').clientWidth)/2);}
function inlineMd(s){return esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');}
function markdown(s){
 const lines=s.replace(/\r/g,'').split('\n');let out='',inCode=false,code=[],list=false;
 const endList=()=>{if(list){out+='</ul>';list=false;}};
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  if(line.startsWith('```')){endList();if(inCode){out+='<pre><code>'+esc(code.join('\n'))+'</code></pre>';code=[];inCode=false;}else inCode=true;continue;}
  if(inCode){code.push(line);continue;}
  if(!line.trim()){endList();continue;}
  const heading=line.match(/^(#{1,4})\s+(.+)$/);if(heading){endList();const level=heading[1].length;out+=`<h${level}>${inlineMd(heading[2])}</h${level}>`;continue;}
  if(line.trim().startsWith('|')&&i+1<lines.length&&/^\s*\|?[\s:|-]+\|\s*$/.test(lines[i+1])){endList();const cells=t=>t.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());out+='<table><thead><tr>'+cells(line).map(v=>'<th>'+inlineMd(v)+'</th>').join('')+'</tr></thead><tbody>';i+=2;while(i<lines.length&&lines[i].trim().startsWith('|')){out+='<tr>'+cells(lines[i]).map(v=>'<td>'+inlineMd(v)+'</td>').join('')+'</tr>';i++;}i--;out+='</tbody></table>';continue;}
  if(/^\s*[-*]\s/.test(line)||/^\d+[.)、]\s*/.test(line)){if(!list){out+='<ul>';list=true;}out+='<li>'+inlineMd(line.replace(/^\s*(?:[-*]|\d+[.)、])\s*/,''))+'</li>';continue;}
  endList();if(line.startsWith('>')){out+='<blockquote>'+inlineMd(line.replace(/^>\s*/,''))+'</blockquote>';continue;}
  if(/^---+$/.test(line.trim())){out+='<hr>';continue;}out+='<p>'+inlineMd(line)+'</p>';
 }
 endList();if(inCode)out+='<pre><code>'+esc(code.join('\n'))+'</code></pre>';return out;
}
function openDoc(id){const d=specs[id];if(!d)return;$('#modal-title').textContent=d.id+' · '+d.title;$('#modal-body').className='markdown';$('#modal-body').innerHTML=markdown(d.content);$('#modal-raw').href=d.file;$('#modal-raw').hidden=false;$('#modal-download').href=d.file;$('#modal-download').hidden=false;if(!$('#document-modal').open)$('#document-modal').showModal();$('#document-modal').scrollTop=0;}
function openIndex(){
 $('#modal-title').textContent=FLOW.title+' · AI 节点文档';$('#modal-body').className='doc-list';$('#modal-raw').hidden=true;$('#modal-download').href='docs/README.md';$('#modal-download').hidden=false;
 $('#modal-body').innerHTML='<div class="notice">每份文档包含触发条件、输入、AI 输出 JSON 示例、约束和验收要点。输出契约为评审建议稿；示例不代表真实楼盘或政策。</div>'+DOCS.map(d=>`<div class="doc-item"><span>${d.id}</span><button data-read="${d.id}">${esc(d.title)}</button><a href="${encodeURI(d.file)}" target="_blank" rel="noopener">.md ↗</a><a href="${encodeURI(d.file)}" download>下载 ↓</a></div>`).join('')+'<div class="detail-boundary"><a href="docs/README.md" target="_blank">打开总说明与文档索引 ↗</a> · <a href="docs/需求原文.md" target="_blank">查看需求原文 ↗</a></div>';
 $('#modal-body').querySelectorAll('[data-read]').forEach(el=>el.addEventListener('click',()=>openDoc(el.dataset.read)));$('#document-modal').showModal();
}
renderGraph();selectNode(selected);fitWidth();
$('#zoom-in').addEventListener('click',()=>setZoom(zoom+.1));$('#zoom-out').addEventListener('click',()=>setZoom(zoom-.1));$('#zoom-fit').addEventListener('click',fitWidth);
$('#doc-index').addEventListener('click',openIndex);$('#modal-close').addEventListener('click',()=>$('#document-modal').close());
$('#document-modal').addEventListener('click',event=>{if(event.target===$('#document-modal')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
$('#show-detail').addEventListener('click',()=>$('#inspector').classList.add('open'));$('#close-detail').addEventListener('click',()=>$('#inspector').classList.remove('open'));
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(fitWidth,150);});
// A local review preference only; this is not the product's business conversation store.
try{const prior=JSON.parse(sessionStorage.getItem('flow-review-'+FLOW.key)||'null');if(prior&&byId[prior.id]){selectNode(prior.id);$('#viewport').scrollTop=prior.top||0;}window.addEventListener('pagehide',()=>sessionStorage.setItem('flow-review-'+FLOW.key,JSON.stringify({id:selected,top:$('#viewport').scrollTop})));}catch{}
