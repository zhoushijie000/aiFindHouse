// Independent interpretation flows use the same rendering and document contract.
module.exports = ({n,e,fixedIntentGuidance}) => {
 function create({key,prefix,title,file,kind,intent,source}) {
  const isPolicy=kind==='policy', p=prefix, entity=isPolicy?'政策':'楼盘';
  const id=s=>p+s;
  const node=(s,t,d,type,col,y,extra={})=>n(id(s),t,d,type,col,y,extra);
  const edge=(a,b,o={})=>e(id(a),id(b),o);
  const links=[{label:'AI 找房 →',file:'AI找房流程.html'},{label:'查政策 →',file:'AI政策流程.html'},{label:(isPolicy?'楼盘解读':'政策解读')+' →',file:isPolicy?'楼盘解读流程.html':'政策解读流程.html'}];
  return {
   key,title,file,defaultNode:id('04'),height:3200,source,
   subtitle:isPolicy?'读懂具体政策，保留原文依据':'围绕具体楼盘，解释真实项目数据',
   description:isPolicy?'先确认政策与正文，再说明结论、注意事项和原文入口。':'先确认楼盘，再查询价格、户型、配套等真实数据，按用户关注点解读。',
   phases:[{title:'确认解读对象',sub:'意图 · 名称 · 上下文指代',y:0},{title:'查询可信资料',sub:'对象确认 · 实时数据 · 来源',y:995},{title:'生成有依据的解读',sub:'内容边界 · 事实校验 · 追问',y:1615},{title:'展示与继续',sub:'推荐校验 · 业务入口 · 恢复',y:2470}],
   nodes:[
    node('00','用户提出解读请求',isPolicy?'例如：这项人才购房政策怎么理解？':'例如：这个楼盘怎么样？有哪些户型？','user',1,55),
    node('01','识别业务意图',intent+'；其他业务分流，未命中固定引导','ai',1,205),
    node('G','未识别意图：系统固定引导',fixedIntentGuidance,'system',0,145,{h:220,fixedReply:true}),
    node('R','转入对应业务流程','根据已识别意图，进入其他查询或解读流程','system',2,205,{h:190,links}),
    node('02','识别对象与解读关注点',`提取${entity}名称、已选对象、上下文指代及本轮问题`,'ai',1,415),
    node('RES',`查询${entity}字典并核对标识`,'优先校验已选 ID；名称与别名用业务数据匹配','system',1,625,{rules:[`AI 仅提供名称和已知引用，由系统检索实际${entity}记录。`,'明确改问新对象时覆盖原对象，不把“这个”“它”绑定到过期会话对象。','候选有重名时保留全部有效候选供确认，不按热度代替用户选择。']}),
    node('MATCHERR','对象匹配接口异常','保留名称与上下文，重试对象匹配；不跳过唯一对象确认','error',2,625),
    node('D1','能否确认唯一解读对象？','无指代或多候选需补问；零匹配单独处理','decision',1,830),
    node('03','生成对象确认问题',`只追问缺失或歧义信息，候选${entity}由系统提供`,'ai',0,830),
    node('U1','用户选择或补充名称','结合当前问题重新匹配对象','user',0,1040),
    node('NF',`未查询到对应${entity}`,'固定提示未找到，保留输入；修改名称或进入查找流程','system',2,780,{h:205,jump:id('02'),jumpLabel:'补充名称后重新匹配',rules:[`提示“暂未找到对应${entity}，请核对名称后重试，或先查找相关${entity}。”`,'只有成功查询并返回零条数据才进入此分支；请求失败走接口异常。','不把相似名称自动当作用户指定对象。']}),
    node('Q',`获取${entity}真实详情`,isPolicy?'查询政策全文、标签、有效期、发布机构及原文入口':'查询项目基础信息、在售、价格、户型及可用配套数据','system',1,1040),
    node('E1',`${entity}查询接口异常`,isPolicy?'政策数据暂时没有查询成功，请稍后重试。':'楼盘数据暂时没有查询成功，请稍后重试。','error',2,1040,{rules:['保留已确认对象和本轮问题，允许重试失败接口。','接口失败不进入零结果或正文不足分支，不把旧缓存当作当前事实。']}),
    node('SOURCE',isPolicy?'校验原文来源与政策时效':'校验字段来源、口径与时间',isPolicy?'系统区分已生效 / 即将生效 / 已失效，不以发布时间替代':'价格、剩余房源及在售以本轮数据为准；缺字段明确标注','system',1,1250,{rules:isPolicy?['核对政策 ID、正文、来源、发布时间及有效期。','生效状态由系统根据当前日期计算；缺少日期或存在冲突时标为待核验。','已失效或尚未生效的政策可作历史或未来规则说明，但必须显式标注状态。']:['保留项目真实 ID、字段值、单位、价格口径、采集时间和来源引用。','动态字段以当前业务接口结果为准；字段缺失或冲突不可补造。','地铁距离、通勤、教育或配套信息只有存在可信数据与对应能力时才可说明。']}),
    node('D2',isPolicy?'是否取得完整政策正文？':'数据是否支持本轮解读？',isPolicy?'全文可追溯且可读；标题和摘要不能替代正文':'与所问内容相关的字段必须存在且可核验','decision',1,1455),
    node('04',isPolicy?'基于完整正文解读政策':'基于项目数据解读楼盘',isPolicy?'结论 + 注意事项 + 原文入口，不作个人资格承诺':'概况 + 关注点说明 + 待核实项 + 详情入口','ai',1,1675),
    node('LIMIT',isPolicy?'正文不足：系统受限说明':'资料不足：系统受限说明',isPolicy?'当前可以查询到该政策，但具体补贴标准和申请条件需要进入政策详情查看。':'当前楼盘资料暂不足以回答该问题，请查看楼盘详情或联系置业顾问核实。','system',2,1675,{h:185,rules:['该说明由系统固定返回，不调用 AI 补全缺失信息。',isPolicy?'保留已验证的政策名称、有效期、状态和真实详情入口；不从标题推定补贴金额或条件。':'保留已验证的项目基础信息和真实详情入口；缺少的价格、房源、配套等数据不得推测。','只在真实路径存在时提供可点击入口。']}),
    node('CHECK','校验解读事实与引用','每个陈述对应本轮资料，ID、日期、数字和入口均需核验','system',1,1900,{rules:['检查输出结构、引用对象、来源字段或正文段落是否存在且支持对应陈述。','数字、日期、单位、政策适用对象不得偏离来源；不支持的断言不展示。','语义核验由业务校验服务完成；不能仅凭模型自报来源即判定通过。']}),
    node('REJECT','事实校验未通过','拦截无依据内容，转为受限说明并保留真实详情入口','error',2,1900),
    node('05','生成有数据支撑的追问','仅提出后续可回答的问题；候选交系统验证','ai',1,2120),
    node('V','验证候选问题与操作入口','核验对象、数据和权限；最多保留 3 个有效候选','system',1,2330,{rules:['候选必须能通过当前业务能力查询到数据或取得正文依据。','解读类问题须有对应字段或完整正文支持；详情操作须有真实可用入口。','候选为空、校验失败或没有通过验证时隐藏推荐区，保留本轮解读。']}),
    node('S','展示解读与业务卡片',isPolicy?'显示政策状态、简短解读、注意事项和原文 / 详情入口':'显示项目卡片、简短解读、待核实项和详情 / 联系入口','system',1,2530,{rules:['普通回复建议 50–150 字，长内容由详情页承载。','正文不足或事实核验失败时只展示受限说明和已核实信息。','最多 3 个通过验证的推荐问题，不凑数；界面卡片和路径由系统组装。']}),
    node('NONE','候选均未通过','隐藏推荐区，保留当前内容和用户输入框','system',2,2530),
    node('A','任一 AI 节点异常','核心生成失败进入重试；可选追问失败保留已成功内容','system',0,1675),
    node('E2','AI 失败提示与重试','安安暂时开小差了，请稍后再试。','error',0,1870),
    node('RETRY','重试失败节点','保留对象、问题及资料，不创建重复会话','system',0,2070),
    node('SKIP','可选追问失败：保留解读','隐藏推荐问题，继续显示已成功的内容','system',0,2530),
    node('C','用户继续追问或查看详情',`“${isPolicy?'有哪些注意事项':'户型呢'}？”沿用对象；新名称则重新匹配`,'user',1,2750),
    node('B',isPolicy?'进入政策原文或详情':'进入楼盘详情或联系顾问','使用业务系统提供的真实路径','system',2,2750),
    node('M','保存并恢复当前会话','对象、问题、回答、卡片、追问及滚动位置；1 天内恢复','system',2,2960),
    node('NEXT','下一轮：重新识别意图','携带对象与上下文，仅覆盖用户明确修改的信息','system',1,2960,{h:164,jump:id('01')})
   ],
   edges:[edge('00','01'),edge('01','02',{label:'本流程意图',lx:410,ly:390}),edge('01','G',{a:'left',b:'right',label:'未识别',lx:269,ly:250}),edge('01','R',{a:'right',b:'left',label:'其他已识别意图',lx:638,ly:185}),
    edge('02','RES'),edge('RES','D1'),edge('RES','MATCHERR',{a:'right',b:'left',label:'异常',lx:550,ly:673}),edge('MATCHERR','RES',{a:'bottom',b:'right',via:[[691,773],[552,773],[552,730]],dashed:true,label:'重试匹配',lx:553,ly:750}),edge('D1','03',{a:'left',b:'right',label:'缺信息 / 重名',lx:270,ly:815}),edge('03','U1'),
    edge('U1','02',{a:'left',b:'left',via:[[5,1094],[5,392],[272,392],[272,497]],dashed:true,label:'补充后重新匹配',lx:130,ly:392}),
    edge('D1','NF',{a:'right',b:'left',label:'零匹配',lx:550,ly:860}),edge('D1','Q',{label:'唯一对象',lx:410,ly:997}),
    edge('Q','E1',{a:'right',b:'left',label:'异常',lx:550,ly:1086}),edge('E1','Q',{a:'bottom',b:'right',via:[[691,1210],[552,1210],[552,1150]],dashed:true,label:'重试',lx:659,ly:1210}),
    edge('Q','SOURCE'),edge('SOURCE','D2'),edge('D2','04',{label:'支持',lx:410,ly:1625}),edge('D2','LIMIT',{a:'right',b:'top',via:[[691,1510]],label:'不足',lx:691,ly:1625}),
    edge('04','CHECK'),edge('CHECK','05',{label:'通过',lx:410,ly:2075}),edge('CHECK','REJECT',{a:'right',b:'left',label:'不通过',lx:550,ly:1945}),edge('REJECT','LIMIT',{a:'top',b:'bottom'}),
    edge('LIMIT','05',{a:'right',b:'right',via:[[816,1768],[816,2202]],label:'受限说明后继续',lx:691,ly:2080}),
    edge('05','V'),edge('V','S',{label:'有效候选',lx:410,ly:2501}),edge('V','NONE',{a:'right',b:'top',via:[[691,2398]],label:'全部未通过',lx:691,ly:2500}),edge('NONE','S',{a:'bottom',b:'right',via:[[691,2700],[548,2700],[548,2630]]}),
    edge('A','E2',{label:'核心节点失败',lx:129,ly:1848}),edge('E2','RETRY'),edge('A','SKIP',{a:'left',b:'left',via:[[5,1743],[5,2598]],dashed:true,label:'追问生成失败',lx:129,ly:2485}),edge('SKIP','S',{a:'right',b:'left'}),
    edge('S','C'),edge('C','NEXT',{label:'继续提问',lx:410,ly:2916}),edge('C','B',{a:'right',b:'left',label:'查看详情',lx:550,ly:2730}),edge('B','M'),edge('M','C',{a:'right',b:'right',via:[[816,3028],[816,2910],[548,2910],[548,2830]],dashed:true,label:'1 天内返回',lx:715,ly:2910})]
  };
 }
 return {
  project:create({key:'project',prefix:'J',title:'楼盘解读',file:'楼盘解读流程.html',kind:'project',intent:'PROJECT_QUERY',source:'2.4.2、2.4.4 — 2.4.7；楼盘意图定义及本次新增要求'}),
  interpret:create({key:'interpret',prefix:'I',title:'政策解读',file:'政策解读流程.html',kind:'policy',intent:'POLICY_INTERPRET',source:'2.4.3 — 2.4.7；本次独立流程要求'})
 };
};
