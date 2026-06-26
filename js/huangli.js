const YI_POOL = [
  ['祈福', '沐浴', '祭祀'],
  ['嫁娶', '纳采', '订盟'],
  ['开市', '交易', '立券'],
  ['出行', '移徙', '入宅'],
  ['修造', '动土', '竖柱'],
  ['栽种', '纳畜', '牧养'],
  ['裁衣', '会友', '进人口'],
  ['安床', '作灶', '开仓'],
  ['求嗣', '开光', '塑绘'],
  ['纳财', '酝酿', '破土'],
  ['扫舍', '修饰', '理发'],
  ['入学', '习艺', '赴任'],
];

const JI_POOL = [
  ['动土', '破土', '安葬'],
  ['嫁娶', '词讼', '争执'],
  ['开市', '出货', '远行'],
  ['移徙', '入宅', '安门'],
  ['修造', '上梁', '盖屋'],
  ['开仓', '出货', '纳财'],
  ['出行', '乘船', '渡水'],
  ['祭祀', '祈福', '斋醮'],
  ['安床', '作灶', '针灸'],
  ['栽种', '伐木', '捕捉'],
  ['赴任', '上任', '签约'],
  ['沐浴', '剃头', '整手足'],
];

const PENGZU = [
  '甲不开仓 子不问卜', '乙不栽植 丑不冠带', '丙不修灶 寅不祭祀',
  '丁不剃头 卯不穿井', '戊不受田 辰不哭泣', '己不破券 巳不远行',
  '庚不经络 午不苫盖', '辛不合酱 未不服药', '壬不泱水 申不安床',
  '癸不词讼 酉不会客', '甲不开仓 戌不吃犬', '乙不栽植 亥不嫁娶',
  '丙不修灶 子不问卜', '丁不剃头 丑不冠带', '戊不受田 寅不祭祀',
  '己不破券 卯不穿井', '庚不经络 辰不哭泣', '辛不合酱 巳不远行',
  '壬不泱水 午不苫盖', '癸不词讼 未不服药', '甲不开仓 申不安床',
  '乙不栽植 酉不会客', '丙不修灶 戌不吃犬', '丁不剃头 亥不嫁娶',
  '戊不受田 子不问卜', '己不破券 丑不冠带', '庚不经络 寅不祭祀',
  '辛不合酱 卯不穿井', '壬不泱水 辰不哭泣', '癸不词讼 巳不远行',
  '甲不开仓 午不苫盖', '乙不栽植 未不服药', '丙不修灶 申不安床',
  '丁不剃头 酉不会客', '戊不受田 戌不吃犬', '己不破券 亥不嫁娶',
  '庚不经络 子不问卜', '辛不合酱 丑不冠带', '壬不泱水 寅不祭祀',
  '癸不词讼 卯不穿井', '甲不开仓 辰不哭泣', '乙不栽植 巳不远行',
  '丙不修灶 午不苫盖', '丁不剃头 未不服药', '戊不受田 申不安床',
  '己不破券 酉不会客', '庚不经络 戌不吃犬', '辛不合酱 亥不嫁娶',
  '壬不泱水 子不问卜', '癸不词讼 丑不冠带', '甲不开仓 寅不祭祀',
  '乙不栽植 卯不穿井', '丙不修灶 辰不哭泣', '丁不剃头 巳不远行',
  '戊不受田 午不苫盖', '己不破券 未不服药', '庚不经络 申不安床',
  '辛不合酱 酉不会客', '壬不泱水 戌不吃犬', '癸不词讼 亥不嫁娶',
];

const CHONG = ['马', '羊', '猴', '鸡', '狗', '猪', '鼠', '牛', '虎', '兔', '龙', '蛇'];
const SHA = ['北', '东', '南', '西'];

