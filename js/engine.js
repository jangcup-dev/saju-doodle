// 사주낙서 계산 엔진 (웹). 맥 버전 Sources/Engine/*.swift 와 같은 식·같은 규칙.
// 시각은 Unix 초(실수). 한국 표준시·서머타임 이력은 브라우저 내장 시간대 정보(Asia/Seoul).
import * as P from './phrases.js';

const { floor, trunc, sin, cos, tan, abs, PI } = Math;
const pow = Math.pow;

// ───────────────────────── 천문

export const Astro = (() => {
  const JD_UNIX = 2440587.5;
  const jd = (t) => t / 86400 + JD_UNIX;
  const time = (j) => (j - JD_UNIX) * 86400;

  function deltaT(jdUT) {
    const y = 2000 + (jdUT - 2451544.5) / 365.2425;
    let t, u;
    if (y < 1860) { u = (y - 1820) / 100; return -20 + 32 * u * u; }
    if (y < 1900) { t = y - 1860; return 7.62 + 0.5737 * t - 0.251754 * pow(t, 2) + 0.01680668 * pow(t, 3) - 0.0004473624 * pow(t, 4) + pow(t, 5) / 233174; }
    if (y < 1920) { t = y - 1900; return -2.79 + 1.494119 * t - 0.0598939 * pow(t, 2) + 0.0061966 * pow(t, 3) - 0.000197 * pow(t, 4); }
    if (y < 1941) { t = y - 1920; return 21.20 + 0.84493 * t - 0.076100 * pow(t, 2) + 0.0020936 * pow(t, 3); }
    if (y < 1961) { t = y - 1950; return 29.07 + 0.407 * t - pow(t, 2) / 233 + pow(t, 3) / 2547; }
    if (y < 1986) { t = y - 1975; return 45.45 + 1.067 * t - pow(t, 2) / 260 - pow(t, 3) / 718; }
    if (y < 2005) { t = y - 2000; return 63.86 + 0.3345 * t - 0.060374 * pow(t, 2) + 0.0017275 * pow(t, 3) + 0.000651814 * pow(t, 4) + 0.00002373599 * pow(t, 5); }
    if (y < 2050) { t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * pow(t, 2); }
    if (y < 2150) { u = (y - 1820) / 100; return -20 + 32 * u * u - 0.5628 * (2150 - y); }
    u = (y - 1820) / 100; return -20 + 32 * u * u;
  }

  const t3 = (a) => { const r = []; for (let i = 0; i < a.length; i += 3) r.push([a[i], a[i + 1], a[i + 2]]); return r; };
  const L0 = t3([175347046, 0, 0, 3341656, 4.6692568, 6283.0758500, 34894, 4.62610, 12566.15170, 3497, 2.7441, 5753.3849, 3418, 2.8289, 3.5231, 3136, 3.6277, 77713.7715, 2676, 4.4181, 7860.4194, 2343, 6.1352, 3930.2097, 1324, 0.7425, 11506.7698, 1273, 2.0371, 529.6910, 1199, 1.1096, 1577.3435, 990, 5.233, 5884.927, 902, 2.045, 26.298, 857, 3.508, 398.149, 780, 1.179, 5223.694, 753, 2.533, 5507.553, 505, 4.583, 18849.228, 492, 4.205, 775.523, 357, 2.920, 0.067, 317, 5.849, 11790.629, 284, 1.899, 796.298, 271, 0.315, 10977.079, 243, 0.345, 5486.778, 206, 4.806, 2544.314, 205, 1.869, 5573.143, 202, 2.458, 6069.777, 156, 0.833, 213.299, 132, 3.411, 2942.463, 126, 1.083, 20.775, 115, 0.645, 0.980, 103, 0.636, 4694.003, 102, 0.976, 15720.839, 102, 4.267, 7.114, 99, 6.21, 2146.17, 98, 0.68, 155.42, 86, 5.98, 161000.69, 85, 1.30, 6275.96, 85, 3.67, 71430.70, 80, 1.81, 17260.15, 79, 3.04, 12036.46, 75, 1.76, 5088.63, 74, 3.50, 3154.69, 74, 4.68, 801.82, 70, 0.83, 9437.76, 62, 3.98, 8827.39, 61, 1.82, 7084.90, 57, 2.78, 6286.60, 56, 4.39, 14143.50, 56, 3.47, 6279.55, 52, 0.19, 12139.55, 52, 1.33, 1748.02, 51, 0.28, 5856.48, 49, 0.49, 1194.45, 41, 5.37, 8429.24, 41, 2.40, 19651.05, 39, 6.17, 10447.39, 37, 6.04, 10213.29, 37, 2.57, 1059.38, 36, 1.71, 2352.87, 36, 1.78, 6812.77, 33, 0.59, 17789.85, 30, 0.44, 83996.85, 30, 2.74, 1349.87, 25, 3.16, 4690.48]);
  const L1 = t3([628331966747, 0, 0, 206059, 2.678235, 6283.07585, 4303, 2.6351, 12566.1517, 425, 1.590, 3.523, 119, 5.796, 26.298, 109, 2.966, 1577.344, 93, 2.59, 18849.23, 72, 1.14, 529.69, 68, 1.87, 398.15, 67, 4.41, 5507.55, 59, 2.89, 5223.69, 56, 2.17, 155.42, 45, 0.40, 796.30, 36, 0.47, 775.52, 29, 2.65, 7.11, 21, 5.34, 0.98, 19, 1.85, 5486.78, 19, 4.97, 213.30, 17, 2.99, 6275.96, 16, 0.03, 2544.31, 16, 1.43, 2146.17, 15, 1.21, 10977.08, 12, 2.83, 1748.02, 12, 3.26, 5088.63, 12, 5.27, 1194.45, 12, 2.08, 4694.00, 11, 0.77, 553.57, 10, 1.30, 6286.60, 10, 4.24, 1349.87, 9, 2.70, 242.73, 9, 5.64, 951.72, 8, 5.30, 2352.87, 6, 2.65, 9437.76, 6, 4.67, 4690.48]);
  const L2 = t3([52919, 0, 0, 8720, 1.0721, 6283.0758, 309, 0.867, 12566.152, 27, 0.05, 3.52, 16, 5.19, 26.30, 16, 3.68, 155.42, 10, 0.76, 18849.23, 9, 2.06, 77713.77, 7, 0.83, 775.52, 5, 4.66, 1577.34, 4, 1.03, 7.11, 4, 3.44, 5573.14, 3, 5.14, 796.30, 3, 6.05, 5507.55, 3, 1.19, 242.73, 3, 6.12, 529.69, 3, 0.31, 398.15, 3, 2.28, 553.57, 2, 4.38, 5223.69, 2, 3.75, 0.98]);
  const L3 = t3([289, 5.844, 6283.076, 35, 0, 0, 17, 5.49, 12566.15, 3, 5.20, 155.42, 1, 4.72, 3.52, 1, 5.30, 18849.23, 1, 5.97, 242.73]);
  const L4 = t3([114, 3.142, 0, 8, 4.13, 6283.08, 1, 3.84, 12566.15]);
  const L5 = t3([1, 3.14, 0]);
  const R0 = t3([100013989, 0, 0, 1670700, 3.0984635, 6283.0758500, 13956, 3.05525, 12566.15170, 3084, 5.1985, 77713.7715, 1628, 1.1739, 5753.3849, 1576, 2.8469, 7860.4194, 925, 5.453, 11506.770, 542, 4.564, 3930.210, 472, 3.661, 5884.927]);
  const R1 = t3([103019, 1.107490, 6283.075850, 1721, 1.0644, 12566.1517, 702, 3.142, 0]);
  const R2 = t3([4359, 5.7846, 6283.0758, 124, 5.579, 12566.152]);
  const series = (terms, tau) => { let s = 0; for (const [a, b, c] of terms) s += a * cos(b + c * tau); return s; };
  const norm360 = (x) => { const r = x % 360; return r < 0 ? r + 360 : r; };

  function sunLongitudeJD(jdUT) {
    const jde = jdUT + deltaT(jdUT) / 86400;
    const tau = (jde - 2451545.0) / 365250.0;
    const tt = tau * 10;
    const L = (series(L0, tau) + series(L1, tau) * tau + series(L2, tau) * pow(tau, 2) + series(L3, tau) * pow(tau, 3) + series(L4, tau) * pow(tau, 4) + series(L5, tau) * pow(tau, 5)) / 1e8;
    const R = (series(R0, tau) + series(R1, tau) * tau + series(R2, tau) * pow(tau, 2)) / 1e8;
    let theta = L * 180 / PI + 180;
    theta -= 0.09033 / 3600;
    const omega = (125.04452 - 1934.136261 * tt) * PI / 180;
    const ls = (280.4665 + 36000.7698 * tt) * PI / 180;
    const lm = (218.3165 + 481267.8813 * tt) * PI / 180;
    const dPsi = (-17.20 * sin(omega) - 1.32 * sin(2 * ls) - 0.23 * sin(2 * lm) + 0.21 * sin(2 * omega)) / 3600;
    return norm360(theta + dPsi - 20.4898 / 3600 / R);
  }
  const sunLongitude = (t) => sunLongitudeJD(jd(t));

  function solveSunLongitude(target, near) {
    let j = jd(near);
    for (let i = 0; i < 30; i++) {
      let diff = (target - sunLongitudeJD(j)) % 360;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      const step = diff * 365.2422 / 360 * 0.98;
      j += step;
      if (abs(step) < 1e-7) break;
    }
    return time(j);
  }

  function nextLongitude(after, step, offset = 0) {
    const lon = sunLongitude(after);
    let k = floor((lon - offset) / step) + 1;
    let target = norm360(offset + k * step);
    let t = solveSunLongitude(target, after + norm360(target - lon) * 365.2422 / 360 * 86400);
    if (t <= after) { k += 1; target = norm360(offset + k * step); t = solveSunLongitude(target, t + step * 365.2422 / 360 * 86400); }
    return [t, target];
  }

  function previousLongitude(before, step, offset = 0) {
    const lon = sunLongitude(before);
    const k = floor((lon - offset) / step);
    const target = norm360(offset + k * step);
    let t = solveSunLongitude(target, before - norm360(lon - target) * 365.2422 / 360 * 86400);
    if (t > before) {
      const prev = norm360(target - step);
      t = solveSunLongitude(prev, t - step * 365.2422 / 360 * 86400);
      return [t, prev];
    }
    return [t, target];
  }

  const A14 = t3([0.000325, 299.77, 0.107408, 0.000165, 251.88, 0.016321, 0.000164, 251.83, 26.651886, 0.000126, 349.42, 36.412478, 0.000110, 84.66, 18.206239, 0.000062, 141.74, 53.303771, 0.000060, 207.14, 2.453732, 0.000056, 154.84, 7.306860, 0.000047, 34.52, 27.261239, 0.000042, 207.19, 0.121824, 0.000040, 291.34, 1.844379, 0.000037, 161.72, 24.198154, 0.000035, 239.56, 25.513099, 0.000023, 331.55, 3.592518]);
  function newMoon(k) {
    const t = k / 1236.85, t2 = t * t, t3_ = t2 * t, t4 = t3_ * t;
    let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * t2 - 0.000000150 * t3_ + 0.00000000073 * t4;
    const e = 1 - 0.002516 * t - 0.0000074 * t2, rad = PI / 180;
    const m = (2.5534 + 29.10535670 * k - 0.0000014 * t2 - 0.00000011 * t3_) * rad;
    const mp = (201.5643 + 385.81693528 * k + 0.0107582 * t2 + 0.00001238 * t3_ - 0.000000058 * t4) * rad;
    const f = (160.7108 + 390.67050284 * k - 0.0016118 * t2 - 0.00000227 * t3_ + 0.000000011 * t4) * rad;
    const om = (124.7746 - 1.56375588 * k + 0.0020672 * t2 + 0.00000215 * t3_) * rad;
    let c = -0.40720 * sin(mp);
    c += 0.17241 * e * sin(m); c += 0.01608 * sin(2 * mp); c += 0.01039 * sin(2 * f); c += 0.00739 * e * sin(mp - m);
    c -= 0.00514 * e * sin(mp + m); c += 0.00208 * e * e * sin(2 * m); c -= 0.00111 * sin(mp - 2 * f); c -= 0.00057 * sin(mp + 2 * f);
    c += 0.00056 * e * sin(2 * mp + m); c -= 0.00042 * sin(3 * mp); c += 0.00042 * e * sin(m + 2 * f); c += 0.00038 * e * sin(m - 2 * f);
    c -= 0.00024 * e * sin(2 * mp - m); c -= 0.00017 * sin(om); c -= 0.00007 * sin(mp + 2 * m); c += 0.00004 * sin(2 * mp - 2 * f);
    c += 0.00004 * sin(3 * m); c += 0.00003 * sin(mp + m - 2 * f); c += 0.00003 * sin(2 * mp + 2 * f); c -= 0.00003 * sin(mp + m + 2 * f);
    c += 0.00003 * sin(mp - m + 2 * f); c -= 0.00002 * sin(mp - m - 2 * f); c -= 0.00002 * sin(3 * mp + m); c += 0.00002 * sin(4 * mp);
    let planetary = 0;
    A14.forEach(([a, b, cc], i) => { let arg = b + cc * k; if (i === 0) arg -= 0.009173 * t2; planetary += a * sin(arg * rad); });
    jde += c + planetary;
    return jde - deltaT(jde) / 86400;
  }
  const lunationIndex = (jdUT) => floor((jdUT - 2451550.09766) / 29.530588861);

  function equationOfTime(tm) {
    const j = jd(tm), t = (j - 2451545.0) / 36525, rad = PI / 180;
    const l0 = norm360(280.46646 + 36000.76983 * t + 0.0003032 * t * t) * rad;
    const m = (357.52911 + 35999.05029 * t - 0.0001537 * t * t) * rad;
    const e = 0.016708634 - 0.000042037 * t;
    const eps = (23.439291 - 0.0130042 * t) * rad;
    const y = pow(tan(eps / 2), 2);
    const eq = y * sin(2 * l0) - 2 * e * sin(m) + 4 * e * y * sin(m) * cos(2 * l0) - 0.5 * y * y * sin(4 * l0) - 1.25 * e * e * sin(2 * m);
    return eq * 180 / PI * 4;
  }

  return { jd, time, deltaT, sunLongitude, solveSunLongitude, nextLongitude, previousLongitude, newMoon, lunationIndex, equationOfTime, norm360 };
})();

