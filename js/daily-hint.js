(function () {
  function getConfig() {
    return window.AI_FORTUNE_CONFIG || { workerUrl: '', enabled: false };
  }

  function buildPayload(almanac, refDate) {
    const isAuspicious = ['成', '开', '定'].includes(almanac.jianchu);
    const isCaution = ['破', '危', '闭'].includes(almanac.jianchu);

    return {
      mode: 'dailyHint',
      date: refDate.toISOString().slice(0, 10),
      weekday: refDate.getDay(),
      dayPillar: almanac.day,
      yi: almanac.yi,
      ji: almanac.ji,
      jianchu: almanac.jianchu,
      jianchuTip: almanac.jianchuTip,
      dayMood: isAuspicious ? '偏吉' : isCaution ? '宜守' : '平稳',
      caiShen: almanac.caiShen,
      chong: almanac.chong,
      sha: almanac.sha,
      pengzu: almanac.pengzu,
      solar: {
        term: almanac.solar?.termName,
        hou: almanac.solar?.hou,
      },
      localHint: almanac.dailyHint,
      styleNote:
        '单行脱口秀签文：反问+吐槽+分号转折，24–36字，宜忌/彭祖/财神方位必须出现至少两项。',
    };
  }

  function normalizeHint(raw) {
    const text = typeof raw?.hint === 'string' ? raw.hint.trim() : '';
    if (!text) return null;
    const oneLine = text.replace(/[\s\n\r]+/g, '').replace(/[—–]/g, '—');
    return oneLine.slice(0, 38);
  }

  async function fetchHint(payload) {
    const cfg = getConfig();
    if (!cfg.enabled || !cfg.workerUrl) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), cfg.timeoutMs || 28000);

    try {
      const res = await fetch(cfg.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'dailyHint', payload }),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.error) return null;
      const raw = data.result || data;
      return normalizeHint(raw);
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function enhance(almanac, refDate) {
    const payload = buildPayload(almanac, refDate);
    return fetchHint(payload);
  }

  window.DailyHint = { buildPayload, enhance };
})();
