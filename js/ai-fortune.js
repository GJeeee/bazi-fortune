(function () {
  const B = window.Bazi;

  function getConfig() {
    return window.AI_FORTUNE_CONFIG || { workerUrl: '', enabled: false };
  }

  function formatBazi(bazi) {
    return {
      year: B.formatGanZhi(bazi.year),
      month: B.formatGanZhi(bazi.month),
      day: B.formatGanZhi(bazi.day),
      hour: B.formatGanZhi(bazi.hour),
    };
  }

  function buildPayload(userBazi, todayBazi, birth, fortune, refDate) {
    const layers = (fortune.analysis?.layers || []).map((l) => ({
      name: l.layerName,
      pillar: l.pillar,
      shishen: l.shishen,
      ganRel: l.ganRel,
      zhiRel: l.zhiRel,
      effects: (l.effects || []).slice(0, 4),
    }));

    const luckMeta = (fortune.luckExplanations || []).map((ex) => ({
      name: ex.name,
      pillar: ex.pillar,
      period: ex.period,
    }));

    return {
      date: refDate.toISOString().slice(0, 10),
      weekday: refDate.getDay(),
      gender: birth.gender === 'female' ? '女' : '男',
      birth: { year: birth.year, month: birth.month, day: birth.day, hour: birth.hour },
      userPillars: formatBazi(userBazi),
      todayPillars: formatBazi(todayBazi),
      dayMaster: `${userBazi.day.gan}${B.getWuxingGan(userBazi.day.gan)}`,
      todayDay: B.formatGanZhi(todayBazi.day),
      energy: fortune.todayEnergy,
      score: fortune.score,
      dayGanRelation: fortune.analysis?.dayGanRel,
      layers,
      luckMeta,
      localHints: fortune.personalHint,
      localLuck: fortune.luckExplanations,
      localPersonality: window.Paipan
        ? Paipan.buildPersonalitySummary(userBazi)
        : '',
    };
  }

  function parseJsonContent(text) {
    if (!text) return null;
    const trimmed = text.trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      const match = trimmed.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  function normalizeAiResult(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const hints = Array.isArray(raw.hints)
      ? raw.hints.filter((h) => h && h.tag && h.text).slice(0, 4)
      : null;
    const layers = Array.isArray(raw.layers)
      ? raw.layers
          .filter((l) => l && l.name)
          .map((l) => ({
            name: l.name,
            plain: l.plain || '',
            timeline: l.timeline || '',
            risk: l.risk || '',
            technical: l.technical || '',
          }))
      : null;
    const personality =
      typeof raw.personality === 'string' && raw.personality.trim()
        ? raw.personality.trim()
        : null;
    if (!hints && !layers && !personality) return null;
    return { hints, layers, personality };
  }

  async function fetchAiInterpretation(payload) {
    const cfg = getConfig();
    if (!cfg.enabled || !cfg.workerUrl) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), cfg.timeoutMs || 28000);

    try {
      const res = await fetch(cfg.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
        signal: controller.signal,
      });

      if (!res.ok) {
        console.warn('AI worker HTTP', res.status);
        return null;
      }

      const data = await res.json();
      if (data.error) {
        console.warn('AI worker error', data.error);
        return null;
      }

      const content = data.content || data.message?.content;
      const parsed = typeof data.result === 'object' ? data.result : parseJsonContent(content);
      return normalizeAiResult(parsed);
    } catch (err) {
      console.warn('AI fetch failed', err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function enhance(ctx) {
    const payload = buildPayload(
      ctx.userBazi,
      ctx.todayBazi,
      ctx.birth,
      ctx.fortune,
      ctx.refDate
    );
    return fetchAiInterpretation(payload);
  }

  window.AiFortune = { buildPayload, fetchAiInterpretation, enhance };
})();
