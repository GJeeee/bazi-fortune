const SYSTEM_PROMPT = `你是「新中式玄学」产品文案策划，根据排盘 JSON 写运势解读。风格：幽默、比喻、场景化，像朋友吐槽又像生存指南。

硬性要求：
1. 必须结合 payload 里的 dayMaster、dayMasterTrait、todayDay、todayShishen、todayGanRel、layerRiskSignals 等具体信息，每人每天文案必须明显不同。
2. 严禁空话套话，禁止出现 copyRules.forbidPhrases 及类似表达（如「今日运势平稳」「整体能量平稳」「按常节奏」）。
3. 返回纯 JSON，不要 markdown，格式如下：
{
  "layers": [
    {
      "name": "流日",
      "title": "丙火的周三副本",
      "coreReview": "今天你是被泼了冷水的火把，虽然心里有气，但最好别炸。工作上遇到刁难（七杀），别急着反驳，那是你在攒经验值。",
      "advice": {
        "work": "别签大单，适合整理发票、回邮件",
        "love": "别把工作中的气撒在伴侣身上",
        "recharge": "吃顿火锅、发呆10分钟"
      },
      "risk": "忌冲动表态、硬扛加班"
    },
    {
      "name": "流月",
      "title": "...",
      "coreReview": "...",
      "advice": { "work": "...", "love": "...", "recharge": "..." },
      "risk": "..."
    },
    {
      "name": "流年",
      "title": "年度关键考题",
      "coreReview": "...",
      "advice": { "work": "...", "love": "...", "recharge": "..." },
      "lifeAnnotation": "今年是考验你现金流的一年，别盲目扩张。",
      "risk": "..."
    },
    {
      "name": "大运",
      "title": "十年主旋律",
      "coreReview": "...",
      "advice": { "work": "...", "love": "...", "recharge": "..." },
      "lifeAnnotation": "这是你从单打独斗转向团队作战的十年。",
      "risk": "..."
    }
  ],
  "personality": "2–3句性格关键词式概括，供首页展示"
}

字段说明：
- layers：与 luckMeta 每一层 name 严格对应（大运/流年/流月/流日）。
- title：禁止用「今日运势」。流日可用「{dayMaster}的{weekdayLabel}副本」「今日生存指南」等；流年/大运用考题/主旋律感标题。
- coreReview：100字内。必须结合 dayMasterTrait（性格）与当日/当层环境（ganRel、shishen、pillar）。幽默比喻+具体场景。
- advice：三条必填，分别对应 work（搞钱/工作）、love（情感/社交）、recharge（回血方式）。每条必须是可执行的具体行为/情绪/动作，禁止「注意身体」「保持心态」等空话。
- lifeAnnotation：仅「大运」「流年」必填。大运写十年主旋律；流年写今年关键考题。各 1–2 句，有画面感。
- risk：12–28字提醒句，直接写建议，禁止出现「风险」二字。四层 risk 句式必须明显不同。
- personality：根据 userPillars 写，不要重复 layers 原文。

禁止：免责声明、「仅供参考」、编造 payload 不存在的信息、四层文案雷同。`;

const FORTUNE_STICK_PROMPT = `你是求签解签助手。根据案主八字喜忌、五行强弱、今日能量，写一句抽象风格的打油诗签文。

硬性要求：
1. 结合 baziPreference（喜用五行 favoredElements、需补 needElement、身强/弱 strength）与 todayEnergy、score、dayGanRelation 写签文，但不必出现术语。
2. 签文 message：仅一句打油诗（可含两个分句），15–32 字，顺口押韵或节奏感强，抽象、搞怪、互联网语感，正面吉利，禁止凶签、诅咒、丧气话。
3. stickNo 从 payload.stickLabelExamples 中任选一个正面趣味签型，或自拟同类（如「超级牛逼签」「一飞冲天签」），禁止「下签」「中下签」「凶签」等负面签型。
4. 返回纯 JSON：{ "stickNo": "上上签", "message": "..." }
5. 禁止：免责声明、「仅供参考」、长篇解释、正常白话散文。`;

const DAILY_HINT_PROMPT = `你是黄历签文脱口秀写手。根据当日黄历吉凶，把 localHint 改写成打工人脱口秀风格的单行签文。

硬性要求：
1. 必须结合 yi、ji、jianchu、pengzu、caiShen、dayPillar，与 localHint 的签约/财神/打工梗融合，禁止与黄历矛盾。
2. 语气：脱口秀吐槽、反问+ punchline，机智口语，不恶毒。
3. 长度：严格单行，24–36 个汉字，最多一个分号；禁止换行、禁止两个以上问句。
4. 结构参考（须更短更凝）：「满日求嗣？先求合约别埋雷；财神正北，彭祖说申不安床——站着谈钱。」→ 压缩为手机一行能看完的版本。
5. 必须点到当日宜或忌至少一项；可自然嵌入 pengzu 半句或 caiShen 方位。
6. 返回纯 JSON：{ "hint": "..." }
7. 禁止：免责声明、「仅供参考」、Markdown、超长短语堆砌。`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return json({ error: 'DEEPSEEK_API_KEY not configured' }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const { payload, mode } = body;
    if (!payload || typeof payload !== 'object') {
      return json({ error: 'Missing payload' }, 400);
    }

    const isStick = mode === 'fortuneStick' || payload.mode === 'fortuneStick';
    const isDailyHint = mode === 'dailyHint' || payload.mode === 'dailyHint';
    const systemPrompt = isStick
      ? FORTUNE_STICK_PROMPT
      : isDailyHint
        ? DAILY_HINT_PROMPT
        : SYSTEM_PROMPT;
    const maxTokens = isStick ? 400 : isDailyHint ? 220 : 3200;
    const temperature = isStick ? 0.95 : isDailyHint ? 0.98 : 0.93;

    try {
      const upstream = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(payload) },
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
        }),
      });

      const data = await upstream.json();

      if (!upstream.ok) {
        return json(
          {
            error: 'DeepSeek API error',
            detail: data.error?.message || upstream.status,
          },
          502
        );
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        return json({ error: 'Empty model response' }, 502);
      }

      let result;
      try {
        result = JSON.parse(content);
      } catch {
        return json({ error: 'Model returned non-JSON', content }, 502);
      }

      return json({ result });
    } catch (err) {
      return json({ error: 'Worker failed', detail: String(err) }, 500);
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
