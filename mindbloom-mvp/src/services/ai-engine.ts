// MindBloom AI 情绪分析引擎
// 支持规则匹配 + 语义分析 + 情绪强度评估 + 上下文感知

export interface EmotionAnalysis {
  labels: string[];
  keywords: string[];
  intensity: number; // 情绪强度 0-1
  response: string;
  suggestions?: string[]; // 建议
  relatedTopics?: string[]; // 相关话题
  isNegativeEmotion?: boolean; // 是否为负面情绪
}

export interface ContextAwareAnalysis extends EmotionAnalysis {
  contextReferences: string[]; // 引用的上下文内容
  followUpQuestion?: string; // 跟进问题
  suggestedConnections: { fromLabel: string; toLabel: string; reason: string }[]; // 建议的连接
}

// 负面情绪标签
const NEGATIVE_EMOTIONS = ['焦虑', '忧郁', '愤怒', '疲惫', '困惑'];

// 情绪词典 - 扩展版
const EMOTION_DICTIONARY: Record<string, { labels: string[]; intensity: number; isNegative: boolean }> = {
  '焦虑': { 
    labels: ['焦虑', '担心', '不安', '紧张', '害怕', '恐慌', '烦躁'], 
    intensity: 0.8,
    isNegative: true
  },
  '忧郁': { 
    labels: ['难过', '伤心', '孤独', '绝望', '空虚', '抑郁', '低落', '沮丧'], 
    intensity: 0.7,
    isNegative: true
  },
  '愤怒': { 
    labels: ['生气', '愤怒', '讨厌', '憎恨', '烦躁', '抓狂', '无语'], 
    intensity: 0.75,
    isNegative: true
  },
  '平静': { 
    labels: ['平静', '淡定', '安稳', '宁静', '放松', '舒适'], 
    intensity: 0.3,
    isNegative: false
  },
  '快乐': { 
    labels: ['开心', '快乐', '兴奋', '激动', '喜悦', '满足', '幸福'], 
    intensity: 0.6,
    isNegative: false
  },
  '疲惫': { 
    labels: ['累', '疲惫', '无力', '倦怠', '没劲', ' exhaustion'], 
    intensity: 0.65,
    isNegative: true
  },
  '困惑': { 
    labels: ['困惑', '迷茫', '纠结', '犹豫', '不确定', '不明白'], 
    intensity: 0.5,
    isNegative: true
  },
  '期待': { 
    labels: ['期待', '希望', '盼望', '憧憬', '向往'], 
    intensity: 0.4,
    isNegative: false
  }
};

// 主题关键词词典
const TOPIC_DICTIONARY: Record<string, string[]> = {
  '工作': ['工作', '上班', '项目', '领导', '同事', '加班', 'KPI', '开会', '职场', '业绩', '汇报', '方案', '老板', '上司'],
  '学习': ['学习', '考试', '论文', '作业', '学校', '老师', '课程', '挂科', '读书', '考研', '考证'],
  '生活': ['生活', '吃饭', '睡觉', '家', '日常', '琐事', '家务', '购物', '做饭', '打扫'],
  '关系': ['朋友', '爸妈', '他', '她', '恋爱', '对象', '伴侣', '结婚', '分手', '暧昧', '暗恋', '家人', '亲戚'],
  '健康': ['身体', '健康', '生病', '医院', '吃药', '运动', '健身', '饮食', '睡眠', '体检'],
  '财务': ['钱', '工资', '存款', '花钱', '消费', '理财', '投资', '贷款', '房贷', '车贷'],
  '自我': ['自己', '个人', '成长', '价值', '意义', '目标', '梦想', '未来', '人生', '选择']
};

// 语义关联规则 - 用于自动建议连接
const SEMANTIC_CONNECTIONS: Record<string, string[]> = {
  '工作': ['压力', '领导', '同事', '加班', 'KPI', '职场'],
  '关系': ['朋友', '家人', '恋爱', '伴侣', '吵架', '矛盾'],
  '焦虑': ['工作', '学习', '健康', '财务'],
  '愤怒': ['工作', '关系', '领导', '同事'],
  '疲惫': ['工作', '学习', '健康'],
  '忧郁': ['关系', '自我', '生活'],
  '困惑': ['自我', '未来', '选择', '人生']
};

