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

  const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  const DM_TRAITS = {
    木: '向上、讲原则、不喜被绑',
    火: '外热内急、表达快、易上头',
    土: '务实能扛、思虑多、行动偏慢',
    金: '讲分寸规则、决断干脆、略硬',
    水: '心思细、适应强、情绪如流',
  };

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

    const layerRiskSignals = (fortune.analysis?.layers || []).map((l) => ({
      name: l.layerName,
      pillar: l.pillar,
      shishen: l.shishen,
      ganRel: l.ganRel,
      zhiRel: l.zhiRel,
      effects: (l.effects || []).slice(0, 6),
    }));

    const localLuck = (fortune.luckExplanations || []).map((ex) => ({
      name: ex.name,
      pillar: ex.pillar,
      period: ex.period,
      plain: ex.plain,
      timeline: ex.timeline,
      technical: ex.technical,
    }));

    const dmWx = B.getWuxingGan(userBazi.day.gan);
    const todayLayer = layers.find((l) => l.name === '流日') || layers[layers.length - 1];

    return {
      date: refDate.toISOString().slice(0, 10),
      weekday: refDate.getDay(),
      weekdayLabel: WEEKDAY_LABELS[refDate.getDay()],
      gender: birth.gender === 'female' ? '女' : '男',
      birth: { year: birth.year, month: birth.month, day: birth.day, hour: birth.hour },
      userPillars: formatBazi(userBazi),
      todayPillars: formatBazi(todayBazi),
      dayMaster: `${userBazi.day.gan}${dmWx}`,
      dayMasterTrait: DM_TRAITS[dmWx] || '',
      todayDay: B.formatGanZhi(todayBazi.day),
      todayShishen: todayLayer?.shishen || '',
      todayGanRel: todayLayer?.ganRel || fortune.analysis?.dayGanRel,
      todayZhiRel: todayLayer?.zhiRel,
      energy: fortune.todayEnergy,
      score: fortune.score,
      dayGanRelation: fortune.analysis?.dayGanRel,
      layers,
      luckMeta,
      layerRiskSignals,
      copyRules: {
        forbidTitles: ['今日运势', '运势平稳', '整体运势'],
        forbidPhrases: [
          '今日运势平稳',
          '整体平稳',
          '按常节奏',
          '能量平稳',
          '稳中求进',
          '宜按节奏行事',
        ],
        titleExamples: ['今日生存指南', '丙火的周三副本', '年度关键考题', '十年主旋律'],
        coreReviewStyle: '幽默、比喻、场景化，100字内，必须结合 dayMasterTrait 与 todayGanRel/todayShishen',
        adviceStyle: '三条建议必须具体到行为/情绪/动作，禁止空泛套话',
        lifeAnnotationScope: '仅大运、流年层必填 lifeAnnotation',
      },
      localLuck,
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

  function normalizeAdvice(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const work = raw.work || raw.money || raw.career || '';
    const love = raw.love || raw.social || raw.emotion || '';
    const recharge = raw.recharge || raw.energy || raw.health || '';
    if (!work && !love && !recharge) return null;
    return { work, love, recharge };
  }

  function normalizeLayer(layer) {
    if (!layer || !layer.name) return null;
    const advice = normalizeAdvice(layer.advice);
    return {
      name: layer.name,
      title: typeof layer.title === 'string' ? layer.title.trim() : '',
      coreReview: typeof layer.coreReview === 'string' ? layer.coreReview.trim() : '',
      advice,
      lifeAnnotation:
        typeof layer.lifeAnnotation === 'string' ? layer.lifeAnnotation.trim() : '',
      risk: typeof layer.risk === 'string' ? layer.risk.trim() : '',
      plain: layer.plain || '',
      timeline: layer.timeline || '',
      technical: layer.technical || '',
    };
  }

  function normalizeAiResult(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const hints = Array.isArray(raw.hints)
      ? raw.hints.filter((h) => h && h.tag && h.text && h.tag !== '日常').slice(0, 3)
      : null;
    const layers = Array.isArray(raw.layers)
      ? raw.layers.map(normalizeLayer).filter(Boolean)
      : null;
    const personality =
      typeof raw.personality === 'string' && raw.personality.trim()
        ? raw.personality.trim()
        : null;
    const hasLayerContent = layers?.some(
      (l) => l.title || l.coreReview || l.advice || l.lifeAnnotation
    );
    if (!hints && !hasLayerContent && !personality) return null;
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
