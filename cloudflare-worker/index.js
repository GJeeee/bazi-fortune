const SYSTEM_PROMPT = `你是八字运势解读助手。根据用户提供的排盘 JSON 数据写中文解读。

硬性要求：
1. 必须结合 payload 里的具体干支、十神、合冲刑、能量比例，每人每天文案必须明显不同，禁止套话复读。
2. 返回纯 JSON，不要 markdown，不要代码块，格式如下：
{
  "hints": [
    { "tag": "健康", "text": "..." },
    { "tag": "财运", "text": "..." },
    { "tag": "感情", "text": "..." },
    { "tag": "日常", "text": "..." }
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
- hints：四条独立提醒，各 1–2 句，具体、口语化，覆盖健康/财运/感情/日常场景。
- layers：与 luckMeta 中每一层一一对应（名称必须一致）。plain 用一句话串起健康、财运、情感、人际四方面（约70%通俗）；timeline 自然写上一段与下一段气运衔接，禁用「回顾」「展望」等生硬词；technical 精简十神术语（约30%）。
- risk（重点润色字段）：每层必填一句 12–28 字的提醒，直接写建议，禁止出现「风险」二字。必须结合 layerRiskSignals 里该层的 pillar、shishen、ganRel、zhiRel、effects 写，四层 risk 句式与用词必须明显不同：
  · 大运：十年尺度，忌贪功、冒进、杠杆
  · 流年：全年尺度，忌一次押满全年计划
  · 流月：本月尺度，忌把月内小事拖成僵局
  · 流日：当天尺度，忌硬扛、冲动表态、过度加班
  禁止复用或微调以下套话：「重大决定仍宜留余地、别一次押满」「压力上行，忌硬扛、过度加班」及任何四层相同的句子。
- personality：根据 userPillars 写 2–3 句性格概括，不要重复 hints 原文。

禁止：免责声明、「仅供参考」、空泛的「整体平稳」连用、编造 payload 中不存在的信息。`;

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

    const { payload } = body;
    if (!payload || typeof payload !== 'object') {
      return json({ error: 'Missing payload' }, 400);
    }

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
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(payload) },
          ],
          temperature: 0.92,
          max_tokens: 2600,
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