const SOLAR_TERMS = [
  { m: 1, d: 6, name: '小寒' }, { m: 1, d: 20, name: '大寒' },
  { m: 2, d: 4, name: '立春' }, { m: 2, d: 19, name: '雨水' },
  { m: 3, d: 6, name: '惊蛰' }, { m: 3, d: 21, name: '春分' },
  { m: 4, d: 5, name: '清明' }, { m: 4, d: 20, name: '谷雨' },
  { m: 5, d: 6, name: '立夏' }, { m: 5, d: 21, name: '小满' },
  { m: 6, d: 6, name: '芒种' }, { m: 6, d: 21, name: '夏至' },
  { m: 7, d: 7, name: '小暑' }, { m: 7, d: 23, name: '大暑' },
  { m: 8, d: 8, name: '立秋' }, { m: 8, d: 23, name: '处暑' },
  { m: 9, d: 8, name: '白露' }, { m: 9, d: 23, name: '秋分' },
  { m: 10, d: 8, name: '寒露' }, { m: 10, d: 23, name: '霜降' },
  { m: 11, d: 7, name: '立冬' }, { m: 11, d: 22, name: '小雪' },
  { m: 12, d: 7, name: '大雪' }, { m: 12, d: 22, name: '冬至' },
];

const WU_HOU = [
  '雁北乡', '鹊始巢', '雉始雊', '鸡始乳', '征鸟厉疾', '水泽腹坚',
  '东风解冻', '蛰虫始振', '鱼陟负冰', '獭祭鱼', '候雁北', '草木萌动',
  '桃始华', '仓庚鸣', '鹰化为鸠', '玄鸟至', '雷乃发声', '始电',
  '桐始华', '田鼠化为鴽', '虹始见', '萍始生', '鸣鸠拂羽', '戴胜降于桑',
  '蝼蝈鸣', '蚯蚓出', '王瓜生', '苦菜秀', '靡草死', '麦秋至',
  '螳螂生', '鵙始鸣', '反舌无声', '鹿角解', '蜩始鸣', '半夏生',
  '温风至', '蟋蟀居壁', '鹰始挚', '腐草为萤', '土润溽暑', '大雨时行',
  '凉风至', '白露生', '寒蝉鸣', '鹰乃祭鸟', '天地始肃', '禾乃登',
  '鸿雁来', '玄鸟归', '群鸟养羞', '雷始收声', '蛰虫坯户', '水始涸',
  '鸿雁来宾', '雀入大水为蛤', '菊有黄华', '豺乃祭兽', '草木黄落', '蛰虫咸俯',
  '水始冰', '地始冻', '雉入大水为蜃', '虹藏不见', '天气上升地气下降', '闭塞而成冬',
  '鹖鴠不鸣', '虎始交', '荔挺出', '蚯蚓结', '麋角解', '水泉动',
];

const HOU_LABELS = ['初候', '二候', '三候'];

const CAI_SHEN_DIR = ['东北', '西南', '正南', '正北', '正东'];

const DAILY_HINTS = [
  '班味宜淡，合同别盲签；财神在{cai}。',
  '打工莫躁，会议留余地；财位{cai}。',
  '签字前先隔夜，条款如雾要绕；财神朝{cai}。',
  '今日宜领薪心态，不宜硬刚上级；财神在{cai}。',
  '通勤可缓，工位宜静；财位{cai}。',
  '合约未读三遍，勿落笔；财神在{cai}。',
  '打工剧本留白，摸鱼也是呼吸；财神朝{cai}。',
  '汇报宜简，邮件宜缓发；财位{cai}。',
  '面谈可，书面慎；财神在{cai}。',
  '今日宜复盘，不宜立新约；财神朝{cai}。',
  '午休即充电，下午再决；财神在{cai}。',
  '协作如棋，先看对方步；财位{cai}。',
  '报销宜齐，口头承诺莫信；财神在{cai}。',
  '项目可推，合同暂缓；财神朝{cai}。',
  '上班如渡河，急不得也退不得；财神在{cai}。',
  'Deadline 是虚线，健康是实线；财位{cai}。',
  '谈判桌外，多留三成话；财神在{cai}。',
  '今日宜整理工位，不宜签长约；财神朝{cai}。',
  '打工之外，留一条退路；财神在{cai}。',
  '条款里的沉默，往往最响；财位{cai}。',
  '开会多听，签字多等；财神在{cai}。',
  '今日宜交差，不宜交权；财神朝{cai}。',
];