// AI 回应模板库
const RESPONSE_TEMPLATES = {
  openings: [
    "我能感觉到你此刻的心情。",
    "谢谢你愿意和我分享这些。",
    "嗯，我正在听你说话。",
    "听起来你正在经历一些不容易的事情。",
    "我在这里陪着你。",
    "这些感受都很真实，也很重要。"
  ],
  
  emotionResponses: {
    '焦虑': [
      "这种焦虑的感觉，就像心里揣着一只乱撞的小兔子，让你很难静下心来。",
      "面对这种不确定性，感到不安是很自然的。这种时刻确实会让人觉得心跳加速。",
      "这些焦虑的想法可能会让你觉得压力很大，请记得在这里你是安全的。",
      "焦虑就像一层薄雾，它会模糊视线，但不会改变路本身。",
      "我能理解这种被担忧包围的感觉，让我们试着深呼吸一下。"
    ],
    '忧郁': [
      "这种灰蒙蒙的感觉，一定让你觉得生活有些沉重吧，就像被困在了一场不停歇的雨里。",
      "听起来你现在的心情有些低落，这种疲惫感往往是在提醒我们需要停下来抱抱自己。",
      "这种孤独和无助的感觉很折磨人，但请记住，你的这些情绪都是被允许存在的。",
      "有时候，允许自己难过也是一种力量。",
      "情绪就像天气，有晴天就会有雨天，雨总会停的。"
    ],
    '愤怒': [
      "听起来你现在真的很生气，这些不公平的对待确实让人难以忍受。",
      "愤怒往往是因为我们在乎的东西受到了伤害，这种想爆发的感觉我完全理解。",
      "这种委屈和愤怒交织的感觉一定很不好受，你想把这些不满都释放出来吗？",
      "愤怒是一团火，它可以烧毁一切，也可以温暖人心，关键在于如何引导它。",
      "我感受到你的愤怒了，这种情绪在告诉你一些很重要的事情。"
    ],
    '平静': [
      "能保持这种平静的心境真好，就像湖面一样安稳。",
      "在喧嚣的生活中拥有这样片刻的淡然，其实是一种很难得的能力。",
      "这种稳稳的感觉挺不错的，我们可以就这样安静地待一会儿。",
      "平静不是没有波澜，而是能够在波澜中保持内心的安宁。",
      "这一刻的宁静，是给自己最好的礼物。"
    ],
    '快乐': [
      "真为你感到高兴！这种轻盈和喜悦的感觉值得好好感受。",
      "听到你这么说，我也觉得心里亮堂了不少，生活确实有很多闪光的瞬间。",
      "这种兴奋和满足感真的很棒，要把这种好心情多留住一会儿哦。",
      "快乐像阳光，不仅照亮自己，也能温暖他人。",
      "这种美好的感觉值得被记住，也许以后需要时可以重新回味。"
    ],
    '疲惫': [
      "这种累的感觉一定很难受，身体和心灵都在说需要休息了。",
      "疲惫不是软弱，而是你在努力生活的证明。",
      "有时候，停下来不是放弃，而是为了更好地出发。",
      "你已经在路上走了很远，现在可以稍微歇一歇了。",
      "照顾好自己的身体和情绪，比完成任何事情都重要。"
    ],
    '困惑': [
      "这种迷茫的感觉确实让人不安，但也是成长的开始。",
      "困惑说明你在思考，在寻找更适合自己的答案。",
      "有时候，不知道往哪走，恰恰是因为你在十字路口，有很多选择。",
      "不必急着找到答案，让问题在心里待一会儿，答案会慢慢浮现。",
      "迷茫是探索未知的前奏，你正在走出舒适区。"
    ],
    '期待': [
      "这种期待的感觉很美好，像是在等待一朵花的绽放。",
      "希望是内心最柔软也最强大的力量。",
      "期待本身就是一种幸福，因为它代表着你对未来的相信。",
      "美好的事物值得等待，而你也在为它努力着。",
      "这种憧憬的感觉，让平凡的日子有了光。"
    ],
    '复杂': [
      "你现在的情绪似乎交织在一起，这种复杂的感觉确实很难用一两个词说清楚。",
      "有时候情绪就像一团乱麻，理不顺也没关系，我们可以一点点来梳理。",
      "这种五味杂陈的感觉，其实也是生活最真实的样子。",
      "情绪不需要被分类，它们可以共存，可以流动。",
      "你不需要立刻理解所有感受，让它们自然地存在就好。"
    ]
  },
  
  topicResponses: {
    '工作': [
      "职场中的竞争和琐事往往最容易让人感到内耗，你的努力我都看在眼里。",
      "关于工作上的这些压力，确实容易让人觉得透不过气来，要注意劳逸结合哦。",
      "这些职场上的烦恼，往往是在消耗我们的心力，给自己一点喘息的空间吧。",
      "工作只是生活的一部分，它不能定义你的全部价值。",
      "有时候，暂时抽离一下，反而能看得更清楚。"
    ],
    '学习': [
      "学业上的挑战确实不小，这种被 ddl 追着跑的感觉确实很辛苦。",
      "面对考试和作业的压力，感到疲惫是很正常的，你已经做得很好了。",
      "在知识的海洋里偶尔感到迷茫也没关系，一步一个脚印就好。",
      "学习是一场马拉松，不是短跑，保持自己的节奏最重要。",
      "每一次的努力都在塑造更好的你，即使现在看不到结果。"
    ],
    '生活': [
      "生活中的这些琐碎小事，积累起来也会变成不小的负担。",
      "平淡的日常里，偶尔也会有这样那样不顺心的时候，慢慢来。",
      "关于生活的这些感悟，其实都是在帮助我们更好地认识自己。",
      "生活不总是波澜壮阔，更多的是细水长流的日常。",
      "在平凡的日子里，也能找到属于自己的小确幸。"
    ],
    '关系': [
      "人与人之间的连接最是奇妙，但也最容易带来困扰和伤害。",
      "在一段关系中感到委屈或困惑是很常见的，这说明你是一个重感情的人。",
      "面对这些情感上的纠葛，确实需要很大的勇气和耐心去面对。",
      "关系是一面镜子，照见的不仅是对方，也是我们自己。",
      "有时候，保持适当的距离，反而能让关系更健康。"
    ],
    '健康': [
      "身体是情绪的容器，照顾好身体也是在照顾情绪。",
      "健康是 1，其他都是后面的 0，这个 1 一定要守好。",
      "有时候情绪问题其实是身体在发出信号，需要被听见。",
      "给自己一些时间和空间，让身心慢慢恢复平衡。",
      "健康不是一切，但没有健康就没有一切。"
    ],
    '财务': [
      "金钱的压力确实很现实，但你的价值不取决于银行账户的数字。",
      "财务焦虑很常见，但记住，这只是暂时的状态。",
      "有时候，我们担心的事情最终并没有发生。",
      "理财也是理心，先照顾好内心的安全感。",
      "你已经在为未来努力了，这本身就值得肯定。"
    ],
    '自我': [
      "探索自我的旅程很漫长，但每一步都算数。",
      "关于自己的这些问题，说明你在认真地活着。",
      "成长不是一蹴而就的，允许自己慢慢来。",
      "你比你自己想象的更强大，更有价值。",
      "找到自己是终身的课题，你已经在路上了。"
    ]
  },
  
  closings: [
    "如果这些情绪有个形状，你觉得它会是什么样子的？",
    "如果可以对这种感觉说一句话，你想说什么？",
    "除了这些，还有什么细节是你特别想聊聊的吗？",
    "没关系，在这里你可以完全放松，想说什么都可以。",
    "要不要试着再多说一点点，我会一直陪着你的。",
    "这些感受都很重要，你愿意再多说一些吗？",
    "我在这里，随时准备倾听。"
  ],
  
  followUpQuestions: {
    '工作': [
      "这种工作压力是从什么时候开始的呢？",
      "除了工作，还有其他事情让你感到困扰吗？",
      "你有没有想过和领导或同事聊聊你的感受？",
      "工作之外，有什么事情能让你放松下来吗？"
    ],
    '关系': [
      "这段关系对你来说意味着什么？",
      "你有没有试着和对方沟通你的感受？",
      "在这段关系中，你最在意的是什么？",
      "你觉得对方能理解你的感受吗？"
    ],
    '焦虑': [
      "这种焦虑的感觉通常会在什么时候出现？",
      "你有没有发现什么能帮你缓解这种焦虑？",
      "如果这种焦虑能说话，你觉得它会告诉你什么？",
      "你最担心发生的事情是什么？"
    ],
    '愤怒': [
      "这种愤怒背后，是不是还有一些委屈？",
      "你希望事情变成什么样？",
      "这种愤怒在告诉你什么？",
      "你有没有试着表达过你的不满？"
    ],
    '疲惫': [
      "这种疲惫感是从什么时候开始的？",
      "你有没有给自己足够的休息时间？",
      "如果可以选择，你最想放下什么？",
      "有什么事情是你现在特别想做的吗？"
    ],
    '困惑': [
      "你目前在纠结什么选择？",
      "如果抛开所有顾虑，你内心真正想要的是什么？",
      "这种困惑是从什么时候开始的？",
      "有没有什么人或事能给你一些启发？"
    ],
    '忧郁': [
      "这种低落的感觉持续多久了？",
      "有没有什么事情能让你稍微开心一点？",
      "你愿意和我多说一些你的感受吗？",
      "你觉得是什么在支撑着你？"
    ]
  },
  
  suggestions: {
    '焦虑': [
      "试着做几次深呼吸，吸气 4 秒，屏住 4 秒，呼气 6 秒",
      "把担心的事情写下来，区分哪些是你能控制的",
      "暂时离开当前环境，去喝杯水或散散步",
      "告诉自己：这只是情绪，不是事实"
    ],
    '忧郁': [
      "给自己一个拥抱，或者洗个热水澡",
      "听一首喜欢的歌，让音乐陪伴你",
      "和信任的人聊聊天，不需要解决问题，只是倾诉",
      "做一些简单的事情，比如整理桌面、浇浇花"
    ],
    '愤怒': [
      "试着把愤怒写下来，然后撕掉",
      "做一些运动，让身体释放能量",
      "数到 10，给自己一个冷静下来的时间",
      "问问自己：我真正在意的是什么？"
    ],
    '疲惫': [
      "允许自己休息，不需要一直坚强",
      "睡一觉，或者只是闭目养神一会儿",
      "做一些不需要动脑的事情，比如看一部轻松的电影",
      "告诉自己：我已经做得很好了"
    ],
    '困惑': [
      "把问题写下来，试着从不同角度思考",
      "和信任的人聊聊，听听他们的看法",
      "暂时放下问题，去做一些别的事情",
      "记住：不需要立刻找到答案"
    ]
  }
};