// ───────────────────────── 한국 시간 · 음력

const seoulFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
const offCache = new Map();

export const KCal = (() => {
  /** 그 순간의 한국 법정 시각 오프셋(초): 표준시 + 서머타임 */
  function legalOffset(t) {
    const s = floor(t);
    const key = floor(s / 900);
    if (offCache.has(key)) return offCache.get(key);
    const parts = {};
    for (const p of seoulFmt.formatToParts(new Date(s * 1000))) parts[p.type] = p.value;
    const wall = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second) / 1000;
    let y = +parts.year; if (y <= 0) y = 1; // 안전장치
    const off = wall - s;
    if (offCache.size > 50000) offCache.clear();
    offCache.set(key, off);
    return off;
  }
  /** 서머타임 여부: 앞뒤 반년보다 오프셋이 크면 서머타임 */
  function isDST(t) {
    const o = legalOffset(t);
    return o > legalOffset(t - 182 * 86400) && o > legalOffset(t + 182 * 86400);
  }
  const standardOffset = (t) => legalOffset(t) - (isDST(t) ? 3600 : 0);

  /** 한국 벽시계 날짜·시각 → 순간 */
  function instant(y, m, d, h, mi) {
    const wall = Date.UTC(y, m - 1, d, h, mi) / 1000;
    let t = wall - 9 * 3600;
    for (let i = 0; i < 3; i++) t = wall - legalOffset(t);
    return t;
  }
  const utcMidnight = (y, m, d) => Date.UTC(y, m - 1, d) / 1000;
  function seoulParts(t) {
    const parts = {};
    for (const p of seoulFmt.formatToParts(new Date(floor(t) * 1000))) parts[p.type] = +p.value;
    return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour % 24, minute: parts.minute };
  }
  function utcParts(t) {
    const d = new Date(floor(t) * 1000);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes() };
  }

  function dayNumber(year, month, day) {
    const a = trunc((14 - month) / 12), y = year + 4800 - a, m = month + 12 * a - 3;
    return day + trunc((153 * m + 2) / 5) + 365 * y + trunc(y / 4) - trunc(y / 100) + trunc(y / 400) - 32045;
  }
  function ymd(jdn) {
    const a = jdn + 32044, b = trunc((4 * a + 3) / 146097), c = a - trunc(146097 * b / 4);
    const d = trunc((4 * c + 3) / 1461), e = c - trunc(1461 * d / 4), m = trunc((5 * e + 2) / 153);
    return [100 * b + d - 4800 + trunc(m / 10), m + 3 - 12 * trunc(m / 10), e - trunc((153 * m + 2) / 5) + 1];
  }
  const standardDayNumber = (t) => floor(Astro.jd(t) + standardOffset(t) / 86400 + 0.5);
  function startOfStandardDay(d) {
    const approx = Astro.time(d - 0.5 - 9.0 / 24);
    return Astro.time(d - 0.5 - standardOffset(approx) / 86400);
  }

  const suiCache = new Map();
  function sui(y) {
    if (suiCache.has(y)) return suiCache.get(y);
    const ws1 = Astro.solveSunLongitude(270, utcMidnight(y - 1, 12, 21));
    const ws2 = Astro.solveSunLongitude(270, utcMidnight(y, 12, 21));
    const d1 = standardDayNumber(ws1), d2 = standardDayNumber(ws2);
    let k = Astro.lunationIndex(Astro.jd(ws1)) - 2;
    const starts = [];
    for (;;) {
      const d = standardDayNumber(Astro.time(Astro.newMoon(k)));
      starts.push(d);
      if (d > d2 + 31) break;
      k += 1;
    }
    let i11a = -1, i11b = -1;
    starts.forEach((d, i) => { if (d <= d1) i11a = i; if (d <= d2) i11b = i; });
    if (i11a < 0 || i11b < 0) return [];
    const ms = starts.slice(i11a, i11b + 1);
    const count = ms.length - 1;
    const lonAt = (d) => Astro.sunLongitude(startOfStandardDay(d));
    const hasZ = [];
    for (let i = 0; i < count; i++) hasZ.push(floor(lonAt(ms[i]) / 30) !== floor(lonAt(ms[i + 1]) / 30));
    const out = [];
    let number = 11, leapUsed = count === 12, newYear = false;
    for (let i = 0; i < count; i++) {
      let leap = false;
      if (i > 0) {
        if (!leapUsed && !hasZ[i]) { leap = true; leapUsed = true; }
        else { number = number % 12 + 1; if (number === 1) newYear = true; }
      }
      out.push({ start: ms[i], length: ms[i + 1] - ms[i], year: newYear ? y : y - 1, month: number, leap });
    }
    suiCache.set(y, out);
    return out;
  }
  function lunarToDayNumber(year, month, day, leap) {
    for (const s of [year, year + 1]) {
      const m = sui(s).find((x) => x.year === year && x.month === month && x.leap === leap);
      if (!m) continue;
      if (day < 1 || day > m.length) return null;
      return m.start + day - 1;
    }
    return null;
  }
  function lunarDate(d) {
    const y = ymd(d)[0];
    for (const s of [y, y + 1]) {
      const m = sui(s).find((x) => d >= x.start && d < x.start + x.length);
      if (m) return { year: m.year, month: m.month, day: d - m.start + 1, leap: m.leap };
    }
    return null;
  }
  const hasLeapMonth = (year, month) => [year, year + 1].some((s) => sui(s).some((x) => x.year === year && x.month === month && x.leap));
  function lunarMonthLength(year, month, leap) {
    for (const s of [year, year + 1]) { const m = sui(s).find((x) => x.year === year && x.month === month && x.leap === leap); if (m) return m.length; }
    return null;
  }
  return { legalOffset, standardOffset, isDST, instant, utcMidnight, seoulParts, utcParts, dayNumber, ymd, sui, lunarToDayNumber, lunarDate, hasLeapMonth, lunarMonthLength };
})();

