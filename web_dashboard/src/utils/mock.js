export const months = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

export function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

export function genMonthlyCatMmrc() {
  const baseCat = 18;
  const baseMmrc = 1.6;
  return months.map((m, idx) => {
    const drift = Math.sin(idx / 2) * 1.5;
    return {
      month: `2025-${m}`,
      CAT: Math.max(
        8,
        Math.min(35, Math.round(baseCat + drift + (Math.random() * 4 - 2)))
      ),
      mMRC: Math.max(
        0,
        Math.min(4, +(baseMmrc + (Math.random() - 0.5) * 0.8).toFixed(1))
      ),
    };
  });
}

export function genRiskAdherence() {
  const high = randomBetween(18, 30);
  const lowAdh = randomBetween(22, 40);
  return { highRisk: high, lowAdherence: lowAdh, total: 100 };
}

export function genPatients(n = 24) {
  return Array.from({ length: n }).map((_, i) => ({
    id: String(1000 + i),
    name: `病患 ${String.fromCharCode(65 + (i % 26))}${i}`,
    age: randomBetween(58, 82),
    sex: Math.random() > 0.5 ? "男" : "女",
    risk: ["高", "中", "低"][randomBetween(0, 2)],
    adherence7d: randomBetween(48, 100),
    lastReportDays: randomBetween(0, 6),
  }));
}

export function genDailyMetrics(days = 30) {
  const today = new Date("2025-08-11");
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    return {
      day: label,
      water_cc: randomBetween(800, 2200),
      medication: Math.random() > 0.15 ? 1 : 0,
      exercise_min: randomBetween(0, 45),
      cigarettes: Math.random() > 0.7 ? randomBetween(1, 8) : 0,
    };
  });
}

export function formatLastReportDays(n) {
  return n === 0 ? "今日回報" : `${n}天前`;
}

// 總覽行為趨勢（每月平均）
export function genOverviewBehaviorTrends() {
  return months.map((m) => ({
    month: m,
    water_avg_cc: randomBetween(1100, 2000),
    exercise_avg_min: randomBetween(8, 30),
    medication_rate: randomBetween(60, 98), // %
    cigarettes_avg: Math.max(
      0,
      Math.round(randomBetween(0, 5) + (m < "07" ? 1 : 0))
    ),
  }));
}

// 使用頁：回報熱力曆（近 8 週，週起始週一）
export function genReportingCalendarData(weeks = 8) {
  const days = weeks * 7;
  const today = new Date("2025-08-11");
  const data = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    data.push({
      date: iso,
      weekday: d.getDay(), // 0 周日
      count: randomBetween(0, 8),
    });
  }
  return data;
}

// 日級 CAT/mMRC 趨勢（供頁面切換 "天" 使用）
export function genDailyCatMmrcTrend(days = 30) {
  const ms = genDailyMetrics(days);
  return ms.map((m, i) => ({
    day: m.day,
    CAT: Math.max(
      6,
      Math.min(35, 20 + Math.round(Math.sin(i / 4) * 4) + randomBetween(-2, 2))
    ),
    mMRC: Math.max(
      0,
      Math.min(
        4,
        +(1.4 + Math.sin(i / 6) * 0.6 + (Math.random() - 0.5) * 0.6).toFixed(1)
      )
    ),
  }));
}

// 週級 CAT/mMRC 趨勢（近 n 週，平均值）
export function genWeeklyCatMmrcTrend(weeks = 12) {
  const days = weeks * 7;
  const daily = genDailyCatMmrcTrend(days);
  const out = [];
  for (let w = 0; w < weeks; w += 1) {
    const seg = daily.slice(w * 7, (w + 1) * 7);
    const cat = Math.round(seg.reduce((a, b) => a + b.CAT, 0) / seg.length);
    const mm = +(seg.reduce((a, b) => a + b.mMRC, 0) / seg.length).toFixed(1);
    out.push({ week: `W${w + 1}`, CAT: cat, mMRC: mm });
  }
  return out;
}

// 使用者行為分佈（登入/回報）依時間序列
export function genUsageBehaviorSeries(range = "month") {
  if (range === "day") {
    const days = 30;
    return Array.from({ length: days }).map((_, i) => ({
      x: `D${i + 1}`,
      login: randomBetween(20, 80),
      report: randomBetween(10, 60),
    }));
  }
  if (range === "week") {
    const weeks = 12;
    return Array.from({ length: weeks }).map((_, i) => ({
      x: `W${i + 1}`,
      login: randomBetween(120, 220),
      report: randomBetween(90, 160),
    }));
  }
  // month
  return months.map((m) => ({
    x: m,
    login: randomBetween(300, 900),
    report: randomBetween(200, 800),
  }));
}

// 行為趨勢依時間序列（平均水/運動/吸藥率/抽菸）
export function genBehaviorOverviewSeries(range = "month") {
  if (range === "day") {
    const days = 30;
    return Array.from({ length: days }).map((_, i) => ({
      x: `D${i + 1}`,
      water_avg_cc: randomBetween(900, 2200),
      exercise_avg_min: randomBetween(5, 35),
      medication_rate: randomBetween(55, 98),
      cigarettes_avg: randomBetween(0, 6),
    }));
  }
  if (range === "week") {
    const weeks = 12;
    return Array.from({ length: weeks }).map((_, i) => ({
      x: `W${i + 1}`,
      water_avg_cc: randomBetween(1100, 2100),
      exercise_avg_min: randomBetween(8, 28),
      medication_rate: randomBetween(60, 96),
      cigarettes_avg: randomBetween(0, 5),
    }));
  }
  // month
  return genOverviewBehaviorTrends().map((d) => ({
    x: d.month,
    water_avg_cc: d.water_avg_cc,
    exercise_avg_min: d.exercise_avg_min,
    medication_rate: d.medication_rate,
    cigarettes_avg: d.cigarettes_avg,
  }));
}