// 情绪强度词
const INTENSITY_WORDS = {
  high: ['非常', '特别', '极其', '超级', '特别特别', '真的', '太', '很'],
  medium: ['有点', '有些', '比较', '挺', '还算'],
  low: ['稍微', '略微', '一般', '还行']
};

// 分析情绪强度
const analyzeIntensity = (text: string): number => {
  let intensity = 0.5;
  
  for (const [level, words] of Object.entries(INTENSITY_WORDS)) {
    if (words.some(w => text.includes(w))) {
      intensity = level === 'high' ? 0.9 : level === 'medium' ? 0.6 : 0.3;
      break;
    }
  }
  
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 1) {
    intensity = Math.min(intensity + exclamationCount * 0.1, 1);
  }
  
  const repeatedChars = /(\w)\1{2,}/.test(text);
  if (repeatedChars) {
    intensity = Math.min(intensity + 0.15, 1);
  }
  
  return intensity;
};

// 提取情绪标签
const extractEmotionLabels = (text: string): { labels: string[]; primaryIntensity: number; isNegative: boolean } => {
  const labels: string[] = [];
  let primaryIntensity = 0;
  let isNegative = false;
  let primaryLabel = '';
  
  for (const [emotion, { labels: emotionLabels, intensity, isNegative: neg }] of Object.entries(EMOTION_DICTIONARY)) {
    const matched = emotionLabels.filter(label => text.includes(label));
    if (matched.length > 0) {
      labels.push(emotion);
      if (intensity > primaryIntensity) {
        primaryIntensity = intensity;
        primaryLabel = emotion;
        isNegative = neg;
      }
    }
  }
  
  const textIntensity = analyzeIntensity(text);
  if (primaryLabel) {
    primaryIntensity = Math.max(primaryIntensity, textIntensity);
  }
  
  return { 
    labels: labels.length > 0 ? labels : ['复杂'], 
    primaryIntensity: labels.length > 0 ? primaryIntensity : 0.4,
    isNegative: labels.length > 0 ? isNegative : false
  };
};