// ───────────────────────── 기본 표

export const GZ = {
  stemsH: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
  stemsK: ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'],
  branchesH: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],
  branchesK: ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'],
  animals: ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'],
  elementNames: ['목', '화', '토', '금', '수'],
  elementHanja: ['木', '火', '土', '金', '水'],
  stemElement: (s) => trunc(s / 2),
  stemYang: (s) => s % 2 === 0,
  branchElement: [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4],
  branchMainStem: [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8],
  hiddenStems: [[8, 9], [9, 7, 5], [4, 2, 0], [0, 1], [1, 9, 4], [4, 6, 2], [2, 5, 3], [3, 1, 5], [4, 8, 6], [6, 7], [7, 3, 4], [4, 0, 8]],
};

export class Pillar {
  constructor(stem, branch) { this.stem = stem; this.branch = branch; }
  static of60(i) { const n = ((i % 60) + 60) % 60; return new Pillar(n % 10, n % 12); }
  get index60() { for (let i = 0; i < 60; i++) if (i % 10 === this.stem && i % 12 === this.branch) return i; return 0; }
  get hanja() { return GZ.stemsH[this.stem] + GZ.branchesH[this.branch]; }
  get hangul() { return GZ.stemsK[this.stem] + GZ.branchesK[this.branch]; }
  offset(n) { return Pillar.of60(this.index60 + n); }
  equals(o) { return o && o.stem === this.stem && o.branch === this.branch; }
}

/** 십신: 0 비견 … 9 정인 */
export const TenGod = {
  names: ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'],
  hanja: ['比肩', '劫財', '食神', '傷官', '偏財', '正財', '偏官', '正官', '偏印', '正印'],
  groupNames: ['비겁', '식상', '재성', '관성', '인성'],
  group: (g) => trunc(g / 2),
  of(day, other) {
    const ed = GZ.stemElement(day), eo = GZ.stemElement(other);
    const same = GZ.stemYang(day) === GZ.stemYang(other);
    let g;
    if (eo === ed) g = 0; else if ((ed + 1) % 5 === eo) g = 1; else if ((ed + 2) % 5 === eo) g = 2; else if ((eo + 2) % 5 === ed) g = 3; else g = 4;
    return g * 2 + (same ? 0 : 1);
  },
  element: (ofGroup, day) => (GZ.stemElement(day) + ofGroup) % 5,
};

export const TwelveStage = {
  names: ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'],
  birth: [11, 6, 2, 9, 2, 9, 5, 0, 8, 3],
  of(stem, branch) { const s = this.birth[stem]; return GZ.stemYang(stem) ? (branch - s + 12) % 12 : (s - branch + 12) % 12; },
  energy: (st) => [0.5, 0.0, 0.5, 1.0, 1.0, 0.0, -0.5, -0.5, -0.5, -1.0, -0.5, 0.0][st],
};

// 관계: { kind, e?, full?, label }
const R = {
  stemHap: (e) => ({ kind: 'stemHap', e, name: `천간합(${GZ.elementNames[e]})`, harmony: true }),
  stemChung: () => ({ kind: 'stemChung', name: '천간충', harmony: false }),
  yukhap: (e) => ({ kind: 'yukhap', e, name: `육합(${GZ.elementNames[e]})`, harmony: true }),
  samhap: (e, full) => ({ kind: 'samhap', e, full, name: full ? `삼합(${GZ.elementNames[e]}국)` : `반합(${GZ.elementNames[e]})`, harmony: true }),
  chung: () => ({ kind: 'chung', name: '충', harmony: false }),
  hyeong: (n) => ({ kind: 'hyeong', name: n, harmony: false }),
  pa: () => ({ kind: 'pa', name: '파', harmony: false }),
  hae: () => ({ kind: 'hae', name: '해', harmony: false }),
};
const setHas = (pairs, a, b) => pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

