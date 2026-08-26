/**
 * 云数据库种子数据：FAQ、作文范文
 * 内容依据公开考研英语真题题型与常见备考资料整理（原创编写，非转载版权范文）
 * 自动生成 — 编辑 data/source/*.json 后运行 scripts/build.ps1
 * 版本: 1.2.2 | 更新: 2026-08-09
 */
const FAQS = [
    {
        "_id":  "faq001",
        "category":  "备考基础",
        "order":  1,
        "tags":  [
                     "英语一",
                     "英语二"
                 ],
        "question":  "考研英语一和英语二有什么区别？",
        "answer":  "英语一难度整体高于英语二，主要体现在：阅读文章更长、词汇更学术；完形与翻译篇幅更大；大作文多为图画/图表，英语二多为图表或书信类应用文。英语专业学硕（如英语语言文学）通常考英语一；专硕如学科教学(英语)、翻译硕士等需查看目标院校招生目录。"
    },
    {
        "_id":  "faq002",
        "category":  "备考基础",
        "order":  2,
        "tags":  [
                     "词汇"
                 ],
        "question":  "考研英语需要掌握多少词汇量？",
        "answer":  "官方大纲约 5500 词，实际高分考生建议掌握 6000–8000 词并熟悉熟词僻义。建议用《考研词汇闪过》或 App 按「高频→中频→低频」分层记忆，配合真题阅读语境巩固，而非孤立背单词。"
    },
    {
        "_id":  "faq003",
        "category":  "备考基础",
        "order":  3,
        "tags":  [
                     "时间规划"
                 ],
        "question":  "从几月开始准备英语比较合适？",
        "answer":  "基础较好可 3–4 月启动；基础薄弱建议 1–2 月即开始词汇与长难句。典型节奏：3–6 月词汇+精读；7–9 月真题阅读+翻译；10–11 月完形+写作模板内化；12 月模考与查漏补缺。"
    },
    {
        "_id":  "faq004",
        "category":  "阅读理解",
        "order":  4,
        "tags":  [
                     "阅读",
                     "真题"
                 ],
        "question":  "阅读正确率一直不高，如何突破？",
        "answer":  "① 精读近 10 年真题，逐句分析长难句结构；② 总结错题类型（细节、推理、主旨、词义猜测）；③ 控制单篇 18–20 分钟；④ 积累同义替换与逻辑连接词。切忌只做新题不复盘。"
    },
    {
        "_id":  "faq005",
        "category":  "阅读理解",
        "order":  5,
        "tags":  [
                     "长难句"
                 ],
        "question":  "如何系统提高长难句分析能力？",
        "answer":  "推荐《考研英语长难句》或何凯文长难句课程。步骤：找主干（主谓宾）→ 识别从句类型 → 还原语序 → 口头翻译。每天精析 3–5 句真题句，坚持 2 个月效果显著。"
    },
    {
        "_id":  "faq006",
        "category":  "写作",
        "order":  6,
        "tags":  [
                     "作文",
                     "模板"
                 ],
        "question":  "大作文可以背模板吗？会不会被判定抄袭？",
        "answer":  "可以积累「框架句」和「高级表达」，但切忌全文照搬同一模板。阅卷更看重内容切题、逻辑连贯与语言多样性。建议：背 10–15 个万能句型 + 按话题积累论据（环保、教育、科技等），考场上灵活组合。"
    },
    {
        "_id":  "faq007",
        "category":  "写作",
        "order":  7,
        "tags":  [
                     "小作文"
                 ],
        "question":  "小作文（应用文）有哪些常考类型？",
        "answer":  "英语一常考：建议信、道歉信、邀请信、通知、报告；英语二常考：书信（建议/投诉/感谢）、通知、备忘录。每种类型掌握开头、结尾套语及 3–5 个中间段逻辑句即可。"
    },
    {
        "_id":  "faq008",
        "category":  "写作",
        "order":  8,
        "tags":  [
                     "评分"
                 ],
        "question":  "考研英语作文评分标准是什么？",
        "answer":  "大作文满分 20 分（英语一/二），小作文 10 分。维度：内容切题、结构清晰、语言准确与丰富、格式规范。第五档（17–20 分）要求几乎无语言错误且表达多样；多数考生集中在 12–16 分区间。"
    },
    {
        "_id":  "faq009",
        "category":  "翻译",
        "order":  9,
        "tags":  [
                     "翻译"
                 ],
        "question":  "英译汉如何拿高分？",
        "answer":  "英语一翻译 5 句共 10 分，英语二整段 15 分。要点：理解整句逻辑再动笔；专有名词可不译；调整语序符合中文习惯；避免「翻译腔」。练真题时对照参考译文分析采分点。"
    },
    {
        "_id":  "faq010",
        "category":  "完形填空",
        "order":  10,
        "tags":  [
                     "完形"
                 ],
        "question":  "完形填空有什么做题技巧？",
        "answer":  "先通读全文把握主旨；重视上下文逻辑与复现词；注意固定搭配与介词；不确定的选项先标记，第二遍再填。完形侧重语感和篇章理解，建议放在阅读之后练习，每天 1 篇真题即可。"
    },
    {
        "_id":  "faq011",
        "category":  "院校选择",
        "order":  11,
        "tags":  [
                     "择校",
                     "英语专业"
                 ],
        "question":  "英语专业考研有哪些常见方向？",
        "answer":  "学硕：英语语言文学、外国语言学及应用语言学、比较文学与世界文学等；专硕：翻译硕士（MTI）、学科教学(英语)等。各校专业课二（基础英语/翻译基础）差异大，务必查阅目标院校最新招生目录与真题。"
    },
    {
        "_id":  "faq012",
        "category":  "院校选择",
        "order":  12,
        "tags":  [
                     "复试"
                 ],
        "question":  "英语专业复试一般考什么？",
        "answer":  "常见环节：专业课笔试（文学/语言学/翻译）、口语面试、二外测试、文献翻译或即兴演讲。部分院校有「文学赏析」「语言学概念」等。建议提前联系学长学姐获取近 3 年复试回忆版。"
    },
    {
        "_id":  "faq013",
        "category":  "工具资源",
        "order":  13,
        "tags":  [
                     "资料"
                 ],
        "question":  "有哪些公认好用的考研英语资料？",
        "answer":  "词汇：墨墨/不背单词 + 大纲词汇；阅读：张剑黄皮书真题；写作：王江涛《考研英语高分写作》；翻译：唐静翻译笔记；长难句：田静/何凯文。以真题为核心，辅导书为辅。"
    },
    {
        "_id":  "faq014",
        "category":  "工具资源",
        "order":  14,
        "tags":  [
                     "模考"
                 ],
        "question":  "考前需要做几套完整模考？",
        "answer":  "建议 11 月起每周 1 套严格计时（14:00–17:00 或对应 3 小时），共 4–6 套。模考后重点分析错题与时间分配，而非只关注分数。留 1–2 套最新真题到考前 1 周保持手感。"
    },
    {
        "_id":  "faq015",
        "category":  "心态调节",
        "order":  15,
        "tags":  [
                     "心态"
                 ],
        "question":  "复习进入瓶颈期怎么办？",
        "answer":  "瓶颈期属正常现象。建议：① 调整任务类型（如从阅读转写作）；② 缩短单次学习块，增加番茄专注；③ 与研友交流而非盲目攀比；④ 保证睡眠与适度运动。坚持复盘比盲目加量更有效。"
    },
    {
        "_id":  "faq016",
        "category":  "备考基础",
        "order":  16,
        "tags":  [
                     "真题"
                 ],
        "question":  "真题应该做几遍？每遍怎么安排？",
        "answer":  "建议至少 3 遍：第一遍按题型精做并精读（7–9 月）；第二遍整套计时模考（10–11 月）；第三遍只看错题与长难句（12 月）。切忌过早刷完所有年份导致考前无题可做。"
    },
    {
        "_id":  "faq017",
        "category":  "备考基础",
        "order":  17,
        "tags":  [
                     "词汇",
                     "方法"
                 ],
        "question":  "背单词总记不住，有什么高效方法？",
        "answer":  "采用「语境记忆法」：在真题阅读和例句中记词，而非孤立背列表。推荐艾宾浩斯复习曲线 App，每天新词 50–80 个为宜。重点掌握一词多义与固定搭配，熟词僻义是阅读失分常见原因。"
    },
    {
        "_id":  "faq018",
        "category":  "阅读理解",
        "order":  18,
        "tags":  [
                     "新题型"
                 ],
        "question":  "英语一新题型（排序/七选五）怎么做？",
        "answer":  "七选五：先看选项关键词，再读文章找逻辑连接词（however, therefore 等）和代词指代。排序题：先找首段（不含指代词）和尾段，中间利用时间顺序或因果链。控制在 15–18 分钟内，不必逐字翻译。"
    },
    {
        "_id":  "faq019",
        "category":  "院校选择",
        "order":  19,
        "tags":  [
                     "MTI",
                     "专硕"
                 ],
        "question":  "翻译硕士（MTI）和学硕有什么区别？",
        "answer":  "MTI 是专业学位，侧重实践与就业，学制通常 2 年，课程含口笔译、本地化等；学硕偏重理论与研究，学制 3 年，需读文献写论文。MTI 初试一般考翻译基础与百科，不考二外；学硕常考文学/语言学综合。"
    },
    {
        "_id":  "faq020",
        "category":  "院校选择",
        "order":  20,
        "tags":  [
                     "二外"
                 ],
        "question":  "英语专业考研需要考第二外语吗？",
        "answer":  "学硕（如英语语言文学）多数院校要求第二外语（日语、法语、德语等），在初试第四门考查；专硕 MTI 和学科教学(英语)通常不考二外。具体以目标院校招生目录为准，二外基础薄弱者可优先考虑专硕。"
    },
    {
        "_id":  "faq021",
        "category":  "院校选择",
        "order":  21,
        "tags":  [
                     "调剂"
                 ],
        "question":  "一志愿没上岸，调剂要注意什么？",
        "answer":  "关注研招网调剂系统开放时间，提前收集接收调剂的院校信息。英语专业调剂需方向相近（文学/语言学/翻译/学科教学）。准备个人陈述、成绩单、证书；部分院校有调剂复试笔试。建议同时联系 3–5 所院校。"
    },
    {
        "_id":  "faq022",
        "category":  "工具资源",
        "order":  22,
        "tags":  [
                     "时间"
                 ],
        "question":  "每天学英语多长时间比较合适？",
        "answer":  "基础阶段建议 2–3 小时（词汇+长难句）；强化阶段 3–4 小时（阅读+翻译）；冲刺阶段 2 小时（模考+作文）。质量重于时长，番茄专注 25 分钟 + 5 分钟休息比低效坐 6 小时更有效。"
    },
    {
        "_id":  "faq023",
        "category":  "写作",
        "order":  23,
        "tags":  [
                     "积累"
                 ],
        "question":  "作文有哪些必背的高分句型？",
        "answer":  "建议积累：① 图表描述（account for, constitute, witness a dramatic increase）；② 观点表达（It is widely acknowledged that...）；③ 对比（On the one hand... On the other hand...）；④ 总结（In conclusion, it is imperative that...）。每类 3–5 句即可，重在灵活运用。"
    },
    {
        "_id":  "faq024",
        "category":  "翻译",
        "order":  24,
        "tags":  [
                     "技巧"
                 ],
        "question":  "翻译题遇到不懂的单词怎么办？",
        "answer":  "根据上下文和词根词缀推测大意，切忌空着不译。人名地名按音译惯例处理；专业术语可意译。得分关键是句子主干译对、逻辑关系清晰，个别词汇偏差影响有限。平时积累真题高频话题词汇（经济、法律、科技等）。"
    },
    {
        "_id":  "faq025",
        "category":  "心态调节",
        "order":  25,
        "tags":  [
                     "冲刺"
                 ],
        "question":  "考前一周英语该怎么复习？",
        "answer":  "停止刷新题，以回顾为主：背作文模板和主题词汇；过一遍错题本；做 1 套完整模考保持手感；调整作息适应考试时间（14:00–17:00）。保证睡眠，避免熬夜背单词。信心与状态同样重要。"
    },
    {
        "_id":  "faq026",
        "category":  "院校选择",
        "order":  26,
        "tags":  [
                     "复试",
                     "口语"
                 ],
        "question":  "复试英语口语怎么准备？",
        "answer":  "准备 1–2 分钟自我介绍（中英各一版），熟记研究兴趣与本科课程亮点。常见问题：为何选本校/本方向、读过哪些专业书、未来规划。建议用录音自测发音与流利度，准备 2–3 个可展开的「故事型」例子，避免背诵腔。"
    },
    {
        "_id":  "faq027",
        "category":  "院校选择",
        "order":  27,
        "tags":  [
                     "专业课",
                     "书目"
                 ],
        "question":  "专业课参考书太多，怎么抓重点？",
        "answer":  "先看近 3–5 年真题，倒推高频考点；再按院校书目列出「必读/选读」。文学方向抓作家流派与作品主题；语言学抓核心概念与例子；翻译抓技巧分类与练习。每周做一章笔记+自测，比通读全书更高效。"
    },
    {
        "_id":  "faq028",
        "category":  "备考基础",
        "order":  28,
        "tags":  [
                     "跨考"
                 ],
        "question":  "跨专业考英语相关方向可行吗？",
        "answer":  "可行，但需补齐专业课短板。跨考文学/语言学建议尽早精读核心教材并做真题；跨考 MTI 可发挥语言基本功优势，重点练翻译与百科。复试可能被问本科背景匹配度，提前准备合理动机与学习计划。"
    },
    {
        "_id":  "faq029",
        "category":  "写作",
        "order":  29,
        "tags":  [
                     "图表作文"
                 ],
        "question":  "英语二图表作文怎么写结构？",
        "answer":  "经典三段：① 概述图表主题并描述 1–2 个关键数据；② 分析原因或趋势含义；③ 简要评论或展望。避免罗列全部数字，突出对比与变化。字数约 150 词，描述占 40%、分析占 40%、评论占 20%。"
    },
    {
        "_id":  "faq030",
        "category":  "阅读理解",
        "order":  30,
        "tags":  [
                     "定位"
                 ],
        "question":  "阅读题如何快速定位答案句？",
        "answer":  "先读题干找关键词（专有名词、数字、极端词），再回文定位段落；注意同义替换而非原词复现。顺序题多按文章顺序出题；主旨题放最后做。定位后对比选项差异，排除「绝对化」「偷换概念」干扰项。"
    },
    {
        "_id":  "faq031",
        "category":  "院校选择",
        "order":  31,
        "tags":  [
                     "报录比"
                 ],
        "question":  "报录比怎么看才有参考价值？",
        "answer":  "关注近 3 年平均，而非单年极端值；结合招生人数、推免比例与复试线综合判断。小专业人数少时波动大。本小程序院校库中的报录比为公开信息估算，最终以研招网与院校官网为准。"
    },
    {
        "_id":  "faq032",
        "category":  "备考基础",
        "order":  32,
        "tags":  [
                     "时间分配"
                 ],
        "question":  "公共课和专业课时间怎么分配？",
        "answer":  "英语专业考生专业课权重大，建议强化阶段公共课（政治+英语）与专业课约 4:6；若英语基础弱可先 5:5。临近考试提高公共课模考占比。用周计划固定「英语阅读日」「专业课精读日」，避免临近考试才补专业课。"
    },
    {
        "_id":  "faq033",
        "category":  "工具资源",
        "order":  33,
        "tags":  [
                     "暑期"
                 ],
        "question":  "暑假两个月英语怎么规划？",
        "answer":  "建议目标：① 大纲词汇过完第 2 轮；② 精读近 10 年阅读真题至少一半；③ 每周写 1 篇大作文+1 篇小作文；④ 翻译每天 1–2 句。可配合本小程序番茄专注与计划模块打卡，保持节奏比突击刷题更重要。"
    },
    {
        "_id":  "faq034",
        "category":  "备考基础",
        "order":  34,
        "tags":  [
                     "听力",
                     "口语"
                 ],
        "question":  "考研英语考听力或口语吗？",
        "answer":  "全国统考初试英语一/二目前不考听力与口语。英语专业学硕复试几乎都有口语；部分院校复试有听力或视听说。MTI 复试常有口译环节。初试阶段可暂缓听力专项，但复试前至少 3–4 周集中练口语。"
    },
    {
        "_id":  "faq035",
        "category":  "心态调节",
        "order":  35,
        "tags":  [
                     "焦虑"
                 ],
        "question":  "一刷真题分数很低，要不要换目标院校？",
        "answer":  "首刷真题分数普遍偏低，不必立即降目标。先看错题是否「可纠正型」（词汇/技巧）还是「能力型」。坚持 1–2 个月系统复盘后再评估。择校可设冲刺/稳妥/保底三档，用模考均分对照复试线，比单次分数更可靠。"
    }
];