// 提取主题关键词
const extractTopicKeywords = (text: string): string[] => {
  const keywords: string[] = [];
  
  for (const [topic, topicWords] of Object.entries(TOPIC_DICTIONARY)) {
    if (topicWords.some(word => text.includes(word))) {
      keywords.push(topic);
    }
  }
  
  return keywords.length > 0 ? keywords : ['生活'];
};

// 分析语义关联，生成建议连接
const analyzeSemanticConnections = (
  currentLabels: string[], 
  currentTopics: string[],
  previousLabels: string[],
  previousTopics: string[]
): { fromLabel: string; toLabel: string; reason: string }[] => {
  const suggestions: { fromLabel: string; toLabel: string; reason: string }[] = [];
  
  // 检查当前标签和主题与之前的关联
  for (const currentLabel of currentLabels) {
    for (const prevLabel of previousLabels) {
      if (currentLabel !== prevLabel) {
        // 检查是否有语义关联
        const relatedTopics = SEMANTIC_CONNECTIONS[currentLabel] || [];
        const prevTopics = SEMANTIC_CONNECTIONS[prevLabel] || [];
        
        if (relatedTopics.some(t => prevTopics.includes(t))) {
          suggestions.push({
            fromLabel: currentLabel,
            toLabel: prevLabel,
            reason: `两者都与"${relatedTopics.find(t => prevTopics.includes(t))}"相关`
          });
        }
      }
    }
    
    // 检查标签与主题的关联
    for (const currentTopic of currentTopics) {
      const related = SEMANTIC_CONNECTIONS[currentLabel] || [];
      if (related.includes(currentTopic)) {
        suggestions.push({
          fromLabel: currentLabel,
          toLabel: currentTopic,
          reason: `${currentLabel}常与${currentTopic}相关`
        });
      }
    }
  }
  
  return suggestions.slice(0, 3); // 最多建议 3 个连接
};