export const Relations = {
  stems(a, b) {
    const r = [];
    const pairHap = [[0, 5, 2], [1, 6, 3], [2, 7, 4], [3, 8, 0], [4, 9, 1]];
    for (const [x, v, e] of pairHap) if ((a === x && b === v) || (b === x && a === v)) r.push(R.stemHap(e));
    if (setHas([[0, 6], [1, 7], [2, 8], [3, 9]], a, b)) r.push(R.stemChung());
    return r;
  },
  yukhapPairs: [[0, 1, 2], [2, 11, 0], [3, 10, 1], [4, 9, 3], [5, 8, 4], [6, 7, 1]],
  samhapGroups: [[[8, 0, 4], 4], [[11, 3, 7], 0], [[2, 6, 10], 1], [[5, 9, 1], 3]],
  branches(a, b) {
    const r = [];
    for (const [x, y, e] of this.yukhapPairs) if ((a === x && b === y) || (a === y && b === x)) r.push(R.yukhap(e));
    for (const [g, e] of this.samhapGroups) if (a !== b && g.includes(a) && g.includes(b) && (a === g[1] || b === g[1])) r.push(R.samhap(e, false));
    if (a !== b && setHas([[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]], a, b)) r.push(R.chung());
    const mueun = [2, 5, 8], jise = [1, 10, 7];
    if (a !== b && mueun.includes(a) && mueun.includes(b)) r.push(R.hyeong('형(무은지형)'));
    if (a !== b && jise.includes(a) && jise.includes(b)) r.push(R.hyeong('형(지세지형)'));
    if (a !== b && [0, 3].includes(a) && [0, 3].includes(b)) r.push(R.hyeong('형(무례지형)'));
    if (a === b && [4, 6, 9, 11].includes(a)) r.push(R.hyeong('자형'));
    if (a !== b && setHas([[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]], a, b)) r.push(R.pa());
    if (a !== b && setHas([[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]], a, b)) r.push(R.hae());
    return r;
  },
};

export const Sinsal = {
  cheoneul: [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [5, 3], [5, 3]],
  munchang: [5, 6, 8, 9, 8, 9, 11, 0, 2, 3],
  yangin: { 0: 3, 2: 6, 4: 6, 6: 9, 8: 0 },
  group: (b) => [0, 3, 1, 2, 0, 3, 1, 2, 0, 3, 1, 2][b],
  dohwa: [9, 3, 0, 6], yeokma: [2, 8, 5, 11], hwagae: [4, 10, 7, 1],
};

export const TimeCorrection = ['보정 없음 (표준시)', '경도 보정 (평균태양시)', '진태양시 (경도 + 균시차)'];
export const JasiMode = ['자시에 날짜가 바뀜 (23시)', '야자시·조자시 구분 (0시)'];

export const defaultBirth = () => ({ name: '', isMale: true, isLunar: false, leapMonth: false, year: 1995, month: 1, day: 1, timeKnown: true, hour: 12, minute: 0, placeName: '서울', longitude: 126.978, correction: 1, jasi: 0 });

export const roundHalfAway = (x) => (x >= 0 ? floor(x + 0.5) : -floor(-x + 0.5));

// ───────────────────────── 원국

export const SajuCalc = {
  chart(b) {
    let sy = b.year, sm = b.month, sd = b.day;
    if (b.isLunar) {
      const dn = KCal.lunarToDayNumber(b.year, b.month, b.day, b.leapMonth);
      if (dn == null) throw new Error('날짜를 확인해 주세요. 음력이라면 그 달에 그 날짜(또는 윤달)가 있는지 확인해 주세요.');
      [sy, sm, sd] = KCal.ymd(dn);
    } else {
      const c = KCal.ymd(KCal.dayNumber(sy, sm, sd));
      if (c[0] !== sy || c[1] !== sm || c[2] !== sd) throw new Error('날짜를 확인해 주세요.');
    }
    const h = b.timeKnown ? b.hour : 12, mi = b.timeKnown ? b.minute : 0;
    const instant = KCal.instant(sy, sm, sd, h, mi);

    const ipchun = Astro.solveSunLongitude(315, KCal.utcMidnight(sy, 2, 4));
    const yearP = Pillar.of60((instant >= ipchun ? sy : sy - 1) - 4);
    const lon = Astro.sunLongitude(instant);
    const monthIndex = trunc(((lon - 315 + 360) % 360) / 30);
    const monthP = new Pillar(((yearP.stem % 5) * 2 + 2 + monthIndex) % 10, (monthIndex + 2) % 12);

    let warning = null;
    const prevTerm = Astro.previousLongitude(instant, 30, 315)[0];
    const nextTerm = Astro.nextLongitude(instant, 30, 315)[0];
    const gap = Math.min(instant - prevTerm, nextTerm - instant);
    if (!b.timeKnown && gap < 36 * 3600) warning = '생일이 절입일과 가까워서 태어난 시간에 따라 월주(또는 연주)가 달라질 수 있어요.';
    else if (gap < 2 * 3600) warning = '절입 시각과 2시간 이내라 출생 시각이 조금만 달라도 월주가 바뀔 수 있어요.';

    const std = KCal.standardOffset(instant);
    const offset = b.correction === 0 ? std : b.correction === 1 ? b.longitude * 240 : b.longitude * 240 + Astro.equationOfTime(instant) * 60;
    const legal = KCal.legalOffset(instant);
    const L = KCal.utcParts(instant + offset);

    let dayNum = b.timeKnown ? KCal.dayNumber(L.year, L.month, L.day) : KCal.dayNumber(sy, sm, sd);
    let hourP = null;
    if (b.timeKnown) {
      const late = L.hour >= 23;
      if (late && b.jasi === 0) dayNum += 1;
      const dp = Pillar.of60(dayNum + 49);
      const branch = trunc((L.hour * 60 + L.minute + 60) / 120) % 12;
      const base = late && b.jasi === 1 ? (dp.stem + 1) % 10 : dp.stem;
      hourP = new Pillar(((base % 5) * 2 + branch) % 10, branch);
    }
    const dayP = Pillar.of60(dayNum + 49);
    return {
      birth: b, instant, solarDate: [sy, sm, sd], localTime: [L.year, L.month, L.day, L.hour, L.minute],
      correctionMinutes: (offset - legal) / 60, wasDST: KCal.isDST(instant),
      year: yearP, month: monthP, day: dayP, hour: hourP, monthIndex, nearTermWarning: warning,
      get dayStem() { return this.day.stem; },
      get allPillars() { return [this.year, this.month, this.day, this.hour].filter(Boolean); },
    };
  },
  dayPillar: (y, m, d) => Pillar.of60(KCal.dayNumber(y, m, d) + 49),
  yearMonthPillars(at) {
    const y = KCal.seoulParts(at).year;
    const ipchun = Astro.solveSunLongitude(315, KCal.utcMidnight(y, 2, 4));
    const yp = Pillar.of60((at >= ipchun ? y : y - 1) - 4);
    const mi = trunc(((Astro.sunLongitude(at) - 315 + 360) % 360) / 30);
    return [yp, new Pillar(((yp.stem % 5) * 2 + 2 + mi) % 10, (mi + 2) % 12)];
  },
  yearPillar: (y) => Pillar.of60(y - 4),
};

// ───────────────────────── 분석