function getCaiShenDirection(dayGan) {
  const gi = Bazi.getGanIndex(dayGan);
  return CAI_SHEN_DIR[gi % 5];
}

function getDailyHint(dayIndex, jianchu, dayGan) {
  const cai = getCaiShenDirection(dayGan);
  const seed = dayIndex * 11 + jianchu.charCodeAt(0) * 3 + giSeed(dayGan);
  const hint = DAILY_HINTS[Math.abs(seed) % DAILY_HINTS.length];
  return hint.replace(/\{cai\}/g, cai);
}

function giSeed(dayGan) {
  return Bazi.getGanIndex(dayGan) * 7;
}

function utcTs(y, m, d) {
  return Date.UTC(y, m - 1, d);
}

function getSolarTermContext(y, m, d) {
  const target = utcTs(y, m, d);
  const candidates = [];

  [y - 1, y, y + 1].forEach((year) => {
    SOLAR_TERMS.forEach((term, index) => {
      candidates.push({
        index,
        name: term.name,
        ts: utcTs(year, term.m, term.d),
      });
    });
  });

  candidates.sort((a, b) => a.ts - b.ts);

  let current = candidates[0];
  for (const c of candidates) {
    if (c.ts <= target) current = c;
    else break;
  }

  const days = Math.floor((target - current.ts) / 86400000);
  const houIdx = Math.min(2, Math.floor(days / 5));
  const wuHou = WU_HOU[current.index * 3 + houIdx] || '';

  return {
    termName: current.name,
    hou: HOU_LABELS[houIdx],
    houIdx,
    wuHou,
    daysInTerm: days,
  };
}

function getYueLing(monthZhi) {
  const wx = Bazi.getWuxingZhi(monthZhi);
  return `${monthZhi}月${wx}令`;
}

const JIANCHU = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'];

function getJianchuIndex(monthZhi, dayZhi) {
  const mi = Bazi.getZhiIndex(monthZhi);
  const di = Bazi.getZhiIndex(dayZhi);
  return (di - mi + 12) % 12;
}

function getDailyAlmanac(y, m, d) {
  const bazi = Bazi.calculateBazi(y, m, d, 12);
  const dayPillar = Bazi.getDayPillar(y, m, d);
  const dayIndex = dayPillar.index;
  const di = Bazi.getZhiIndex(bazi.day.zhi);

  const yi = YI_POOL[dayIndex % YI_POOL.length];
  const ji = JI_POOL[(dayIndex + 5) % JI_POOL.length];
  const jianchu = JIANCHU[getJianchuIndex(bazi.month.zhi, bazi.day.zhi)];
  const chong = CHONG[di];
  const sha = SHA[di % 4];
  const solar = getSolarTermContext(y, m, d);

  let jianchuTip;
  if (['成', '开', '定'].includes(jianchu)) jianchuTip = '气场较顺，宜推进计划。';
  else if (['破', '危', '闭'].includes(jianchu)) jianchuTip = '宜静不宜大动，凡事留有余地。';
  else jianchuTip = '平稳之日，按常节奏即可。';

  return {
    bazi,
    year: Bazi.formatGanZhi(bazi.year),
    month: Bazi.formatGanZhi(bazi.month),
    day: Bazi.formatGanZhi(bazi.day),
    yi,
    ji,
    pengzu: PENGZU[dayIndex],
    chong,
    sha,
    jianchu,
    jianchuTip,
    solar,
    yueLing: getYueLing(bazi.month.zhi),
    caiShen: getCaiShenDirection(bazi.day.gan),
    dailyHint: getDailyHint(dayIndex, jianchu, bazi.day.gan),
  };
}

window.Huangli = { getDailyAlmanac, getSolarTermContext, getYueLing };
