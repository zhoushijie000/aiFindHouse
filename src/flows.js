const n = (id, title, description, type, col, y, extra = {}) => ({id,title,description,type,x:[16,297,578][col],y,w:226,h:type==='ai'?164:type==='decision'?110:type==='user'?108:136,...extra});
const e = (from,to,opts={}) => ({from,to,...opts});
const fixedIntentGuidance = '安安是你的购房小助手，我可以帮你找成都新房，以及查询成都购房支持政策。你可以告诉我想买哪个区域、预算多少，或者想了解哪类购房支持政策。';
const house = {
 key:'house', title:'AI 找房', subtitle:'从一句需求，到可继续操作的找房结果', file:'AI找房流程.html', other:'AI政策流程.html', defaultNode:'H02',
 description:'理解需求、查询真实楼盘，再组织简短回答。每个紫色节点均附 AI 输出说明。',
 source:'2.4.1 — 2.4.2、2.4.4 — 2.4.7', height:3070,
 phases:[{title:'理解需求',sub:'意图 · 条件 · 语义转换',y:0},{title:'获取真实数据',sub:'信息补充 · 业务查询',y:1100},{title:'组织结果',sub:'结果说明 · 推荐问题校验',y:1720},{title:'继续对话',sub:'业务卡片 · 历史恢复',y:2570}],
 rules:['楼盘信息以实时业务数据为准','查询楼盘最多 5 个；随机推荐楼盘 10 个；仅零结果推荐问题最多 3 个','普通回复建议 50–150 字','1 天内返回，恢复原会话'],
 nodes:[
 n('H00','用户提出找房需求','例如：青羊区 300 万以内的新房', 'user',1,55),
 n('H01','识别业务意图','区分找房、楼盘解读、查政策、政策解读','ai',1,205),
 n('HR','转入对应业务流程','已识别为其他业务，进入对应流程','system',2,205,{h:190,links:[{label:'楼盘解读 →',file:'楼盘解读流程.html'},{label:'查政策 →',file:'AI政策流程.html'},{label:'政策解读 →',file:'政策解读流程.html'}]}),
 n('HG','未识别意图：系统固定引导',fixedIntentGuidance,'system',0,145,{h:220,fixedReply:true}),
 n('H02','提取条件，合并上下文','保留原条件，仅覆盖本轮明确修改的字段','ai',1,415),
 n('HD1','条件能否直接查询？','检查系统字段与非标准需求','decision',1,625),
 n('HS1','查询字段能力与价格分布','如“改善”先查区域价格分布；通勤依赖地图及点位','system',2,805),
 n('H03','转换非标准需求','依据查询数据转成可用条件，保留解释与不确定性','ai',2,965),
 n('HD2','是否满足最小查询范围？','区域、总价、单价，三个至少有一个','decision',1,1155),
 n('H04','生成条件补充追问','区域、总价、单价均缺失时追问，补充任一项即可','ai',0,1155),
 n('HU1','用户补充条件','如：青羊区 → 400 万以内','user',0,1370),
 n('HQ','查询房产超市楼盘库','校验条件后查询；价格、在售、房源以接口为准','system',1,1370),
 n('HE1','楼盘接口异常','提示查询失败；重试当前条件，不进入零结果分支','error',2,1370),
 n('HD3','是否查到匹配楼盘？','按查询楼盘判断；两分支均返回随机推荐楼盘 10 个','decision',1,1560,{h:136}),
 n('H05','生成结果说明','查询楼盘最多 5 个 + 随机推荐楼盘 10 个，分组说明','ai',1,1780,{link:'楼盘解读流程.html',h:190}),
 n('H06','生成零结果说明','说明当前条件无匹配；保留接口随机推荐楼盘 10 个','ai',2,1780),
 n('H07','生成下一步候选问题','仅零结果分支：基于原条件提出调整方向，交系统验证','ai',2,2000),
 n('HV','实际查询验证推荐问题','过滤无结果或校验失败的候选；最多保留 3 个','system',2,2220),
 n('HN','没有通过验证的问题','不展示推荐问题；保留手动修改条件入口','system',2,2400),
 n('HS','展示回复与业务卡片','有匹配：仅回复与卡片；零匹配：可附验证通过的问题','system',1,2400),
 n('HA','任一 AI 节点异常','超时、无效结构或越界输出','system',0,1780),
 n('HE2','AI 失败提示与重试','“安安暂时开小差了，请稍后再试。”保留输入及条件','error',0,1960),
 n('HE3','重试失败节点','使用原输入重新执行；不虚构数据作为降级回答','system',0,2150),
 n('HX','可选追问失败：保留结果','H07 失败时隐藏推荐问题，继续展示已有说明和卡片','system',0,2400),
 n('HC','用户继续操作','点击推荐问题 / 自由追问 / 打开楼盘详情','user',1,2630),
 n('HB','进入业务页面','楼盘详情；在线联系置业顾问（可后置）','system',2,2630),
 n('HM','保存并恢复会话','问题、回答、卡片、追问、条件、滚动位置；1 天内恢复','system',2,2830),
 n('HU2','下一轮：重新识别意图','携带原上下文进入 H01；仍找房则到 H02 合并条件','system',1,2830,{jump:'H01',h:164}),
 ],
 edges:[
 e('H00','H01'),e('H01','H02',{label:'找房',lx:410,ly:390}),e('H01','HR',{a:'right',b:'left',label:'其他已识别意图',lx:638,ly:185}),
 e('H01','HG',{a:'left',b:'right',label:'未识别',lx:269,ly:250}),
 e('H02','HD1'),e('HD1','HD2',{label:'可以直接查询',lx:410,ly:864}),
 e('HD1','HS1',{a:'right',b:'top',via:[[691,675]],label:'需转换',lx:663,ly:750}),e('HS1','H03'),
 e('H03','HD2',{via:[[691,1130],[410,1130]],label:'转换后校验',lx:592,ly:1130}),
 e('HD2','H04',{a:'left',b:'right',label:'不充分',lx:270,ly:1185}),e('H04','HU1'),
 e('HU1','H02',{a:'left',b:'left',via:[[5,1420],[5,392],[272,392],[272,492]],dashed:true,label:'补充后重新合并',lx:128,ly:392}),
 e('HD2','HQ',{label:'充分',lx:410,ly:1315}),e('HQ','HE1',{a:'right',b:'left',label:'异常',lx:548,ly:1408}),
 e('HE1','HQ',{a:'bottom',b:'right',via:[[691,1520],[552,1520],[552,1458]],dashed:true,label:'重试',lx:657,ly:1520}),
 e('HQ','HD3'),e('HD3','H05',{label:'有结果',lx:410,ly:1695}),
 e('HD3','H06',{a:'right',b:'top',via:[[691,1610]],label:'零结果',lx:691,ly:1695}),
 e('H05','HS',{label:'直接展示，不生成推荐问题',lx:410,ly:2140}),e('H06','H07'),e('H07','HV',{label:'候选问题，待验证',lx:691,ly:2192}),
 e('HV','HS',{a:'left',b:'right',via:[[550,2288],[550,2468]],label:'存在有效候选',lx:550,ly:2370}),e('HV','HN',{label:'全部未通过',lx:691,ly:2375}),
 e('HN','HS',{a:'bottom',b:'right',via:[[691,2550],[553,2550],[553,2495]]}),
 e('HA','HE2',{label:'核心生成失败',lx:129,ly:1940}),e('HE2','HE3'),
 e('HA','HX',{a:'left',b:'left',via:[[5,1848],[5,2468]],dashed:true,label:'H07 失败',lx:99,ly:2340}),e('HX','HS',{a:'right',b:'left'}),
 e('HS','HC'),e('HC','HU2',{label:'追问 / 推荐问题',lx:410,ly:2784}),
 e('HC','HB',{a:'right',b:'left',label:'详情 / 联系',lx:548,ly:2613}),e('HB','HM'),
 e('HM','HC',{a:'right',b:'right',via:[[815,2890],[815,2780],[548,2780],[548,2708]],dashed:true,label:'1 天内返回',lx:721,ly:2780})
 ]
};
const policy = {
 key:'policy', title:'AI 政策', subtitle:'查询真实政策，概括结果并继续咨询', file:'AI政策流程.html', other:'AI找房流程.html', defaultNode:'P02',
 description:'提取查询条件，查询真实政策并展示概括；零结果候选由系统验证后展示。',
 source:'2.4.1、2.4.3 — 2.4.7', height:3430,
 phases:[{title:'理解问题',sub:'意图 · 区域 · 类型 · 时间',y:0},{title:'查询与时效',sub:'业务数据 · 有效期 · 零结果',y:990},{title:'组织结果',sub:'有结果概括 · 零结果引导',y:1500},{title:'展示与继续',sub:'系统展示 · 卡片 · 历史',y:2730}],
 rules:['仅基于政策库及已获取原文作答','缺少正文，不补全标准或条件','区分已生效、即将生效、已失效','政策最多 5 条；推荐问题最多 3 个'],
 nodes:[
 n('P00','用户提出政策问题','例如：青羊区现在有哪些购房支持政策？','user',1,55),
 n('P01','识别业务意图','区分找房、楼盘解读、查政策、政策解读','ai',1,205),
 n('PR','转入对应业务流程','已识别为其他业务，进入对应流程','system',2,205,{h:190,links:[{label:'AI 找房 →',file:'AI找房流程.html'},{label:'楼盘解读 →',file:'楼盘解读流程.html'},{label:'政策解读 →',file:'政策解读流程.html'}]}),
 n('PG','未识别意图：系统固定引导',fixedIntentGuidance,'system',0,145,{h:220,fixedReply:true}),
 n('P02','提取政策查询条件','区域、政策类型、当前 / 最新及指定政策','ai',1,415),
 n('PD1','信息是否足够查询？','“成都最新政策”可直接查；仅追问必要信息','decision',1,625),
 n('P03','生成条件补充追问','聚焦缺失条件，不要求用户填满所有字段','ai',0,625),
 n('PU1','用户补充或修改','保留本轮政策上下文，覆盖明确修改条件','user',0,840),
 n('PQ','查询房产超市政策库','读取标题、标签、原文、有效期及详情路径','system',1,840),
 n('PE1','政策接口异常','提示查询失败并重试；失败不当作零结果','error',2,840),
 n('PT','校验政策时效与排序','按当前时间区分状态；最新按发布时间 / 生效时间倒序','system',1,1045),
 n('PD2','是否存在匹配政策？','“当前”仅选有效政策；“最新”须标明状态','decision',1,1250),
 n('P04','生成政策结果概括','简短总结已查得信息；仅有标题时不延伸正文内容','ai',1,1555),
 n('P06','生成零结果说明与候选问题','依照政策库真实覆盖范围，生成可验证的问题','ai',2,1555),
 n('PS','展示回复与政策卡片','政策 ≤ 5；名称、标签、有效期、状态、真实详情入口','system',1,2790),
 n('PA','任一 AI 节点异常','超时、无效结构或超出数据的政策断言','system',0,1555),
 n('PE2','AI 失败提示与重试','“安安暂时开小差了，请稍后再试。”保留查询条件','error',0,1740),
 n('PE3','重试失败节点','继续使用原始政策数据，不补造政策作为降级回答','system',0,1940),
 n('PC','用户继续操作','点击推荐问题 / 自由追问 / 查看政策详情','user',1,3010),
 n('PB','查看政策详情或原文','使用接口返回的政策 ID 和实际页面路径','system',2,3010),
 n('PM','保存并恢复会话','历史问题、回答、卡片、追问、条件和滚动位置','system',2,3220),
 n('PU2','下一轮：重新识别意图','携带原上下文进入 P01；仍查政策则到 P02 合并条件','system',1,3220,{jump:'P01',h:164}),
 ],
 edges:[
 e('P00','P01'),e('P01','P02',{label:'查政策',lx:410,ly:390}),e('P01','PR',{a:'right',b:'left',label:'其他已识别意图',lx:638,ly:185}),
 e('P01','PG',{a:'left',b:'right',label:'未识别',lx:269,ly:250}),
 e('P02','PD1'),e('PD1','P03',{a:'left',b:'right',label:'不充分',lx:271,ly:654}),e('P03','PU1'),
 e('PU1','P02',{a:'left',b:'left',via:[[5,890],[5,392],[272,392],[272,492]],dashed:true,label:'补充后重新合并',lx:128,ly:392}),
 e('PD1','PQ',{label:'充分',lx:410,ly:790}),e('PQ','PE1',{a:'right',b:'left',label:'异常',lx:548,ly:874}),
 e('PE1','PQ',{a:'bottom',b:'right',via:[[691,980],[551,980],[551,930]],dashed:true,label:'重试',lx:670,ly:980}),
 e('PQ','PT'),e('PT','PD2'),e('PD2','P04',{label:'有结果',lx:410,ly:1430}),
 e('PD2','P06',{a:'right',b:'top',via:[[691,1300]],label:'零结果',lx:691,ly:1430}),
 e('PA','PE2',{label:'核心生成失败',lx:129,ly:1718}),e('PE2','PE3'),
 e('P04','PS'),
 e('PS','PC'),e('PC','PU2',{label:'追问 / 推荐问题',lx:410,ly:3170}),
 e('PC','PB',{a:'right',b:'left',label:'查看详情',lx:548,ly:2990}),e('PB','PM'),
 e('PM','PC',{a:'right',b:'right',via:[[816,3280],[816,3160],[549,3160],[549,3080]],dashed:true,label:'1 天内返回',lx:720,ly:3160})
 ]
};
// 移除查询流程内的解读分支后，收紧后续节点与连线布局。
policy.nodes.forEach(item=>{if(item.y>=2370)item.y-=600;});
policy.edges.forEach(item=>{if(item.ly>=2370)item.ly-=600;if(item.via)item.via=item.via.map(([x,y])=>[x,y>=2370?y-600:y]);});
policy.phases.forEach(item=>{if(item.y>=2370)item.y-=600;});
policy.height-=600;
// 查询时一并完成时效与排序，减少主流程中的重复处理节点。
const policyQuery = policy.nodes.find(item=>item.id==='PQ');
policyQuery.title='查询政策并校验时效';
policyQuery.description='读取真实政策，按系统规则判断有效状态并排序';
policyQuery.rules=['按校验后的条件查询，返回真实政策及详情入口。','系统计算已生效、即将生效、已失效状态；日期缺失或冲突标为待核验。','当前仅查有效政策；最新按配置时间字段排序，并标明状态。','查询异常进入重试，不作为零结果。'];
policy.nodes=policy.nodes.filter(item=>item.id!=='PT');
policy.edges=policy.edges.filter(item=>item.from!=='PT'&&item.to!=='PT');
policy.edges.push(e('PQ','PD2'));
policy.nodes.forEach(item=>{if(item.y>=1045)item.y-=205;});
policy.edges.forEach(item=>{if(item.ly>=1045)item.ly-=205;if(item.via)item.via=item.via.map(([x,y])=>[x,y>=1045?y-205:y]);});
policy.phases.forEach(item=>{if(item.y>=990)item.y-=205;});
policy.height-=205;
policy.defaultNode='P02';
policy.description='提取条件 → 查询政策 → 概括结果 → 展示；仅零结果提供验证通过的推荐问题。';
// 有结果直接展示；零结果候选验证属于系统展示规则，不单列主流程节点。
policy.nodes.forEach(item=>{if(item.y>=1985)item.y-=420;});
policy.edges.forEach(item=>{if(item.ly>=1985)item.ly-=420;if(item.via)item.via=item.via.map(([x,y])=>[x,y>=1985?y-420:y]);});
policy.phases.forEach(item=>{if(item.y>=1925)item.y-=420;});
policy.height-=420;
policy.phases[3].y=1530;
const policyDisplay=policy.nodes.find(item=>item.id==='PS');
policyDisplay.description='有结果展示概括与卡片；零结果展示说明及验证通过的推荐问题';
policyDisplay.rules=['有结果：P04 后直接展示概括及最多 5 张真实政策卡片，不生成下一步问题。','零结果：先展示 P06 的说明；候选由系统在后台实际查询验证，通过后展示最多 3 个问题，无需再次调用 AI。','无候选、验证失败或无结果时隐藏推荐区，保留零结果说明和输入框。','后台验证不修改当前条件；用户选择推荐后才更新条件并重新查询。'];
policy.edges.push(e('P06','PS',{a:'bottom',b:'right',via:[[691,1633]],label:'系统验证后展示',lx:691,ly:1552}));
const {project,interpret}=require('./detail-flows')({n,e,fixedIntentGuidance});
module.exports={house,policy,project,interpret};