export function analyze(c) {
  const ds = c.dayStem;
  const items = [['년주', c.year], ['월주', c.month], ['일주', c.day], ['시주', c.hour]].filter(([, p]) => p).map(([pos, p]) => ({
    position: pos, pillar: p, stemGod: pos === '일주' ? null : TenGod.of(ds, p.stem),
    branchGod: TenGod.of(ds, GZ.branchMainStem[p.branch]), stage: TwelveStage.of(ds, p.branch),
    hidden: GZ.hiddenStems[p.branch].map((s) => [s, TenGod.of(ds, s)]),
  }));
  const count = [0, 0, 0, 0, 0], weighted = [0, 0, 0, 0, 0];
  for (const p of c.allPillars) {
    count[GZ.stemElement(p.stem)] += 1; count[GZ.branchElement[p.branch]] += 1; weighted[GZ.stemElement(p.stem)] += 1;
    const hs = GZ.hiddenStems[p.branch]; const w = hs.length === 2 ? [0.3, 0.7] : [0.2, 0.2, 0.6];
    hs.forEach((s, i) => { weighted[GZ.stemElement(s)] += w[i]; });
  }
  const ed = GZ.stemElement(ds);
  const support = (e) => e === ed || (e + 1) % 5 === ed;
  let sup = 0, total = 0;
  const add = (e, w) => { total += w; if (support(e)) sup += w; };
  add(GZ.branchElement[c.month.branch], 3.0); add(GZ.branchElement[c.day.branch], 1.5); add(GZ.branchElement[c.year.branch], 1.0);
  add(GZ.stemElement(c.month.stem), 1.0); add(GZ.stemElement(c.year.stem), 0.8);
  if (c.hour) { add(GZ.branchElement[c.hour.branch], 1.0); add(GZ.stemElement(c.hour.stem), 1.0); }
  const strengthScore = total > 0 ? sup / total : 0.5;
  const strengthLabel = strengthScore >= 0.58 ? '신강' : strengthScore <= 0.42 ? '신약' : '중화';
  const wanted = strengthLabel === '신약' ? [4, 0] : strengthLabel === '신강' ? [1, 2, 3] : [0, 1, 2, 3, 4];
  const helpfulElements = wanted.map((g) => TenGod.element(g, ds)).map((e, i) => [e, i]).sort((a, b) => weighted[a[0]] - weighted[b[0]] || a[1] - b[1]).map(([e]) => e).slice(0, 2);

  let rels = [];
  const named = [['년', c.year], ['월', c.month], ['일', c.day]].concat(c.hour ? [['시', c.hour]] : []);
  for (let i = 0; i < named.length; i++) for (let j = i + 1; j < named.length; j++) {
    for (const r of Relations.stems(named[i][1].stem, named[j][1].stem)) rels.push({ a: named[i][0] + '간', b: named[j][0] + '간', relation: r });
    for (const r of Relations.branches(named[i][1].branch, named[j][1].branch)) rels.push({ a: named[i][0] + '지', b: named[j][0] + '지', relation: r });
  }
  const bset = new Set(named.map(([, p]) => p.branch));
  for (const [g, e] of Relations.samhapGroups) if (g.every((x) => bset.has(x))) {
    rels = rels.filter((it) => !(it.relation.kind === 'samhap' && !it.relation.full && it.relation.e === e));
    rels.push({ a: '원국', b: '', relation: R.samhap(e, true) });
  }
  const ss = [];
  for (const [pos, p] of named) {
    if (Sinsal.cheoneul[ds].includes(p.branch)) ss.push({ name: '천을귀인', position: pos + '지', note: '어려울 때 도와주는 사람이 나타나는 기운' });
    if (Sinsal.munchang[ds] === p.branch) ss.push({ name: '문창귀인', position: pos + '지', note: '글·공부·표현에 재능' });
    if (Sinsal.yangin[ds] !== undefined && Sinsal.yangin[ds] === p.branch) ss.push({ name: '양인', position: pos + '지', note: '강한 추진력, 과하면 다툼 주의' });
    for (const [base, baseName] of [[c.day.branch, '일지'], [c.year.branch, '년지']]) {
      if ((pos === '일' && baseName === '일지') || (pos === '년' && baseName === '년지')) continue;
      const g = Sinsal.group(base);
      if (Sinsal.dohwa[g] === p.branch) ss.push({ name: '도화', position: pos + '지', note: `${baseName} 기준 · 매력과 인기, 이성 인연` });
      if (Sinsal.yeokma[g] === p.branch) ss.push({ name: '역마', position: pos + '지', note: `${baseName} 기준 · 이동, 변화, 해외·출장` });
      if (Sinsal.hwagae[g] === p.branch) ss.push({ name: '화개', position: pos + '지', note: `${baseName} 기준 · 예술성, 종교·철학, 고독` });
    }
  }
  const seen = new Set();
  const sinsal = ss.filter((s) => { const k = s.name + s.position; if (seen.has(k)) return false; seen.add(k); return true; });
  const forward = GZ.stemYang(c.year.stem) === c.birth.isMale;
  const term = forward ? Astro.nextLongitude(c.instant, 30, 315)[0] : Astro.previousLongitude(c.instant, 30, 315)[0];
  const days = abs(term - c.instant) / 86400;
  const daeun = [];
  for (let i = 1; i <= 10; i++) {
    const p = c.month.offset(forward ? i : -i);
    daeun.push({ pillar: p, startAge: days / 3 + (i - 1) * 10, stemGod: TenGod.of(ds, p.stem), branchGod: TenGod.of(ds, GZ.branchMainStem[p.branch]) });
  }
  return { items, elementCount: count, elementWeighted: weighted, strengthScore, strengthLabel, helpfulElements, relations: rels, sinsal, daeunForward: forward, daeunStart: days / 3, daeun };
}

// ───────────────────────── 카드 덱 (맥·안드로이드와 같은 순서)