// 生成跟进问题
const generateFollowUpQuestion = (
  primaryLabel: string,
  topics: string[],
  contextMessages: string[]
): string => {
  const { followUpQuestions } = RESPONSE_TEMPLATES;
  
  // 优先使用主要情绪的跟进问题
  if (followUpQuestions[primaryLabel as keyof typeof followUpQuestions]) {
    const questions = followUpQuestions[primaryLabel as keyof typeof followUpQuestions];
    const question = questions[Math.floor(Math.random() * questions.length)];
    
    // 如果有上下文，可以结合上下文生成更具体的问题
    if (contextMessages.length > 0) {
      const recentContext = contextMessages[contextMessages.length - 1];
      return `${question}（你之前提到过"${recentContext.slice(0, 20)}..."）`;
    }
    
    return question;
  }
  
  //  fallback 到主题跟进问题
  if (topics.length > 0) {
    const primaryTopic = topics[0];
    if (followUpQuestions[primaryTopic as keyof typeof followUpQuestions]) {
      const questions = followUpQuestions[primaryTopic as keyof typeof followUpQuestions];
      return questions[Math.floor(Math.random() * questions.length)];
    }
  }
  
  return "你愿意再多说一些吗？";
};

// 生成 AI 回应
const generateResponse = (
  primaryLabel: string, 
  keywords: string[],
  intensity: number,
  contextMessages: string[] = []
): string => {
  const { openings, emotionResponses, topicResponses, closings } = RESPONSE_TEMPLATES;
  
  const opening = openings[Math.floor(Math.random() * openings.length)];
  const closing = closings[Math.floor(Math.random() * closings.length)];
  
  const emotionResp = (emotionResponses as any)[primaryLabel] || emotionResponses['复杂'];
  const emotionPart = emotionResp[Math.floor(Math.random() * emotionResp.length)];
  
  let topicPart = '';
  if (keywords.length > 0) {
    const primaryTopic = keywords[0];
    const topicResp = (topicResponses as any)[primaryTopic] || topicResponses['生活'];
    topicPart = topicResp[Math.floor(Math.random() * topicResp.length)];
  }
  
  let toneAdjustment = '';
  if (intensity > 0.8) {
    toneAdjustment = "我能感受到这种情绪的强烈程度。";
  } else if (intensity < 0.4) {
    toneAdjustment = "这种平和的状态挺好的。";
  }
  
  // 如果有上下文，添加上下文引用
  let contextPart = '';
  if (contextMessages.length > 0) {
    const recentContext = contextMessages[contextMessages.length - 1];
    contextPart = `这让我想到你之前说的"${recentContext.slice(0, 15)}..."，这两者之间似乎有联系。`;
  }
  
  const patterns = [
    `${opening} ${contextPart} ${emotionPart} ${topicPart ? topicPart + ' ' : ''}${closing}`,
    `${opening} ${toneAdjustment} ${emotionPart} ${closing}`,
    `${opening} ${topicPart} ${emotionPart} ${closing}`
  ];
  
  return patterns[Math.floor(Math.random() * patterns.length)]
    .replace(/  +/g, ' ')
    .trim();
};

