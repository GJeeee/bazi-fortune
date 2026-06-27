const SYSTEM_PROMPT = `你是八字运势解读助手。根据用户提供的排盘 JSON 数据写中文解读。

硬性要求：
1. 必须结合 payload 里的具体干支、十神、合冲刑、能量比例，每人每天文案必须明显不同，禁止套话复读。
2. 返回纯 JSON，不要 markdown，不要代码块，格式如下：
{
  "hints": [
    { "tag": "健康", "text": "..." },
    { "tag": "财运", "text": "..." },
    { "tag": "感情", "text": "..." }
  ],
  "layers": [
    { "name": "大运", "plain": "...", "timeline": "...", "risk": "...", "technical": "..." },
    { "name": "流年", "plain": "...", "timeline": "...", "risk": "...", "technical": "..." },
    { "name": "流月", "plain": "...", "timeline": "...", "risk": "..." , "technical": "..." },
    { "name": "流日", "plain": "...", "timeline": "...", "risk": "...", "technical": "..." }
  ],
  "personality": "..."
}

字段说明：
- hints：三条独立提醒，各 1–2 句，具体、口语化，覆盖健康/财运/感情。
- layers：与 luckMeta 中每一层一一对应（名称必须一致）。plain 用一句话串起健康、财运、情感、人际四方面（约70%通俗）；timeline 自然写上一段与下一段气运衔接，禁用「回顾」「展望」等生硬词；technical 精简十神术语（约30%）。
- risk（重点润色字段）：每层必填一句 12–28 字的提醒，直接写建议，禁止出现「风险」二字。必须结合 layerRiskSignals 里该层的 pillar、shishen、ganRel、zhiRel、effects 写，四层 risk 句式与用词必须明显不同：
  · 大运：十年尺度，忌贪功、冒进、杠杆
  · 流年：全年尺度，忌一次押满全年计划
  · 流月：本月尺度，忌把月内小事拖成僵局
  · 流日：当天尺度，忌硬扛、冲动表态、过度加班
  禁止复用或微调以下套话：「重大决定仍宜留余地、别一次押满」「压力上行，忌硬扛、过度加班」及任何四层相同的句子。
- personality：根据 userPillars 写 2–3 句性格概括，不要重复 hints 原文。

禁止：免责声明、「仅供参考」、空泛的「整体平稳」连用、编造 payload 中不存在的信息。`;

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
    const maxTokens = isStick ? 400 : isDailyHint ? 220 : 2600;
    const temperature = isStick ? 0.95 : isDailyHint ? 0.98 : 0.92;

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