const MASK = (1n << 64n) - 1n;
const permCache = new Map();
function perm(key, n) {
  const ck = key * 1000 + n;
  if (permCache.has(ck)) return permCache.get(ck);
  let state = BigInt.asUintN(64, BigInt(key) * 7919n + 17n);
  const next = () => {
    state = (state + 0x9E3779B97F4A7C15n) & MASK;
    let z = state;
    z = ((z ^ (z >> 30n)) * 0xBF58476D1CE4E5B9n) & MASK;
    z = ((z ^ (z >> 27n)) * 0x94D049BB133111EBn) & MASK;
    return z ^ (z >> 31n);
  };
  const p = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Number(next() % BigInt(i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  permCache.set(ck, p);
  return p;
}
export function deckPick(items, key, occurrence) {
  const n = items.length;
  if (n <= 1) return items[0];
  const occ = Math.max(0, occurrence);
  return items[perm(key, n)[(occ % n + trunc(occ / n)) % n]];
}
export function josa(word, withFinal, withoutFinal) {
  const ch = word.charCodeAt(word.length - 1);
  if (!(ch >= 0xAC00 && ch <= 0xD7A3)) return word + withoutFinal;
  return word + ((ch - 0xAC00) % 28 === 0 ? withoutFinal : withFinal);
}

// ───────────────────────── 오늘의 운세

const has = (list, kinds) => list.some((r) => kinds.includes(r.kind));

export function daily(c, a, year, month, day) {
  const dp = SajuCalc.dayPillar(year, month, day);
  const noon = KCal.instant(year, month, day, 12, 0);
  const [yp, mp] = SajuCalc.yearMonthPillars(noon);
  const ds = c.dayStem;
  const stemGod = TenGod.of(ds, dp.stem), branchGod = TenGod.of(ds, GZ.branchMainStem[dp.branch]);
  const stage = TwelveStage.of(ds, dp.branch);
  const factors = [];
  const helpful = new Set(a.helpfulElements);
  const burden = new Set(a.strengthLabel === '신약' ? [TenGod.element(3, ds), TenGod.element(2, ds)] : a.strengthLabel === '신강' ? [TenGod.element(0, ds), TenGod.element(4, ds)] : []);
  const N = TenGod.names;

  const se = GZ.stemElement(dp.stem);
  if (helpful.has(se)) factors.push({ text: `오늘의 천간 ${GZ.stemsH[dp.stem]}(${GZ.elementNames[se]})은 내 사주에 필요한 기운이에요 · ${N[stemGod]}`, score: 2 });
  else if (burden.has(se)) factors.push({ text: `오늘의 천간 ${GZ.stemsH[dp.stem]}(${GZ.elementNames[se]})은 ${a.strengthLabel}한 일간에게 부담이 되는 기운이에요 · ${N[stemGod]}`, score: -1 });
  else factors.push({ text: `오늘의 천간은 ${N[stemGod]}의 기운이에요`, score: 0 });
  const be = GZ.branchElement[dp.branch];
  if (helpful.has(be)) factors.push({ text: `오늘의 지지 ${GZ.branchesH[dp.branch]}(${GZ.elementNames[be]})가 필요한 기운을 받쳐 줘요`, score: 1 });
  else if (burden.has(be)) factors.push({ text: `오늘의 지지 ${GZ.branchesH[dp.branch]}(${GZ.elementNames[be]})는 부담이 되는 기운이에요`, score: -0.5 });

  const natal = [['일지', c.day.branch, 1.5], ['월지', c.month.branch, 1.0], ['년지', c.year.branch, 0.7]].concat(c.hour ? [['시지', c.hour.branch, 0.7]] : []);
  for (const [pos, b, w] of natal) {
    for (const r of Relations.branches(dp.branch, b)) {
      let s, note;
      switch (r.kind) {
        case 'yukhap': s = 1.5 * w; note = '조화와 인연이 생겨요'; break;
        case 'samhap': s = 1.0 * w; note = '힘을 모아 주는 관계예요'; break;
        case 'chung': s = -2.0 * w; note = pos === '일지' ? '몸과 가까운 관계에 변동이 생기기 쉬워요' : '계획이 흔들리거나 이동·변화가 생기기 쉬워요'; break;
        case 'hyeong': s = -0.8 * w; note = '마찰·실수·서류 문제를 조심하세요'; break;
        case 'pa': s = -0.5 * w; note = '일이 어긋나거나 깨지기 쉬워요'; break;
        case 'hae': s = -0.5 * w; note = '서운함이나 오해가 생기기 쉬워요'; break;
        default: continue;
      }
      factors.push({ text: `오늘 ${GZ.branchesH[dp.branch]}와 내 ${pos} ${GZ.branchesH[b]}가 ${r.name} · ${note}`, score: s });
    }
  }
  for (const r of Relations.stems(dp.stem, ds)) {
    if (r.kind === 'stemHap') factors.push({ text: '오늘 천간이 내 일간과 합 · 마음이 묶이는 인연, 약속이 생기기 쉬워요', score: 1 });
    if (r.kind === 'stemChung') factors.push({ text: '오늘 천간이 내 일간과 충 · 생각이 부딪히고 마음이 바빠요', score: -1 });
  }
  const energy = TwelveStage.energy(stage);
  if (energy !== 0) factors.push({ text: `내 일간이 오늘 ${TwelveStage.names[stage]}의 자리 · ` + (energy > 0 ? '기운이 차오르는 흐름' : '기운이 가라앉는 흐름, 무리하지 마세요'), score: energy });
  if (Sinsal.cheoneul[ds].includes(dp.branch)) factors.push({ text: '오늘은 천을귀인의 날 · 도움을 주는 사람이 나타나기 쉬워요', score: 1.5 });
  if (Sinsal.munchang[ds] === dp.branch) factors.push({ text: '오늘은 문창귀인의 날 · 공부·글·기획에 좋아요', score: 0.5 });
  const g0 = Sinsal.group(c.day.branch);
  if (Sinsal.dohwa[g0] === dp.branch) factors.push({ text: '오늘은 도화의 날 · 매력이 돋보이고 사람이 모여요', score: 0 });
  if (Sinsal.yeokma[g0] === dp.branch) factors.push({ text: '오늘은 역마의 날 · 이동·외출·출장이 생기기 쉬워요', score: 0 });

  const score = factors.reduce((s, f) => s + f.score, 0);
  const [grade, stars] = score >= 4 ? ['대길', 5] : score >= 2 ? ['길', 4] : score >= -0.7 ? ['평', 3] : score >= -3.0 ? ['주의', 2] : ['흉', 1];
  const clamp = (x) => Math.max(1, Math.min(5, roundHalfAway(x)));
  const chungDay = factors.some((f) => f.text.includes('일지') && f.score < -1);
  const harmony = factors.filter((f) => f.text.includes('합') && f.score > 0).length;
  const gods = [TenGod.group(stemGod), TenGod.group(branchGod)];
  const areas = [
    { name: '재물', stars: clamp(3 + (gods.includes(2) ? 1 : 0) + (gods.includes(0) && stemGod === 1 ? -1 : 0) + score * 0.2), note: gods.includes(2) ? '돈이 움직이는 날' : stemGod === 1 ? '지출 조심' : '평소처럼 관리', detail: '' },
  ];
  const lucky = a.helpfulElements.length ? a.helpfulElements[0] : be;
  const hrs = [];
  for (const [x, y] of Relations.yukhapPairs) { if (x === dp.branch) hrs.push(y); else if (y === dp.branch) hrs.push(x); }
  for (const [g, ] of Relations.samhapGroups) if (g.includes(dp.branch)) hrs.push(...g.filter((v) => v !== dp.branch));
  const luckyHours = [...new Set(hrs)].sort((p, q) => p - q);
  const headline = { 대길: '기운이 활짝 열린 날이에요. 미뤄 둔 중요한 일을 꺼내 보세요.', 길: '흐름이 순하게 도와주는 날이에요.', 평: '크게 들뜨지도 가라앉지도 않는 날. 할 일을 차분히 해 나가면 돼요.', 주의: '작은 마찰이 생기기 쉬운 날이에요. 속도를 조금 늦추세요.' }[grade] || '부딪히는 기운이 강한 날이에요. 큰 결정은 미루고 몸과 마음을 아끼세요.';

  const f = { date: [year, month, day], dayPillar: dp, monthPillar: mp, yearPillar: yp, stemGod, branchGod, stage, score, grade, stars, factors, areas, luckyElement: lucky, luckyHours, headline, meaning: P.meanings[stemGod] };
  enrich(f, c, a);
  return f;
}

// ───────────────────────── 조합형 풀이 (맥 버전 Reading.swift)

const positionMeaning = { 일지: '나와 가장 가까운 사람·몸', 월지: '일터·사회생활', 년지: '집안·윗사람', 시지: '아랫사람·앞으로의 계획' };
const hourShort = ['혼자 집중', '경쟁·지출 주의', '먹고 쉬기·창작', '아이디어·말조심', '사람·돈이 움직임', '정리·정산', '압박·체력 관리', '공식 업무', '생각·공부', '도움·휴식'];
const organs = ['간·눈·근육', '심장·혈액순환', '위장·소화', '폐·호흡기·피부', '신장·방광·허리'];

function enrich(f, c, a) {
  const dn = KCal.dayNumber(...f.date);
  const ds = c.dayStem, dp = f.dayPillar;
  const stemOcc = trunc(dn / 10), branchOcc = trunc(dn / 12);
  const sKey = dp.stem, bKey = dp.branch;
  const N = TenGod.names;
  const helpful = new Set(a.helpfulElements);
  const burden = new Set(a.strengthLabel === '신약' ? [TenGod.element(3, ds), TenGod.element(2, ds)] : a.strengthLabel === '신강' ? [TenGod.element(0, ds), TenGod.element(4, ds)] : []);

  const natal = [['일지', c.day.branch], ['월지', c.month.branch], ['년지', c.year.branch]].concat(c.hour ? [['시지', c.hour.branch]] : []);
  const rels = [];
  for (const [pos, b] of natal) for (const r of Relations.branches(dp.branch, b)) rels.push([pos, r]);
  const posHas = (pos, kinds) => rels.some(([p, r]) => p === pos && kinds.includes(r.kind));
  const dayChung = posHas('일지', ['chung']);
  const dayHap = posHas('일지', ['yukhap', 'samhap']);
  const dayFriction = posHas('일지', ['hyeong', 'pa', 'hae']);
  const monthChung = posHas('월지', ['chung']);
  const g = Sinsal.group(c.day.branch);
  const isDohwa = Sinsal.dohwa[g] === dp.branch, isYeokma = Sinsal.yeokma[g] === dp.branch, isGwiin = Sinsal.cheoneul[ds].includes(dp.branch);

  const nap = P.napeum[trunc(dp.index60 / 2)];
  f.daySymbol = `${dp.hanja}(${dp.hangul})일 — ${josa(P.stemImage[dp.stem], '과', '와')} ${GZ.animals[dp.branch]}의 날이에요. 납음으로는 ${nap[0]}(${nap[1]}), ${nap[2]}`;

  let p1 = deckPick(P.summaries[f.stemGod], 100 + sKey, stemOcc);
  p1 += ' ' + deckPick(P.basis[f.branchGod], 200 + bKey, branchOcc);
  if (f.stemGod === f.branchGod) p1 += ' 천간과 지지가 같은 기운이라 이 흐름이 하루 내내 진하게 이어져요.';
  else if (TenGod.group(f.stemGod) === TenGod.group(f.branchGod)) p1 += ' 겉과 속이 비슷한 결이라 마음먹은 대로 움직이기 쉬워요.';

  const noon = KCal.instant(...f.date, 12, 0);
  const lon = Astro.sunLongitude(noon);
  const termIdx = trunc(lon / 15) % 24;
  const termStart = Astro.previousLongitude(noon, 15)[0];
  const daysIntoTerm = trunc((noon - termStart) / 86400);
  const ctx = [`지금은 ${P.termNames[termIdx]} ${daysIntoTerm === 0 ? '당일' : '무렵'}이에요. ` + P.termText[termIdx]];
  const mp = f.monthPillar;
  const me = GZ.stemElement(ds), se = GZ.branchElement[mp.branch];
  const monthGod = TenGod.of(ds, mp.stem);
  const seasonNote = (se === me || (se + 1) % 5 === me) ? '계절 기운이 내 일간을 도와 힘이 실리는 때예요.'
    : (se + 2) % 5 === me ? '계절 기운이 내 일간을 누르는 때라 체력 관리에 신경 쓰세요.'
    : (me + 1) % 5 === se ? '내 기운을 밖으로 쓰는 계절이라 결과물을 내기 좋아요.' : '계절 기운을 내가 다스리는 때라 실속을 챙기기 좋아요.';
  const monthRels = Relations.branches(dp.branch, mp.branch).concat(Relations.stems(dp.stem, mp.stem));
  const justEntered = Astro.previousLongitude(noon, 30, 315)[0];
  if (noon - justEntered < 3 * 86400) ctx.push(`이번 달(${mp.hanja}월)은 나에게 ${N[monthGod]}의 흐름 — ${P.meanings[monthGod].keyword}이에요. ` + seasonNote);
  else if (dn % 4 === 0) ctx.push(seasonNote);
  const mr = monthRels.find((r) => ['samhap', 'yukhap', 'chung', 'stemHap', 'stemChung'].includes(r.kind));
  if (mr) ctx.push(mr.harmony ? `오늘 일진은 이번 달 기운(${mp.hanja})과 ${mr.name}이라 달의 흐름을 타기 좋아요.` : `오늘 일진은 이번 달 기운(${mp.hanja})과 ${mr.name}이라 계획이 틀어지기 쉬워요. 여유를 두세요.`);
  const yp = f.yearPillar;
  for (const r of Relations.branches(dp.branch, yp.branch)) {
    if (r.kind === 'chung') ctx.push(`올해의 기운(${yp.hanja})과 오늘 일진이 충이에요. 큰 흐름과 엇갈리는 날이니 무리한 변화는 피하세요.`);
    else if (r.kind === 'yukhap' || r.kind === 'samhap') ctx.push(`올해의 기운(${yp.hanja})과 오늘 일진이 ${r.name}이라 큰 흐름에 올라타기 좋아요.`);
  }
  const age = (noon - c.instant) / (365.2425 * 86400);
  const cur = a.daeun.filter((d) => d.startAge <= age).pop();
  if (cur) for (const r of Relations.branches(dp.branch, cur.pillar.branch)) {
    if (r.kind === 'chung') ctx.push(`지금 대운(${cur.pillar.hanja})과 오늘 일진이 충이라, 요즘 흐름에 작은 흔들림이 오는 날이에요.`);
    else if (r.kind === 'yukhap') ctx.push(`지금 대운(${cur.pillar.hanja})과 오늘 일진이 합이라, 요즘 흐름에 힘이 보태지는 날이에요.`);
  }
  const l = KCal.lunarDate(dn);
  if (l) {
    const len = KCal.lunarMonthLength(l.year, l.month, l.leap) ?? 30;
    if (l.day === 1) ctx.push('음력 초하루예요. 새 달이 시작되니 작은 다짐을 해 보세요.');
    if (l.day === 15) ctx.push('음력 보름이에요. 달이 가득 차듯 마음도 넉넉해지는 날이에요.');
    if (l.day === len) ctx.push('음력 그믐이에요. 한 달을 정리하고 비우기 좋은 날이에요.');
  }
  const p3 = `내 일간이 오늘 ${TwelveStage.names[f.stage]}의 자리에 있어요. ` + deckPick(P.stages[f.stage], 300 + bKey, branchOcc);
  let p4 = rels.length === 0
    ? deckPick(['오늘 일진은 내 사주의 지지와 크게 부딪히거나 묶이지 않아 흐름이 무난해요.', '내 사주와 특별히 엉키는 글자가 없어서 평소 페이스대로 가면 되는 날이에요.', '원국과 걸리는 글자가 없어 조용히 흘러가는 날이에요. 하던 일을 이어 가세요.'], 400 + bKey, branchOcc)
    : rels.slice(0, 2).map(([pos, r], i) => {
      const pool = P.relationEffect[['yukhap', 'samhap', 'chung', 'hyeong', 'pa', 'hae'].includes(r.kind) ? r.kind : 'other'];
      return `오늘의 ${GZ.branchesH[dp.branch]}와 내 ${pos}(${positionMeaning[pos]})가 ${r.name}이라 ${deckPick(pool, 500 + bKey * 10 + i, branchOcc)}.`;
    }).join(' ');
  if (isGwiin) p4 += ' 게다가 천을귀인이 드는 날이라 막힌 일에 도와줄 사람이 나타나기 쉬워요.';
  const le = f.luckyElement, EN = GZ.elementNames, EH = GZ.elementHanja, LK = P.luck;
  const p5 = deckPick([
    `행운의 기운은 ${EN[le]}(${EH[le]})이에요. ${LK.colors[le]} 계열 옷이나 소품을 곁에 두고, ${LK.directions[le]}으로 움직이면 도움이 돼요.`,
    `오늘은 ${EN[le]}(${EH[le]}) 기운을 채우면 좋아요. ${LK.foods[le]} 쪽 음식, ${LK.colors[le]} 계열 색이 행운을 불러요.`,
    `부족한 ${EN[le]}(${EH[le]}) 기운을 보태면 균형이 잡혀요. 숫자 ${LK.numbers[le]}, 방향은 ${LK.directions[le]}이에요.`,
  ], 600, dn);
  f.reading = [p1, ctx.join(' '), p3, p4, p5];

  f.goodTips = [deckPick(P.good[f.stemGod], 700 + sKey, stemOcc), deckPick(P.tips[f.branchGod], 800 + bKey, branchOcc)];
  const cautions = [deckPick(P.caution[f.stemGod], 900 + sKey, stemOcc)];
  if (dayChung) cautions.push('가까운 사람과 말이 부딪히기 쉬워요. 감정이 오를 땐 대답을 한 박자 늦추세요.');
  if (monthChung) cautions.push('일정·업무에 갑작스러운 변경이 생길 수 있어요. 여유 시간을 두세요.');
  if (dayFriction && !dayChung) cautions.push('사소한 오해가 생기기 쉬워요. 메시지는 짧고 분명하게.');
  f.cautionTips = cautions;

  f.mission = deckPick(P.missions[f.stemGod], 1000 + sKey, stemOcc);
  const luckEl = a.helpfulElements.length ? a.helpfulElements[dn % a.helpfulElements.length] : le;
  f.luckAction = deckPick(P.luckActions[luckEl], 1100 + luckEl, trunc(dn / Math.max(1, a.helpfulElements.length)));
  f.question = deckPick(P.questions[TenGod.group(f.stemGod)], 1200 + TenGod.group(f.stemGod), stemOcc * 2 + dp.stem % 2);

  const gods = [f.stemGod, f.branchGod], groups = gods.map(TenGod.group);
  const loveGroup = c.birth.isMale ? 2 : 3;
  const energy = TwelveStage.energy(f.stage);
  const clamp = (x) => Math.max(1, Math.min(5, roundHalfAway(x)));
  const calm = (opts, key) => deckPick(opts, key, trunc(dn / 3));
  // 십신 번호: 0 비견 1 겁재 2 식신 3 상관 4 편재 5 정재 6 편관 7 정관 8 편인 9 정인
  let love = 3; const loveN = [];
  if (groups.includes(loveGroup)) { love += 1; loveN.push(c.birth.isMale ? '재성이 들어와 이성의 기운이 가까워져요.' : '관성이 들어와 이성의 기운이 가까워져요.'); }
  if (dayHap) { love += 1; loveN.push('배우자 자리(일지)와 합이 되어 연인·가까운 사람과 마음이 잘 맞아요.'); }
  if (isDohwa) { love += 0.5; loveN.push('도화의 날이라 매력이 돋보이고 새로운 만남이 생기기 쉬워요.'); }
  if (dayChung) { love -= 1.5; loveN.push('배우자 자리(일지)와 충이라 다툼이나 거리감이 생기기 쉬워요.'); }
  if (dayFriction) { love -= 0.5; loveN.push('일지와 형·파·해가 있어 사소한 서운함을 조심하세요.'); }
  if (!c.birth.isMale && gods.includes(3)) { love -= 0.5; loveN.push('상관의 기운이라 연인에게 말이 날카로워질 수 있어요.'); }
  if (c.birth.isMale && gods.includes(1)) { love -= 0.5; loveN.push('겁재의 기운이라 경쟁자나 질투가 끼어들 수 있어요.'); }
  if (!loveN.length) loveN.push(calm(['관계운은 잔잔한 날이에요. 먼저 안부를 건네면 분위기가 좋아져요.', '큰 변화 없이 평온한 관계운이에요. 작은 배려가 오래 남아요.', '관계에 큰 파도는 없어요. 함께 밥 한 끼가 좋은 시간이 돼요.', '조용한 관계운이에요. 오래된 인연을 챙기기 좋아요.'], 1300));

  let money = 3; const moneyN = [];
  if (gods.includes(5)) { money += 1; moneyN.push('정재의 기운이라 고정 수입·정산·절약에 좋은 날이에요.'); }
  if (gods.includes(4)) { money += 0.8; moneyN.push('편재의 기운이라 큰돈이 오가거나 부수입 기회가 생겨요. 대신 씀씀이도 커져요.'); }
  if (groups.includes(1)) { money += 0.5; moneyN.push('식상의 기운이 재물을 낳는 흐름이라, 내 재주로 만든 결과물이 돈이 되기 쉬워요.'); }
  if (gods.includes(1)) { money -= 1; moneyN.push('겁재의 기운이라 돈이 새기 쉬워요. 빌려주거나 보증 서는 일은 피하세요.'); }
  if (gods.includes(0)) { money -= 0.3; moneyN.push('비견의 기운이라 함께 나눠 쓰는 돈이 생기기 쉬워요.'); }
  if (groups.includes(2) && a.strengthLabel === '신약') { money -= 0.5; moneyN.push('다만 일간이 약한 편이라 큰 재물은 부담이 될 수 있어요. 무리한 투자는 피하세요.'); }
  if (!moneyN.length) moneyN.push(calm(['재물 흐름은 평소와 비슷해요. 계획한 지출만 하면 무난해요.', '돈 문제로 크게 움직일 일은 없는 날이에요. 지출 기록을 정리해 보세요.', '금전운은 잔잔해요. 새는 돈이 없는지 살펴보기 좋아요.', '큰 수입도 지출도 없는 날이에요. 작은 저축을 해 보세요.'], 1400));

  let work = 3 + energy * 0.8; const workN = [];
  if (gods.includes(7)) { work += 1; workN.push('정관의 기운이라 공식적인 일과 평가에서 인정받기 좋아요.'); }
  if (gods.includes(6)) { work += 0.3; workN.push('편관의 기운이라 책임과 압박이 큰 일을 맡기 쉬워요. 버텨 내면 실력이 늘어요.'); }
  if (gods.includes(2)) { work += 0.8; workN.push('식신의 기운이라 꾸준히 결과물을 만들어 내기 좋아요.'); }
  if (gods.includes(3)) { work += 0.3; workN.push('상관의 기운이라 아이디어는 빛나지만 윗사람과 의견 충돌을 조심하세요.'); }
  if (groups.includes(4)) { work += 0.8; workN.push('인성의 기운이라 공부·자격·서류 작업에 집중이 잘 돼요.'); }
  if (gods.includes(1)) workN.push('겁재의 기운이라 경쟁 상황에서 승부욕이 살아나요.');
  if (monthChung) { work -= 1; workN.push('일터 자리(월지)와 충이라 일정 변경이나 자리 이동이 생기기 쉬워요.'); }
  if (!workN.length) workN.push(calm(['하던 일을 차근차근 이어 가기 좋은 날이에요.', '새 일보다 진행 중인 일을 다듬기 좋은 날이에요.', '무리 없이 흘러가는 업무운이에요. 작은 개선 하나를 해 보세요.'], 1500));
  if (energy > 0) workN.push('기운이 차 있어 밀린 일을 처리하기 좋아요.'); else if (energy < 0) workN.push('기운이 가라앉아 있으니 중요한 일은 오전에 끝내 두세요.');

  const myEl = GZ.stemElement(ds);
  let health = 3 + energy; const healthN = [];
  if (groups.includes(3)) { health -= 0.7; healthN.push(`나를 누르는 관성의 기운이 들어와 피로가 쌓이기 쉬워요. 전통적으로 ${EN[myEl]} 기운과 연결된 ${organs[myEl]} 쪽을 챙기라고 봐요.`); }
  if (dayChung) { health -= 1; healthN.push('일지와 충이라 몸 컨디션에 기복이 있을 수 있어요. 이동 중 안전에도 신경 쓰세요.'); }
  if (groups.includes(4)) { health += 0.5; healthN.push('인성의 기운이라 쉬면 회복이 잘 되는 날이에요.'); }
  if (isYeokma) healthN.push('역마의 날이라 몸이 바빠져요. 수분과 휴식을 챙기세요.');
  if (energy < 0) healthN.push(`12운성이 ${TwelveStage.names[f.stage]}이라 체력을 아껴 쓰는 게 좋아요.`);
  if (!healthN.length) healthN.push(calm(['컨디션은 무난해요. 평소 리듬을 지키면 충분해요.', '몸 상태가 안정적인 날이에요. 가벼운 산책을 더해 보세요.', '특별히 무리만 하지 않으면 좋은 컨디션이 이어져요.'], 1600));

  const area = (name, v, hi, mid, lo, notes) => { const st = clamp(v); return { name, stars: st, note: st >= 4 ? hi : st <= 2 ? lo : mid, detail: notes.join(' ') }; };
  f.areas = [
    area('애정·관계', love, '인연이 닿음', '잔잔함', '말 조심', loveN),
    area('금전', money, '돈이 움직임', '무난', '지출 조심', moneyN),
    area('일·공부', work, '성과 내기 좋음', '꾸준히', '속도 조절', workN),
    area('건강', health, '기운 좋음', '보통', '충분히 쉬기', healthN),
  ];

  const shift = c.birth.correction === 0 ? 0 : Math.min(60, Math.max(0, trunc((135.0 - c.birth.longitude) * 4)));
  const hm = (m) => { const x = ((m % 1440) + 1440) % 1440; return String(trunc(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };
  f.hours = [];
  for (let hb = 0; hb < 12; hb++) {
    const hs = ((dp.stem % 5) * 2 + hb) % 10;
    const god = TenGod.of(ds, hs);
    let score = 0; const tags = [];
    const e = GZ.stemElement(hs);
    if (helpful.has(e)) score += 1; else if (burden.has(e)) score -= 0.7;
    if (helpful.has(GZ.branchElement[hb])) score += 0.5;
    for (const r of Relations.branches(hb, c.day.branch)) {
      if (r.kind === 'yukhap' || r.kind === 'samhap') { score += 1; tags.push('일지와 합'); }
      else if (r.kind === 'chung') { score -= 1.5; tags.push('일지와 충'); }
      else if (['hyeong', 'pa', 'hae'].includes(r.kind)) score -= 0.5;
    }
    if (Relations.branches(hb, dp.branch).some((r) => r.kind === 'chung')) { score -= 0.5; tags.push('일진과 충'); }
    if (Sinsal.cheoneul[ds].includes(hb)) { score += 1; tags.push('귀인'); }
    const start = hb * 120 - 60 + shift;
    f.hours.push({ branch: hb, pillar: new Pillar(hs, hb), god, score, label: score >= 1.5 ? '좋음' : score <= -1 ? '조심' : '보통', note: [hourShort[god], ...tags].join(' · '), range: `${hm(start)}–${hm(start + 120)}` });
  }
}