// 生成建议
const generateSuggestions = (primaryLabel: string): string[] => {
  const { suggestions } = RESPONSE_TEMPLATES;
  return (suggestions as any)[primaryLabel] || suggestions['焦虑'] || [];
};

// 主分析函数 - 单轮
export const aiEngine = {
  analyze: (text: string): EmotionAnalysis => {
    const { labels, primaryIntensity, isNegative } = extractEmotionLabels(text);
    const primaryLabel = labels[0];
    const keywords = extractTopicKeywords(text);
    const response = generateResponse(primaryLabel, keywords, primaryIntensity);
    const suggestions = generateSuggestions(primaryLabel);
    
    // 分析相关话题
    const relatedTopics = (SEMANTIC_CONNECTIONS[primaryLabel] || []).slice(0, 3);
    
    return {
      labels: labels.slice(0, 3),
      keywords: keywords.slice(0, 5),
      intensity: primaryIntensity,
      response,
      suggestions,
      relatedTopics,
      isNegativeEmotion: isNegative
    };
  },
  
  // 上下文感知分析
  analyzeWithContext: (
    text: string, 
    previousMessages: { text: string; sender: string }[]
  ): ContextAwareAnalysis => {
    const basicAnalysis = aiEngine.analyze(text);
    const primaryLabel = basicAnalysis.labels[0];
    
    // 提取上下文中的情绪标签和主题
    const previousLabels: string[] = [];
    const previousTopics: string[] = [];
    const contextMessages: string[] = [];
    
    for (const msg of previousMessages.slice(-5)) { // 只看最近 5 条
      if (msg.sender === 'user') {
        contextMessages.push(msg.text);
        const prevAnalysis = aiEngine.analyze(msg.text);
        previousLabels.push(...prevAnalysis.labels);
        previousTopics.push(...prevAnalysis.keywords);
      }
    }
    
    // 生成语义连接建议
    const suggestedConnections = analyzeSemanticConnections(
      basicAnalysis.labels,
      basicAnalysis.keywords,
      [...new Set(previousLabels)],
      [...new Set(previousTopics)]
    );
    
    // 生成跟进问题
    const followUpQuestion = generateFollowUpQuestion(
      primaryLabel,
      basicAnalysis.keywords,
      contextMessages
    );
    
    return {
      ...basicAnalysis,
      contextReferences: contextMessages.slice(-2),
      followUpQuestion,
      suggestedConnections
    };
  },
  
  // 批量分析
  batchAnalyze: (texts: string[]): EmotionAnalysis[] => {
    return texts.map(text => aiEngine.analyze(text));
  },
  
  // 获取情绪概览
  getEmotionOverview: (analyses: EmotionAnalysis[]): {
    dominantEmotion: string;
    averageIntensity: number;
    emotionDistribution: Record<string, number>;
    negativeEmotionRatio: number;
    negativeEmotions: EmotionAnalysis[];
  } => {
    const emotionCount: Record<string, number> = {};
    let totalIntensity = 0;
    const negativeEmotions: EmotionAnalysis[] = [];
    
    for (const analysis of analyses) {
      for (const label of analysis.labels) {
        emotionCount[label] = (emotionCount[label] || 0) + 1;
      }
      totalIntensity += analysis.intensity;
      if (analysis.isNegativeEmotion) {
        negativeEmotions.push(analysis);
      }
    }
    
    const dominantEmotion = Object.entries(emotionCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '复杂';
    
    return {
      dominantEmotion,
      averageIntensity: analyses.length > 0 ? totalIntensity / analyses.length : 0,
      emotionDistribution: emotionCount,
      negativeEmotionRatio: analyses.length > 0 ? negativeEmotions.length / analyses.length : 0,
      negativeEmotions
    };
  },
  
  // 过滤负面情绪分析
  filterNegativeEmotions: (analyses: EmotionAnalysis[]): EmotionAnalysis[] => {
    return analyses.filter(a => a.isNegativeEmotion);
  }
};