const ESSAY_SAMPLES = [
    {
        "_id":  "es001",
        "year":  2024,
        "examType":  "english1",
        "essayType":  "big",
        "topic":  "2024考研英语一大作文",
        "title":  "高校学生选课情况变化",
        "prompt":  "Write an essay of 160–200 words based on the following chart. In your essay, you should 1) describe the chart briefly, 2) interpret the implied meaning, and 3) give your comments.",
        "content":  "The bar chart clearly illustrates the changing preferences of college students in course selection over the past decade. In 2014, approximately 65% of students chose major-related courses, while only 20% opted for general electives. By 2024, the proportion of general electives has risen sharply to 45%, whereas major-related courses have declined to roughly 40%, and practical skill courses have also gained noticeable popularity.\n\nSeveral factors account for this shift. First, universities have expanded their curriculum by offering diverse interdisciplinary programs, which attract students seeking broader horizons. Second, in a competitive job market, employers increasingly value transferable skills such as critical thinking, teamwork and communication, prompting students to explore courses beyond their majors. Third, online platforms make it easier to sample subjects before committing to a specialization.\n\nFrom my perspective, this trend is largely positive. A well-rounded education equips graduates with adaptability and creativity in a rapidly changing society. However, students should strike a careful balance between professional depth and intellectual breadth, ensuring that elective learning complements rather than undermines their core competencies and long-term career goals.",
        "wordCount":  178,
        "tags":  [
                     "图表作文",
                     "教育"
                 ],
        "source":  "依据2024真题题型原创参考范文"
    },
    {
        "_id":  "es002",
        "year":  2024,
        "examType":  "english2",
        "essayType":  "big",
        "topic":  "2024考研英语二大作文",
        "title":  "社区公园功能使用情况",
        "prompt":  "Write an essay based on the chart below. You should write about 150 words, describing the chart and giving your comments.",
        "content":  "The chart presents how residents of a community use a local park. Exercise accounts for the largest share at 35%, followed by relaxation at 25% and social activities at 20%. Reading and other purposes make up the remaining 20% of visits.\n\nThis distribution reflects the multifunctional role of urban green spaces. Parks serve not only as venues for physical fitness but also as essential places for mental relief from daily stress. The significant proportion devoted to social interaction suggests that parks strengthen neighborhood bonds, especially among the elderly and parents with young children.\n\nIn conclusion, community parks are invaluable public assets. Municipal authorities should maintain and upgrade these facilities to meet diverse needs, while citizens ought to cherish and protect shared spaces for the well-being of all generations.",
        "wordCount":  138,
        "tags":  [
                     "图表作文",
                     "社会"
                 ],
        "source":  "依据2024真题题型原创参考范文"
    },
    {
        "_id":  "es003",
        "year":  2023,
        "examType":  "english1",
        "essayType":  "big",
        "topic":  "2023考研英语一大作文",
        "title":  "传统文化学习人数增长",
        "prompt":  "Write an essay of 160–200 words based on the chart. Describe, interpret and comment.",
        "content":  "The line graph depicts a steady increase in the number of young people participating in traditional culture programs from 2018 to 2023. Starting at roughly 1.2 million participants, the figure has more than doubled to nearly 2.8 million by 2023, with a particularly notable surge after 2021 when cultural education campaigns intensified nationwide.\n\nThis upward trend can be attributed to multiple causes. The national emphasis on cultural confidence has encouraged schools and mainstream media to promote heritage activities. Meanwhile, social media platforms have made traditional arts such as calligraphy, folk music and opera accessible and even fashionable among the youth. Community workshops and museum open days further lower the barrier to entry.\n\nI believe this revival is encouraging. Reconnecting with cultural roots fosters identity and enriches spiritual life in an age of globalization. Nevertheless, genuine appreciation requires sustained engagement rather than superficial participation driven by short-lived trends alone. Schools and families should help young people move from curiosity to lasting practice.",
        "wordCount":  168,
        "tags":  [
                     "图画/图表",
                     "文化"
                 ],
        "source":  "依据2023真题题型原创参考范文"
    },
    {
        "_id":  "es004",
        "year":  2023,
        "examType":  "english2",
        "essayType":  "big",
        "topic":  "2023考研英语二大作文",
        "title":  "健康意识与锻炼习惯",
        "prompt":  "Write an essay of about 150 words based on the chart. Describe and comment.",
        "content":  "According to the survey, the percentage of citizens who exercise regularly has climbed from 28% in 2018 to 42% in 2023. Concurrently, awareness of balanced diet and adequate sleep has also improved, though at a somewhat slower pace than physical activity.\n\nThe improvement likely stems from heightened health education during recent years, as well as the popularity of wearable devices that track daily steps and sleep quality. Many workplaces now organize fitness programs, making exercise more convenient for busy employees.\n\nWhile the progress is commendable, challenges remain. Sedentary lifestyles associated with desk jobs continue to threaten public health. Governments, communities and individuals should collaborate to sustain this momentum through accessible facilities and long-term habit formation.",
        "wordCount":  128,
        "tags":  [
                     "图表作文",
                     "健康"
                 ],
        "source":  "依据2023真题题型原创参考范文"
    },
    {
        "_id":  "es005",
        "year":  2024,
        "examType":  "english1",
        "essayType":  "small",
        "topic":  "2024考研英语一小作文",
        "title":  "建议信：改善图书馆服务",
        "prompt":  "Suppose you are a student who writes to the university library. Make suggestions for improvement. Write about 100 words.",
        "content":  "Dear Sir or Madam,\n\nI am writing to offer some suggestions regarding our library services. Many students hope for extended opening hours during exam periods, especially on weekends when seats are often fully occupied before noon. Additionally, increasing the number of power outlets and improving Wi-Fi stability in reading rooms would greatly enhance the study experience.\n\nI would also recommend introducing a mobile app for seat reservation to reduce queueing time and conflicts over study desks.\n\nThank you for considering these proposals. I believe they would benefit the entire student community.\n\nYours sincerely,\nLi Ming",
        "wordCount":  102,
        "tags":  [
                     "建议信",
                     "应用文"
                 ],
        "source":  "依据真题书信题型原创参考范文"
    },
    {
        "_id":  "es006",
        "year":  2024,
        "examType":  "english2",
        "essayType":  "small",
        "topic":  "2024考研英语二小作文",
        "title":  "邀请信：参加英语角活动",
        "prompt":  "Write an invitation letter to international students. About 100 words.",
        "content":  "Dear Friends,\n\nOn behalf of the English Association, I am delighted to invite you to our weekly English Corner this Friday at 7 p.m. in the Student Center, Room 201.\n\nThe theme will be \"Cultural Exchange Through Storytelling.\" Native speakers and Chinese students will share personal experiences in small groups, and light refreshments will be provided after the discussion.\n\nWe sincerely hope you can join us for an enjoyable evening of language practice and friendship. Please reply by Thursday if you plan to attend.\n\nYours,\nLi Ming",
        "wordCount":  95,
        "tags":  [
                     "邀请信",
                     "应用文"
                 ],
        "source":  "依据真题书信题型原创参考范文"
    },
    {
        "_id":  "es007",
        "year":  2022,
        "examType":  "english1",
        "essayType":  "big",
        "topic":  "2022考研英语一大作文",
        "title":  "环保行动参与人数",
        "prompt":  "Write an essay of 160–200 words based on the chart. Describe, interpret and comment.",
        "content":  "The chart compares voluntary participation in environmental campaigns among citizens in City A and City B from 2017 to 2022. In both cities, engagement has grown consistently, with City A rising from 15% to 38% and City B from 10% to 32%. The gap between the two cities has narrowed slightly, yet City A remains ahead throughout the period.\n\nThis growth mirrors increasing public awareness of climate change and urban pollution. Local governments have organized tree-planting events and recycling drives, while NGOs use social media to mobilize volunteers efficiently. Schools also integrate environmental education into curricula, influencing family behavior and daily consumption choices.\n\nSuch civic participation is vital for sustainable development. However, occasional events alone cannot substitute for systematic policies. Lasting change requires legal enforcement, green technology investment and everyday habits such as reducing plastic use and conserving energy. Only when institutions and individuals act together can environmental progress become irreversible.",
        "wordCount":  162,
        "tags":  [
                     "图表作文",
                     "环保"
                 ],
        "source":  "依据2022真题题型原创参考范文"
    },
    {
        "_id":  "es008",
        "year":  2022,
        "examType":  "english2",
        "essayType":  "big",
        "topic":  "2022考研英语二大作文",
        "title":  "在线学习使用率",
        "prompt":  "Write about 150 words based on the chart.",
        "content":  "The pie chart shows how college students allocate their learning time between online and offline methods. Online learning occupies 55%, including video lectures and digital assignments, while offline activities such as classroom discussion and laboratory work account for 45% of the total study time.\n\nThe dominance of online learning reflects technological advancement and flexibility, particularly after widespread adoption of digital platforms. Students can review materials at their own pace and access resources from renowned scholars worldwide without leaving campus.\n\nNevertheless, face-to-face interaction remains irreplaceable for developing communication skills and receiving immediate feedback. An ideal model should blend both approaches carefully, leveraging technology without neglecting the human element of education and mentorship.",
        "wordCount":  128,
        "tags":  [
                     "图表作文",
                     "教育"
                 ],
        "source":  "依据2022真题题型原创参考范文"
    },
    {
        "_id":  "es009",
        "year":  2021,
        "examType":  "english1",
        "essayType":  "big",
        "topic":  "2021考研英语一大作文",
        "title":  "体育锻炼情况调查",
        "prompt":  "Write an essay of 160–200 words based on the chart. Describe, interpret and comment.",
        "content":  "The bar chart reveals the weekly exercise habits of college students. Roughly 45% exercise more than three times per week, 30% exercise one to three times, and 25% rarely exercise at all. The contrast between active and sedentary groups is thus quite striking.\n\nThe data suggest that although a substantial group maintains active lifestyles, a quarter of students remain inactive, which may result from heavy academic pressure, long hours of online entertainment and limited access to sports facilities during peak hours. Universities have responded by upgrading gyms and offering credit-bearing fitness courses, yet motivation ultimately depends on individual awareness of health risks.\n\nRegular physical activity enhances immunity, relieves stress and improves academic performance. I advocate that colleges integrate short exercise breaks into daily schedules and that students treat fitness as an integral part of self-discipline rather than an optional leisure activity. Building sustainable habits early will benefit both body and mind for years to come.",
        "wordCount":  165,
        "tags":  [
                     "图表作文",
                     "健康"
                 ],
        "source":  "依据2021真题题型原创参考范文"
    },
    {
        "_id":  "es010",
        "year":  2021,
        "examType":  "english2",
        "essayType":  "big",
        "topic":  "2021考研英语二大作文",
        "title":  "居民休闲方式选择",
        "prompt":  "Write about 150 words based on the chart. Describe and comment.",
        "content":  "The chart illustrates how residents in a certain city spend their leisure time. Watching TV still ranks first at 32%, while mobile entertainment has surged to 28%. Reading, sports and other outdoor or cultural activities account for the remaining share of leisure hours.\n\nThe rise of mobile entertainment reflects the penetration of smartphones and short-video platforms into daily life. While digital content offers convenience and variety, over-reliance may reduce face-to-face communication and outdoor activity, especially among young people.\n\nA balanced lifestyle should combine virtual enjoyment with physical and cultural pursuits. Families and communities can encourage reading clubs and sports events to diversify leisure options and promote healthier, more meaningful habits.",
        "wordCount":  120,
        "tags":  [
                     "图表作文",
                     "社会"
                 ],
        "source":  "依据2021真题题型原创参考范文"
    },
    {
        "_id":  "es011",
        "year":  2021,
        "examType":  "english1",
        "essayType":  "small",
        "topic":  "2021考研英语一小作文",
        "title":  "道歉信：未能参加聚会",
        "prompt":  "Write a letter of apology to a friend for missing a gathering. About 100 words.",
        "content":  "Dear Tom,\n\nI am writing to apologize for missing your birthday party last Saturday. I had intended to come and even bought a gift in advance, but an urgent assignment deadline forced me to stay on campus until midnight and I could not leave the library.\n\nI truly regret not being there to celebrate with you and our mutual friends. Please accept my sincere apology. I would like to treat you to dinner next week to make up for my absence and deliver the gift in person.\n\nHope to see you soon.\n\nYours,\nLi Ming",
        "wordCount":  102,
        "tags":  [
                     "道歉信",
                     "应用文"
                 ],
        "source":  "依据真题书信题型原创参考范文"
    },
    {
        "_id":  "es012",
        "year":  2023,
        "examType":  "english2",
        "essayType":  "small",
        "topic":  "2023考研英语二小作文",
        "title":  "建议信：帮助同学改进学习",
        "prompt":  "Write a letter to a friend Jack giving suggestions on improving English study. About 100 words.",
        "content":  "Dear Jack,\n\nI was glad to hear that you are preparing for the postgraduate entrance exam. Here are a few suggestions that might help you improve efficiently.\n\nFirst, focus on past exam papers rather than excessive mock exercises from commercial books. Second, set aside thirty minutes daily for vocabulary review in authentic contexts. Third, practice writing two essays per week and seek feedback from teachers or peers whenever possible.\n\nFeel free to contact me if you need more detailed weekly plans. I am confident that with consistent effort, you will make steady progress.\n\nBest wishes,\nLi Ming",
        "wordCount":  105,
        "tags":  [
                     "建议信",
                     "应用文"
                 ],
        "source":  "依据真题书信题型原创参考范文"
    },
    {
        "_id":  "es013",
        "year":  2020,
        "examType":  "english1",
        "essayType":  "big",
        "topic":  "2020考研英语一大作文",
        "title":  "手机使用习惯与学习效率",
        "prompt":  "Write an essay of 160–200 words based on the chart. Describe, interpret and comment.",
        "content":  "The chart shows how college students allocate smartphone time across different activities. Social media and short videos occupy nearly 50% of usage, while study-related apps account for only about 20%. The remaining time is spent on shopping, news browsing and other forms of entertainment.\n\nThis imbalance reveals a widespread challenge: digital devices intended as learning tools often become sources of distraction. Notifications interrupt deep work, and endless scrolling consumes hours that could be devoted to reading and revision. Many students report that they open an app for a quick check and then lose focus for half an hour or more.\n\nTo reverse this pattern, individuals should set clear screen-time limits and use focus modes during study sessions. Universities can promote digital literacy workshops that teach intentional technology use. Smartphones are neither good nor bad by nature; what matters is whether we control them wisely or allow them to control our attention and study habits.",
        "wordCount":  168,
        "tags":  [
                     "图表作文",
                     "科技"
                 ],
        "source":  "依据真题题型原创参考范文"
    },
    {
        "_id":  "es014",
        "year":  2020,
        "examType":  "english2",
        "essayType":  "big",
        "topic":  "2020考研英语二大作文",
        "title":  "大学生兼职经历占比",
        "prompt":  "Write about 150 words based on the chart. Describe and comment.",
        "content":  "The chart indicates that the proportion of college students with part-time job experience has risen from 35% in 2015 to 58% in 2020. Campus assistant roles and tutoring remain the most common choices, followed by internships in local companies.\n\nSeveral reasons explain this growth. Rising living costs encourage students to earn pocket money, while employers increasingly prefer graduates with practical experience. Universities also cooperate with enterprises to provide internship programs that count toward academic credits.\n\nOverall, moderate part-time work can develop time management and communication skills. Students should nevertheless prioritize coursework and avoid jobs that severely disrupt sleep or exam preparation, ensuring that work experience supports rather than replaces academic growth.",
        "wordCount":  118,
        "tags":  [
                     "图表作文",
                     "就业"
                 ],
        "source":  "依据真题题型原创参考范文"
    },
    {
        "_id":  "es015",
        "year":  2022,
        "examType":  "english1",
        "essayType":  "small",
        "topic":  "2022考研英语一小作文",
        "title":  "通知：招募志愿者",
        "prompt":  "Write a notice to recruit volunteers for a campus reading event. About 100 words.",
        "content":  "Notice\n\nThe Student Union will hold a Campus Reading Week from March 10 to March 16. We are now recruiting 20 volunteers to help with book displays, guided reading sessions and visitor registration.\n\nApplicants should be responsible, patient and fluent in basic English communication. Previous event experience is preferred but not required. Please send your name, major and contact information to readingweek@university.edu by March 1.\n\nWe look forward to your participation in promoting a vibrant reading culture on campus.\n\nStudent Union\nFebruary 20, 2022",
        "wordCount":  93,
        "tags":  [
                     "通知",
                     "应用文"
                 ],
        "source":  "依据真题应用文题型原创参考范文"
    },
    {
        "_id":  "es016",
        "year":  2020,
        "examType":  "english2",
        "essayType":  "small",
        "topic":  "2020考研英语二小作文",
        "title":  "感谢信：实习指导",
        "prompt":  "Write a letter to thank your internship supervisor. About 100 words.",
        "content":  "Dear Ms. Wang,\n\nI am writing to express my heartfelt thanks for your guidance during my one-month internship at your company. Under your patient instruction, I learned how to prepare professional reports, communicate with clients and work effectively in a team.\n\nThese skills will be invaluable for my future career. I especially appreciate the time you spent reviewing my weekly summaries and offering concrete advice.\n\nThank you once again for this memorable experience. I hope to keep in touch and wish you every success.\n\nYours sincerely,\nLi Ming",
        "wordCount":  94,
        "tags":  [
                     "感谢信",
                     "应用文"
                 ],
        "source":  "依据真题书信题型原创参考范文"
    }
];
function listFaqs(category) {
  let list = FAQS.slice();
  if (category) list = list.filter((f) => f.category === category);
  return list.sort((a, b) => a.order - b.order);
}

function getFaq(faqId) {
  return FAQS.find((f) => f._id === faqId) || null;
}

function listFaqCategories() {
  const set = new Set(FAQS.map((f) => f.category));
  return Array.from(set);
}

function listEssaySamples(filters) {
  const { examType, essayType, year } = filters || {};
  let list = ESSAY_SAMPLES.slice();
  if (examType) list = list.filter((e) => e.examType === examType);
  if (essayType) list = list.filter((e) => e.essayType === essayType);
  if (year) list = list.filter((e) => e.year === year);
  return list.sort((a, b) => b.year - a.year);
}

function getEssaySample(sampleId) {
  return ESSAY_SAMPLES.find((e) => e._id === sampleId) || null;
}

function listEssayTopics() {
  return ESSAY_SAMPLES.map((e) => e.topic).filter((v, i, a) => a.indexOf(v) === i);
}

module.exports = {
  FAQS,
  ESSAY_SAMPLES,
  listFaqs,
  getFaq,
  listFaqCategories,
  listEssaySamples,
  getEssaySample,
  listEssayTopics
};
