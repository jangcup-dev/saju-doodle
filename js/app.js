// 사주낙서 웹 화면. 모든 계산은 이 기기 안에서, 정보는 이 브라우저(localStorage)에만 저장.
import { SajuCalc, analyze, daily, KCal, GZ, TenGod, TwelveStage, Relations, TimeCorrection, JasiMode, defaultBirth } from './engine.js';
import { meanings, luck } from './phrases.js';
import * as K from './keep.js';

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('saju.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('saju.' + k, JSON.stringify(v)); } catch { /* 저장 불가(사생활 보호 모드 등) */ } },
};
const PLACES = [['서울', 126.978], ['인천', 126.705], ['수원', 127.029], ['성남', 127.138], ['고양', 126.832], ['용인', 127.178], ['춘천', 127.730], ['원주', 127.920], ['강릉', 128.876], ['청주', 127.489], ['천안', 127.114], ['대전', 127.385], ['세종', 127.289], ['전주', 127.148], ['광주', 126.852], ['목포', 126.392], ['여수', 127.662], ['대구', 128.601], ['안동', 128.729], ['포항', 129.343], ['구미', 128.344], ['울산', 129.311], ['부산', 129.075], ['창원', 128.681], ['진주', 128.108], ['제주', 126.531], ['서귀포', 126.560]];

function today() { const p = KCal.seoulParts(Date.now() / 1000); return [p.year, p.month, p.day]; }
const dn = (d) => KCal.dayNumber(d[0], d[1], d[2]);
const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

// 검증용 주소 옵션: ?demo=1&section=chart&expand=풀이,시간
const qs = new URLSearchParams(location.search);
const demo = qs.get('demo') ? Object.assign(defaultBirth(), { name: '예시', year: 1993, month: 8, day: 21, hour: 14, minute: 30, isMale: false }) : null;

async function keepOnDevice() { if (demo || !S.profile) return; S.persisted = await K.requestPersist(); }
const S = {
  profile: qs.get('empty') ? null : demo || store.get('profile', null),
  draft: null, editing: false,
  section: qs.get('section') || 'today',
  day: today(), month: today().slice(0, 2),
  expanded: new Set(qs.get('expand') ? qs.get('expand').split(',') : store.get('expanded', ['풀이'])),
  done: new Set(store.get('done', [])),
  sheet: null, error: null, cache: null, persisted: null,
};

function chart() {
  if (!S.profile) return null;
  const key = JSON.stringify(S.profile);
  if (S.cache && S.cache.key === key) return S.cache.v;
  try { const c = SajuCalc.chart(S.profile); S.cache = { key, v: [c, analyze(c)] }; return S.cache.v; } catch { return null; }
}

// ───────── 작은 부품

const DATE_W = ['월', '화', '수', '목', '금', '토', '일'];
const dateTitle = (d) => `${d[1]}월 ${d[2]}일 ${DATE_W[((dn(d) % 7) + 7) % 7]}요일`;
const lunarText = (d) => { const l = KCal.lunarDate(dn(d)); return l ? `음력 ${l.leap ? '윤' : ''}${l.month}월 ${l.day}일` : ''; };
const gradeColor = (s) => `var(--g${Math.max(1, Math.min(5, s))})`;
const sparkle = (fill) => `<svg viewBox="0 0 20 20"><path d="M10 1 Q11.2 8.8 19 10 Q11.2 11.2 10 19 Q8.8 11.2 1 10 Q8.8 8.8 10 1Z" fill="${fill}" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
const stars = (n, sm) => `<span class="stars${sm ? ' sm' : ''}" role="img" aria-label="별 5개 중 ${n}개">${[0, 1, 2, 3, 4].map((i) => sparkle(i < n ? 'var(--orange)' : 'none')).join('')}</span>`;
const ch = (h, k, el, size = '', act = '') => `<${act ? 'button' : 'div'} class="ch el${el} ${size}" ${act} aria-label="${h}(${k}) ${GZ.elementNames[el]}"><span class="h serif">${h}</span><span class="k">${k} · ${GZ.elementNames[el]}</span></${act ? 'button' : 'div'}>`;
const stemCh = (s, size, act) => ch(GZ.stemsH[s], GZ.stemsK[s], GZ.stemElement(s), size, act);
const branchCh = (b, size, act) => ch(GZ.branchesH[b], GZ.branchesK[b], GZ.branchElement[b], size, act);
const chip = (t, bg) => `<span class="chip" style="background:${bg}">${esc(t)}</span>`;
const stamp = (g) => `<div class="stamp" role="img" aria-label="운세 ${g}"><svg viewBox="0 0 72 72"><path d="M36 4 C56 3 69 17 68 36 C67 55 54 68 35 68 C16 67 3 55 4 36 C5 17 17 5 36 4Z" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M36 10 C51 10 62 21 62 36 C61 51 51 62 36 62 C21 61 10 51 10 36 C11 21 21 10 36 10Z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg><b class="${g.length === 1 ? 'one' : ''}">${g}</b></div>`;
const fold = (key, title, sub, icon, body, cls = '', bg = '') =>
  `<section class="st fold ${cls} ${S.expanded.has(key) ? 'open' : ''}" ${bg ? `style="background:${bg}"` : ''}>
    <button class="fh" data-act="fold" data-key="${key}" aria-expanded="${S.expanded.has(key)}"><span class="ic">${icon}</span><span class="ft hand">${esc(title)}</span><span class="fs">${esc(sub || '')}</span><span class="ar">${S.expanded.has(key) ? '▾' : '▸'}</span></button>
    <div class="fb">${S.expanded.has(key) ? body() : ''}</div></section>`;

// ───────── 화면들

function renderToday(c, a) {
  const f = daily(c, a, ...S.day);
  const m = f.meaning, le = f.luckyElement;
  const d = dn(S.day), start = d - (((d % 7) + 1) % 7), td = dn(today());
  const week = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const y = KCal.ymd(start + i), fw = daily(c, a, ...y), on = start + i === d;
    return `<button class="day ${on ? 'on' : ''}" data-act="day" data-d="${y.join('-')}" aria-label="${y[1]}월 ${y[2]}일 ${fw.grade}${start + i === td ? ', 오늘' : ''}" aria-pressed="${on}">
      <span class="wd ${i === 0 ? 'sun' : ''}">${'일월화수목금토'[i]}</span><span class="num hand">${y[2]}</span><span class="dot" style="background:${gradeColor(fw.stars)}"></span>${start + i === td && !on ? '<span class="today">오늘</span>' : ''}</button>`;
  }).join('');
  const best = f.hours.reduce((p, h) => (h.score > p.score ? h : p), f.hours[0]);
  const doneKey = f.date.join('-'), done = S.done.has(doneKey);
  const good = f.hours.filter((h) => h.label === '좋음').map((h) => GZ.branchesK[h.branch] + '시');
  const nowB = (() => { const shift = c.birth.correction === 0 ? 0 : Math.trunc((135 - c.birth.longitude) * 4); const p = KCal.seoulParts(Date.now() / 1000 - shift * 60); return Math.trunc((p.hour * 60 + p.minute + 60) / 120) % 12; })();
  const isToday = same(S.day, today());

  return `<div class="gap">
    <div>
      <div class="week" id="swipe-week">
        <button class="iconbtn" data-act="move" data-n="-7" aria-label="지난주"><span class="st w2">‹</span></button>
        <div class="days">${week}</div>
        <button class="iconbtn" data-act="move" data-n="7" aria-label="다음 주"><span class="st w3">›</span></button>
      </div>
      ${isToday ? '' : '<button class="st bg-peach pastel back-today" data-act="today">오늘로 돌아가기</button>'}
    </div>

    <article class="st slip" aria-label="오늘의 운세">
      <span class="spark">✦</span>${stamp(f.grade)}
      <div class="date">${dateTitle(f.date)} · ${lunarText(f.date)}</div>
      <div class="chars">${stemCh(f.dayPillar.stem)}${branchCh(f.dayPillar.branch)}</div>
      <div class="who">${f.dayPillar.hangul}일 · 나에게는 ${TenGod.names[f.stemGod]}(${TenGod.hanja[f.stemGod]})의 날</div>
      <div class="kw hand">${esc(m.keyword)}</div>
      ${stars(f.stars)}
      <div class="head">${esc(f.headline)}</div>
    </article>

    <div class="quick">
      <div class="st el${le}"><div class="t">🎨 행운 색</div><div class="v">${luck.colors[le]}</div></div>
      <div class="st w2 el${le}"><div class="t">🧭 방향</div><div class="v">${luck.directions[le]}</div></div>
      <div class="st w3 el${le}"><div class="t">🕰 좋은 시간</div><div class="v">${GZ.branchesK[best.branch]}시 ${best.range.slice(0, 5)}</div></div>
    </div>

    <section class="st mission">
      <div class="row">
        <button class="check ${done ? 'on' : ''}" data-act="done" data-key="${doneKey}" role="checkbox" aria-checked="${done}" aria-label="오늘의 한 걸음 해냈어요"><span>${done ? '✓' : ''}</span></button>
        <div class="grow"><div class="tiny" style="font-weight:600;opacity:.65">오늘의 한 걸음 · ${TenGod.names[f.stemGod]}의 날에 어울리는 것</div><div class="m hand ${done ? 'done' : ''}">${esc(f.mission)}</div></div>
      </div>
      <div class="squiggle"></div>
      <div class="tiny" style="font-weight:600;opacity:.6">💬 자기 전에 생각해 볼 질문</div>
      <div style="font-weight:500">${esc(f.question)}</div>
    </section>

    ${fold('풀이', '오늘의 풀이', m.keyword, '📖', () => `
      <div class="symbol serif">✷ ${esc(f.daySymbol)}</div>
      ${f.reading.map((p, i) => `<p class="para ${i === 0 ? 'first' : ''}">${esc(p)}</p>`).join('')}
      <div class="st bg-mint tip"><b>👍 이런 일에 좋아요</b><ul>${f.goodTips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <div class="st w2 bg-pink tip"><b>⚠️ 이건 조심해요</b><ul>${f.cautionTips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`)}

    ${fold('분야', '분야별 운', f.areas.map((x) => `${x.name.split('·')[0]} ${x.stars}`).join(' · '), '⭐', () => f.areas.map((x, i) => `
      <div class="area"><div class="row"><span style="width:20px">${['💗', '💰', '💼', '🌿'][i]}</span><b>${x.name}</b>${stars(x.stars, true)}<span class="grow"></span><span class="small soft" style="font-weight:600">${x.note}</span></div>
      <div class="ad">${esc(x.detail)}</div></div>`).join(''))}

    ${fold('시간', '시간대별 운세', good.length ? '좋은 시간 ' + good.slice(0, 3).join('·') : '무난한 하루', '🕰', () => f.hours.map((h) => {
      const now = isToday && h.branch === nowB;
      return `<div class="hour ${now ? 'now' : ''}"><div class="row"><span class="hn hand">${GZ.branchesK[h.branch]}시</span><span class="hr">${h.range}</span><b class="serif">${h.pillar.hanja}</b>${now ? '<span class="pill" style="background:rgba(224,83,61,.25)">지금</span>' : ''}<span class="grow"></span><span class="pill" style="background:${h.label === '좋음' ? 'var(--mint)' : h.label === '조심' ? 'var(--pink)' : '#EDE8DF'}">${h.label}</span></div><div class="note">${esc(h.note)}</div></div>`;
    }).join('') + `<p class="tiny soft">${c.birth.correction === 0 ? '시간은 표준시 기준이에요.' : '시간은 태어난 곳의 경도로 보정한 기준이에요 (서울은 약 32분 늦게 시작).'}</p>`)}

    ${fold('행운', '행운 더 보기', `${GZ.elementNames[le]}(${GZ.elementHanja[le]}) 기운`, '✨', () => `
      ${[['색', luck.colors[le]], ['방향', luck.directions[le]], ['숫자', luck.numbers[le]], ['음식', luck.foods[le]], ['행운 행동', f.luckAction]].map(([t, v]) => `<div class="row" style="align-items:flex-start"><b style="width:72px;flex:none">${t}</b><span>${esc(v)}</span></div>`).join('')}
      <p class="tiny" style="opacity:.6">내 사주에 보완하면 좋은 오행을 기준으로 골랐어요.</p>`, 'pastel', `var(--${['wood', 'fire', 'earth', 'metal', 'water'][le]})`)}

    ${fold('근거', '왜 이렇게 나왔나요?', `점수 ${f.score >= 0 ? '+' : ''}${f.score.toFixed(1)}`, '🔍', () => f.factors.map((x) => `<div class="factor"><b style="color:${x.score > 0 ? 'var(--green)' : x.score < 0 ? 'var(--red)' : 'var(--ink-soft)'}">${x.score > 0 ? '+' : x.score < 0 ? '−' : '·'}</b><span>${esc(x.text)}</span></div>`).join('') +
      `<p class="tiny soft">내 사주 ${a.strengthLabel} · 보완 오행 ${a.helpfulElements.map((e) => GZ.elementNames[e]).join('·')}. 명리학의 전통 규칙(십신, 합·충·형·파·해, 12운성, 신살)으로 계산했어요. 재미와 참고용으로 봐 주세요.</p>`)}

    ${fold('흐름', '올해 · 이번 달', `${f.yearPillar.hangul}년 · ${f.monthPillar.hangul}월`, '🗓', () => [[`올해 ${f.yearPillar.hanja}`, TenGod.of(c.dayStem, f.yearPillar.stem), 'lilac'], [`이번 달 ${f.monthPillar.hanja}`, TenGod.of(c.dayStem, f.monthPillar.stem), 'sky']].map(([t, g, bg]) =>
      `<div class="st bg-${bg} tip"><div class="tiny" style="font-weight:600;opacity:.65">${t}</div><div class="hand" style="font-size:24px">${TenGod.names[g]} · ${esc(meanings[g].keyword)}</div><div class="small" style="opacity:.75">${esc(meanings[g].summary.replace(/날이에요/g, '시기예요'))}</div></div>`).join(''))}
  </div>`;
}

function renderChart(c, a) {
  const b = c.birth, s = c.solarDate;
  const line = [`양력 ${s[0]}.${s[1]}.${s[2]}`, b.isLunar ? `(음력 ${b.leapMonth ? '윤' : ''}${b.month}.${b.day})` : '',
    b.timeKnown ? `${String(b.hour).padStart(2, '0')}:${String(b.minute).padStart(2, '0')}` : '· 시간 모름',
    b.timeKnown && b.correction !== 0 ? `→ ${String(c.localTime[3]).padStart(2, '0')}:${String(c.localTime[4]).padStart(2, '0')} (${c.correctionMinutes >= 0 ? '+' : ''}${Math.round(c.correctionMinutes)}분 보정)` : '',
    c.wasDST ? '· 서머타임 반영' : '', `· ${b.placeName} · ${b.isMale ? '남' : '여'}`].filter(Boolean).join(' ');
  const pos = ['시주', '일주', '월주', '년주'];
  const item = (p) => a.items.find((x) => x.position === p);
  const row = (lab, fn, cls = '') => `<div class="trow ${cls}"><span class="lab">${lab}</span>${pos.map((p) => `<div class="${p === '일주' ? 'daycol' : ''}">${fn(p, item(p))}</div>`).join('')}</div>`;
  const total = a.elementWeighted.reduce((x, y) => x + y, 0) || 1;
  const me = GZ.stemElement(c.dayStem);
  const order = [1, 2, 3, 4, 0];
  const ptsXY = (e, r) => { const i = order.indexOf(e); const ang = -Math.PI / 2 + i * 2 * Math.PI / 5; return [50 + r * Math.cos(ang), 52 + r * Math.sin(ang)]; };
  const outer = order.map((e, i) => { const [x1, y1] = ptsXY(e, 34), [x2, y2] = ptsXY(order[(i + 1) % 5], 34); const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; return `M${x1} ${y1} Q${mx + (mx - 50) * 0.25} ${my + (my - 52) * 0.25} ${x2} ${y2}`; }).join(' ');
  const star = [0, 1, 2, 3, 4].map((e) => { const [x1, y1] = ptsXY(e, 34), [x2, y2] = ptsXY((e + 2) % 5, 34); return `M${x1} ${y1} L${x2} ${y2}`; }).join(' ');

  return `<div class="gap">
    <div class="row" style="flex-wrap:wrap">${chip(GZ.animals[c.year.branch] + '띠', `var(--${['wood', 'fire', 'earth', 'metal', 'water'][GZ.branchElement[c.year.branch]]})`)}${chip(`일간 ${GZ.stemsH[c.dayStem]} ${GZ.elementNames[me]}`, `var(--${['wood', 'fire', 'earth', 'metal', 'water'][me]})`)}${chip(a.strengthLabel, 'var(--lilac)')}</div>
    <div class="small soft" style="margin-top:-8px">${esc(line)}</div>
    ${c.nearTermWarning ? `<div class="st bg-pink pastel" style="padding:12px">⚠️ ${esc(c.nearTermWarning)}</div>` : ''}
    <section class="st table" aria-label="사주 원국 ${c.allPillars.map((p) => p.hangul).join(' ')}">
      ${row('', (p) => `<span class="hand" style="font-size:20px">${p}</span>`)}
      ${row('십신', (p, it) => (it ? `<b class="small ${p === '일주' ? 'hl' : ''}">${p === '일주' ? '나' : TenGod.names[it.stemGod]}</b>` : ''))}
      ${row('천간', (p, it) => (it ? stemCh(it.pillar.stem, '', `data-act="sheet" data-kind="stem" data-pos="${p}"`) : '<span class="tiny soft">모름</span>'))}
      ${row('지지', (p, it) => (it ? branchCh(it.pillar.branch, '', `data-act="sheet" data-kind="branch" data-pos="${p}"`) : '<span class="tiny soft">모름</span>'))}
      ${row('십신', (p, it) => (it ? `<b class="small">${TenGod.names[it.branchGod]}</b>` : ''))}
      ${row('지장간', (p, it) => (it ? `<span class="serif small">${it.hidden.map(([s]) => GZ.stemsH[s]).join('')}</span>` : ''))}
      ${row('12운성', (p, it) => (it ? `<span class="small">${TwelveStage.names[it.stage]}</span>` : ''))}
      ${row('신살', (p) => `<span class="tiny soft">${a.sinsal.filter((x) => x.position.startsWith(p[0])).map((x) => x.name).join('<br>')}</span>`)}
    </section>
    <p class="tiny soft" style="margin:-8px 0 0">글자를 누르면 자세한 설명이 나와요.</p>

    <section class="st" style="padding:18px">
      <div class="hand" style="font-size:28px">오행</div>
      <div class="tiny soft">원 크기 = 지장간까지 합한 비중 · 원을 눌러 보세요</div>
      <div class="ohaeng">
        <svg viewBox="0 0 100 104" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%"><path d="${outer}" fill="none" stroke="var(--ink)" stroke-opacity=".55" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="${star}" fill="none" stroke="var(--ink)" stroke-opacity=".25" stroke-width=".4" stroke-dasharray="1.5 1.5" vector-effect="non-scaling-stroke"/></svg>
        ${[0, 1, 2, 3, 4].map((e) => { const [x, y] = ptsXY(e, 34); const share = a.elementWeighted[e] / total; const size = 46 + share * 80; return `<button class="el el${e} ${e === me ? 'me' : ''}" style="left:${x}%;top:${y / 104 * 100}%;width:${size}px;height:${size}px" data-act="sheet" data-kind="el" data-e="${e}" aria-label="${GZ.elementNames[e]} ${a.elementCount[e]}개"><b class="serif">${GZ.elementHanja[e]}</b><span>${GZ.elementNames[e]} ${a.elementCount[e]}</span>${e === me ? '<i class="hand hl" style="position:absolute;top:-22px;font-style:normal;font-size:20px">나</i>' : ''}</button>`; }).join('')}
      </div>
      <div class="row" style="flex-wrap:wrap"><span class="small soft" style="font-weight:600">보완하면 좋은 오행</span>${a.helpfulElements.map((e) => chip(`${GZ.elementHanja[e]} ${GZ.elementNames[e]}`, `var(--${['wood', 'fire', 'earth', 'metal', 'water'][e]})`)).join('')}</div>
      <div class="meter" style="margin-top:14px"><div class="trk"></div><span class="lbl hand" style="left:clamp(0px, calc(${(a.strengthScore * 100).toFixed(1)}% - 25px), calc(100% - 54px))">${a.strengthLabel}</span></div>
      <div class="row tiny soft"><span>신약</span><span class="grow center">중화</span><span>신강</span></div>
      <div class="tiny soft">월지·일지 등에 가중치를 둔 간이 판단이에요.</div>
    </section>

    <section class="st w2" style="padding:18px">
      <div class="hand" style="font-size:26px">글자끼리의 관계</div>
      ${a.relations.length ? a.relations.map((r) => `<div class="row" style="margin-top:6px">${chip(r.relation.name, r.relation.harmony ? 'var(--mint)' : 'var(--pink)')}<span>${r.b ? `${r.a} ↔ ${r.b}` : r.a}</span></div>`).join('') : '<p class="soft">서로 크게 부딪히거나 묶이는 관계가 없어요.</p>'}
      <div class="hand" style="font-size:26px;margin-top:12px">신살</div>
      ${a.sinsal.length ? a.sinsal.map((s) => `<div class="row" style="margin-top:6px;align-items:flex-start">${chip(s.name, 'var(--butter)')}<span>${s.position} · ${esc(s.note)}</span></div>`).join('') : '<p class="soft">주요 신살이 없어요.</p>'}
    </section>
    <p class="small soft">시간 기준: ${TimeCorrection[b.correction]} · ${JasiMode[b.jasi]}</p>
  </div>`;
}

function renderLuck(c, a) {
  const age = (Date.now() / 1000 - c.instant) / (365.2425 * 86400);
  let cur = -1; a.daeun.forEach((d, i) => { if (d.startAge <= age) cur = i; });
  const ty = SajuCalc.sajuYear(Date.now() / 1000);
  return `<div class="gap">
    <div class="row" style="align-items:flex-end"><span class="hand" style="font-size:32px">대운</span><span class="tiny soft" style="padding-bottom:6px">10년마다 바뀌는 큰 흐름 · ${a.daeunForward ? '순행' : '역행'} · 대운수 ${a.daeunStart.toFixed(1)}</span></div>
    <section class="st" style="padding:10px">${a.daeun.map((d, i) => {
      const sy = SajuCalc.daeunStartYear(c, d.startAge);
      return `<button class="du ${i === cur ? 'now' : i < cur ? 'past' : ''}" data-act="sheet" data-kind="daeun" data-i="${i}"><span class="pt"></span>
        <span style="width:76px"><span class="hand" style="font-size:19px">${Math.trunc(d.startAge)}–${Math.trunc(d.startAge) + 9}세</span><br><span class="tiny" style="opacity:.6">${sy}–${sy + 9}</span></span>
        ${stemCh(d.pillar.stem, 's40')}${branchCh(d.pillar.branch, 's40')}
        <span class="grow"><b class="small">${TenGod.names[d.stemGod]} · ${TenGod.names[d.branchGod]}</b><br><span class="tiny">${esc(meanings[d.stemGod].keyword)}</span></span>
        ${i === cur ? '<span class="hand hl" style="font-size:18px">지금</span>' : ''}</button>`;
    }).join('')}</section>
    ${cur >= 0 ? `<section class="st bg-butter pastel" style="padding:16px"><div class="tiny" style="font-weight:600;opacity:.65">지금의 대운 ${a.daeun[cur].pillar.hanja}(${a.daeun[cur].pillar.hangul})</div><div class="hand" style="font-size:28px">${esc(meanings[a.daeun[cur].stemGod].keyword)}</div><div class="small" style="opacity:.8">${esc(meanings[a.daeun[cur].stemGod].summary.replace(/날이에요/g, '시기예요'))}</div></section>` : ''}
    <div class="row" style="align-items:flex-end"><span class="hand" style="font-size:32px">세운</span><span class="tiny soft" style="padding-bottom:6px">해마다 들어오는 기운 · 내 일지와의 관계</span></div>
    <section class="st w3" style="padding:10px">${Array.from({ length: 8 }, (_, k) => ty - 1 + k).map((y) => {
      const p = SajuCalc.yearPillar(y), g = TenGod.of(c.dayStem, p.stem), rels = Relations.branches(p.branch, c.day.branch);
      return `<div class="yr ${y === ty ? 'now' : ''}"><span class="hand" style="font-size:20px;width:50px">${y}</span><b class="serif" style="width:36px">${p.hanja}</b>${chip(TenGod.names[g], `var(--${['wood', 'fire', 'earth', 'metal', 'water'][GZ.stemElement(p.stem)]})`)}<span class="grow"><span class="small">${esc(meanings[g].keyword)}</span>${rels.length ? `<br><span class="tiny" style="font-weight:600;color:${rels.some((r) => r.harmony) ? 'var(--green)' : 'var(--red)'}">${rels.map((r) => '일지 ' + r.name).join(' ')}</span>` : ''}</span></div>`;
    }).join('')}</section>
  </div>`;
}

function renderCalendar(c, a) {
  const [y, mo] = S.month;
  const first = KCal.dayNumber(y, mo, 1), next = mo === 12 ? KCal.dayNumber(y + 1, 1, 1) : KCal.dayNumber(y, mo + 1, 1);
  const days = next - first, lead = ((first % 7) + 1) % 7, t = today();
  const fs = Array.from({ length: days }, (_, i) => daily(c, a, y, mo, i + 1));
  const good = fs.map((f, i) => [f, i + 1]).filter(([f]) => f.stars >= 4).map(([, d]) => d);
  return `<div class="gap">
    <div class="row"><button class="iconbtn" data-act="month" data-n="-1" aria-label="지난달"><span class="st w2">‹</span></button><span class="grow center hand" style="font-size:32px">${y}년 ${mo}월</span><button class="iconbtn" data-act="month" data-n="1" aria-label="다음 달"><span class="st w3">›</span></button></div>
    ${y !== t[0] || mo !== t[1] ? '<button class="st bg-peach pastel back-today" data-act="thismonth" style="margin-top:-8px">이번 달로</button>' : ''}
    <section class="st cal" id="swipe-cal"><div class="cgrid">
      ${'일월화수목금토'.split('').map((w, i) => `<span class="wh ${i === 0 ? 'sun' : ''}">${w}</span>`).join('')}
      ${'<span></span>'.repeat(lead)}
      ${fs.map((f, i) => { const d = i + 1, isT = y === t[0] && mo === t[1] && d === t[2];
        return `<button class="cell ${isT ? 'today' : ''}" style="background:${gradeColor(f.stars)}" data-act="open" data-d="${y}-${mo}-${d}" aria-label="${isT ? '오늘, ' : ''}${mo}월 ${d}일 ${f.dayPillar.hangul}일 ${f.grade}"><span class="n hand">${d}</span><span class="p serif">${f.dayPillar.hanja}</span><span class="g ${f.stars <= 2 ? 'bad' : ''}">${f.grade}</span></button>`; }).join('')}
    </div></section>
    <div class="row small soft" style="flex-wrap:wrap">${[[5, '대길'], [4, '길'], [3, '평'], [2, '주의'], [1, '흉']].map(([s, g]) => `<span class="row" style="gap:4px"><span class="dot" style="background:${gradeColor(s)}"></span>${g}</span>`).join('')}</div>
    <p class="tiny soft" style="margin:0">좌우로 밀면 달이 바뀌고, 날짜를 누르면 그날 운세로 가요.</p>
    ${good.length ? `<section class="st bg-mint pastel" style="padding:16px"><div class="tiny" style="font-weight:600;opacity:.65">이달의 좋은 날</div><div class="hand" style="font-size:24px">${good.map((d) => `<span style="white-space:nowrap">${d}일</span>`).join(' · ')}</div><div class="small" style="opacity:.7">중요한 약속이나 시작하고 싶은 일이 있다면 참고해 보세요.</div></section>` : ''}
  </div>`;
}

function renderForm() {
  const d = S.draft, first = !S.profile;
  const opts = (arr, sel, fmt = (x) => x) => arr.map((v) => `<option value="${v}" ${String(v) === String(sel) ? 'selected' : ''}>${fmt(v)}</option>`).join('');
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const sel = (label, key, arr, fmt) => `<div class="field"><label for="f-${key}">${label}</label><select id="f-${key}" data-field="${key}">${opts(arr, d[key], fmt)}</select></div>`;
  const leapOk = d.isLunar && KCal.hasLeapMonth(d.year, d.month);
  const lunarHint = d.isLunar ? (() => { const n = KCal.lunarToDayNumber(d.year, d.month, d.day, d.leapMonth); if (n == null) return '이 음력 날짜는 없어요 (그 달은 29일까지일 수 있어요).'; const s = KCal.ymd(n); return `양력 ${s[0]}년 ${s[1]}월 ${s[2]}일`; })() : '';
  const isStandalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `<div class="gap">
    <div><div class="hand" style="font-size:40px">${first ? '반가워요!' : '내 정보 고치기'}</div><div class="soft">${first ? '태어난 날과 시간을 알려 주면 사주를 세우고 매일 운세를 그려 드릴게요.' : '바꾸면 사주와 운세가 다시 계산돼요.'}</div></div>
    ${first && !isStandalone ? `<div class="st hint-install small">📲 <b>홈 화면에 추가</b>하면 앱처럼 쓸 수 있어요.<br>· 갤럭시(삼성 인터넷·크롬): 메뉴 ⋮ → <b>홈 화면에 추가</b> 또는 <b>앱 설치</b><br>· 아이폰(사파리): 공유 버튼 → <b>홈 화면에 추가</b></div>` : ''}
    <section class="st form"><div class="hand" style="font-size:24px">나</div>
      <div class="field"><label for="f-name">이름 (선택)</label><input id="f-name" data-field="name" value="${esc(d.name)}" autocomplete="off" enterkeyhint="done"></div>
      <div class="row"><span class="grow">성별</span><div class="seg" role="radiogroup" aria-label="성별"><button class="${d.isMale ? 'on' : ''}" data-act="set" data-k="isMale" data-v="1" role="radio" aria-checked="${d.isMale}">남</button><button class="${!d.isMale ? 'on' : ''}" data-act="set" data-k="isMale" data-v="0" role="radio" aria-checked="${!d.isMale}">여</button></div></div>
      <div class="tiny soft">성별은 대운의 방향(순행·역행)을 정하는 데 쓰여요.</div></section>
    <section class="st w2 form"><div class="hand" style="font-size:24px">태어난 날</div>
      <div class="row"><span class="grow">달력</span><div class="seg" role="radiogroup" aria-label="달력"><button class="${!d.isLunar ? 'on' : ''}" data-act="set" data-k="isLunar" data-v="0" role="radio" aria-checked="${!d.isLunar}">양력</button><button class="${d.isLunar ? 'on' : ''}" data-act="set" data-k="isLunar" data-v="1" role="radio" aria-checked="${d.isLunar}">음력</button></div></div>
      <div style="display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:8px">${sel('년', 'year', range(1920, 2040).reverse(), (v) => v + '년')}${sel('월', 'month', range(1, 12), (v) => v + '월')}${sel('일', 'day', range(1, d.isLunar ? 30 : 31), (v) => v + '일')}</div>
      ${d.isLunar ? `<label class="switch"><span class="grow">윤달</span><input type="checkbox" data-field="leapMonth" ${d.leapMonth ? 'checked' : ''} ${leapOk ? '' : 'disabled'}></label><div class="tiny soft">${lunarHint}</div>` : ''}</section>
    <section class="st w3 form"><div class="hand" style="font-size:24px">태어난 시간과 곳</div>
      <label class="switch"><span class="grow">태어난 시간을 알아요</span><input type="checkbox" data-field="timeKnown" ${d.timeKnown ? 'checked' : ''}></label>
      ${d.timeKnown ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${sel('시', 'hour', range(0, 23), (v) => String(v).padStart(2, '0') + '시')}${sel('분', 'minute', range(0, 59), (v) => String(v).padStart(2, '0') + '분')}</div>` : ''}
      <div class="field"><label for="f-place">태어난 곳</label><select id="f-place" data-field="placeName">${opts(PLACES.map((p) => p[0]), d.placeName)}</select></div>
      <div class="tiny soft">${d.timeKnown ? '당시 시계 기준으로 적어 주세요. 서머타임(1948–1951·1955–1960·1987–1988년)과 그 시절 표준시는 자동으로 반영돼요.' : '시간을 모르면 시주 없이 연·월·일주로만 풀이해요.'}</div></section>
    <section class="st form"><div class="hand" style="font-size:24px">계산 기준</div>
      ${sel('시간 보정', 'correction', [0, 1, 2], (v) => TimeCorrection[v])}${sel('자시 처리', 'jasi', [0, 1], (v) => JasiMode[v])}
      <div class="tiny soft">한국 표준시는 동경 135° 기준이라 서울에서는 실제 해의 위치보다 약 32분 빨라요. 대부분의 만세력은 경도 보정을 써요. 자시 처리는 학파마다 달라요.</div></section>
    <section class="st w2 form"><div class="hand" style="font-size:24px">💾 백업</div>
      <div class="small">${first ? '예전에 저장해 둔 백업 파일이 있으면 불러올 수 있어요.' : '폰을 바꾸거나 브라우저 기록을 지우기 전에 백업 파일을 저장해 두세요. 휴대폰에서는 공유 창이 열리니 카톡 ‘나에게’나 드라이브에 보내 두면 편해요.'}</div>
      ${first ? '' : `<div class="tiny soft">이 기기에 오래 보관: ${S.persisted === true ? '켜짐 — 저장 공간이 부족해도 지우지 않아요' : S.persisted === false ? '브라우저가 아직 허락하지 않았어요 (홈 화면에 추가하면 허락되는 경우가 많아요)' : '이 브라우저는 지원하지 않아요'}</div>`}
      <div class="row" style="flex-wrap:wrap">${first ? '' : '<button class="st btn" style="background:var(--mint)" data-act="backup">백업 파일 저장</button>'}<label class="st btn" style="background:var(--sky);display:inline-flex;align-items:center;cursor:pointer">백업 불러오기<input type="file" accept=".json,application/json" data-file="restore" hidden></label></div></section>
    <p class="small soft">🔒 계산은 모두 이 기기 안에서 하고, 입력한 정보는 이 브라우저에만 저장돼요. 어디로도 보내지 않아요. (브라우저 기록을 지우면 함께 지워질 수 있어요)</p>
    <div class="row">${first ? '<span class="grow"></span>' : '<button class="link hl" data-act="delete">기록 삭제</button><span class="grow"></span><button class="link" data-act="cancel">취소</button>'}<button class="st btn" data-act="save">${first ? '사주 세우기' : '저장'}</button></div>
  </div>`;
}

// ───────── 그리기 · 이벤트

function render() {
  const showTabs = S.profile && !S.editing;
  if (!S.profile && !S.draft) S.draft = defaultBirth();
  const ca = chart();
  let body = '';
  if (!S.profile || S.editing) body = renderForm();
  else if (ca) body = { today: renderToday, chart: renderChart, luck: renderLuck, calendar: renderCalendar }[S.section](...ca);
  $('#app').innerHTML = `
    <header class="top"><div class="bar"><span class="brand hand">사주낙서 ✦</span><span class="grow"></span>${showTabs ? '<button class="iconbtn" data-act="edit" aria-label="내 정보 · 계산 기준"><span class="st">☺</span></button>' : ''}</div>
      ${showTabs ? `<nav class="st tabs" role="tablist">${[['today', '오늘', 'butter'], ['chart', '명식', 'peach'], ['luck', '대운', 'sky'], ['calendar', '달력', 'mint']].map(([k, t, bg]) => `<button class="tab ${S.section === k ? 'on' : ''}" style="${S.section === k ? `background:var(--${bg})` : ''}" data-act="tab" data-k="${k}" role="tab" aria-selected="${S.section === k}">${t}</button>`).join('')}</nav>` : ''}
    </header>
    <main>${body}</main>
    ${S.sheet ? `<div class="sheet-bg" data-act="close"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(S.sheet[0])}"><div class="grab"></div><div class="hand" style="font-size:28px">${esc(S.sheet[0])}</div><div class="body">${esc(S.sheet[1])}</div></div></div>` : ''}
    ${S.error ? `<div class="sheet-bg" data-act="close"><div class="sheet" role="alertdialog"><div class="grab"></div><div class="hand" style="font-size:26px">문제가 생겼어요</div><div class="body">${esc(S.error)}</div></div></div>` : ''}`;
  bindSwipe('#swipe-week', (dir) => move(dir * 7));
  bindSwipe('#swipe-cal', (dir) => moveMonth(dir));
}

function move(n) { S.day = KCal.ymd(dn(S.day) + n); render(); }
function moveMonth(n) { let [y, m] = S.month; m += n; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } S.month = [y, m]; render(); }

function bindSwipe(sel, cb) {
  const el = $(sel); if (!el) return;
  let x0 = null, y0 = null;
  el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) cb(dx < 0 ? 1 : -1);
  }, { passive: true });
}

function openSheet(btn) {
  const ca = chart(); if (!ca) return;
  const [c, a] = ca, k = btn.dataset.kind;
  if (k === 'stem' || k === 'branch') {
    const it = a.items.find((x) => x.position === btn.dataset.pos); const p = it.pillar;
    if (k === 'stem') S.sheet = [`${GZ.stemsH[p.stem]}(${GZ.stemsK[p.stem]}) · ${it.position} 천간`, (it.position === '일주' ? '나를 나타내는 글자(일간)예요. ' : `나에게 ${TenGod.names[it.stemGod]}(${TenGod.hanja[it.stemGod]}) — ${meanings[it.stemGod].keyword}. `) + `오행은 ${GZ.elementNames[GZ.stemElement(p.stem)]}(${GZ.elementHanja[GZ.stemElement(p.stem)]}), ${GZ.stemYang(p.stem) ? '양' : '음'}이에요.`];
    else S.sheet = [`${GZ.branchesH[p.branch]}(${GZ.branchesK[p.branch]}) · ${it.position} 지지`, `나에게 ${TenGod.names[it.branchGod]} — ${meanings[it.branchGod].keyword}.\n지장간: ${it.hidden.map(([s, g]) => `${GZ.stemsH[s]}(${GZ.stemsK[s]}) ${TenGod.names[g]}`).join(', ')}\n12운성: ${TwelveStage.names[it.stage]} · 띠 동물: ${GZ.animals[p.branch]}`];
  } else if (k === 'el') {
    const e = +btn.dataset.e, total = a.elementWeighted.reduce((x, y) => x + y, 0) || 1;
    S.sheet = [`${GZ.elementNames[e]}(${GZ.elementHanja[e]})`, `글자 ${a.elementCount[e]}개 · 지장간까지 합한 비중 ${Math.round(a.elementWeighted[e] / total * 100)}%` + (e === GZ.stemElement(c.dayStem) ? '\n내 일간의 오행이에요.' : '')];
  } else if (k === 'daeun') {
    const d = a.daeun[+btn.dataset.i];
    S.sheet = [`${d.pillar.hanja}(${d.pillar.hangul}) 대운 · ${Math.trunc(d.startAge)}–${Math.trunc(d.startAge) + 9}세`, `${TenGod.names[d.stemGod]} · ${TenGod.names[d.branchGod]}\n${meanings[d.stemGod].summary.replace(/날이에요/g, '시기예요')}`];
  }
  render();
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const act = t.dataset.act;
  if (act === 'close') { if (e.target === t) { S.sheet = null; S.error = null; render(); } return; }
  if (act === 'tab') { S.section = t.dataset.k; render(); scrollTo(0, 0); }
  else if (act === 'fold') { const k = t.dataset.key; S.expanded.has(k) ? S.expanded.delete(k) : S.expanded.add(k); store.set('expanded', [...S.expanded]); render(); }
  else if (act === 'day') { S.day = t.dataset.d.split('-').map(Number); render(); }
  else if (act === 'move') move(+t.dataset.n);
  else if (act === 'today') { S.day = today(); render(); }
  else if (act === 'month') moveMonth(+t.dataset.n);
  else if (act === 'thismonth') { S.month = today().slice(0, 2); render(); }
  else if (act === 'open') { S.day = t.dataset.d.split('-').map(Number); S.section = 'today'; render(); scrollTo(0, 0); }
  else if (act === 'done') { const k = t.dataset.key; S.done.has(k) ? S.done.delete(k) : S.done.add(k); store.set('done', [...S.done].sort().slice(-400)); render(); }
  else if (act === 'sheet') openSheet(t);
  else if (act === 'edit') { S.draft = { ...S.profile }; S.editing = true; render(); scrollTo(0, 0); }
  else if (act === 'cancel') { S.editing = false; render(); }
  else if (act === 'set') { S.draft[t.dataset.k] = t.dataset.v === '1'; if (t.dataset.k === 'isLunar') S.draft.leapMonth = false; render(); }
  else if (act === 'save') {
    try { SajuCalc.chart(S.draft); S.profile = { ...S.draft }; if (!demo) { store.set('profile', S.profile); keepOnDevice(); } S.editing = false; S.section = 'today'; S.day = today(); render(); scrollTo(0, 0); }
    catch (err) { S.error = err.message; render(); }
  } else if (act === 'backup') {
    const name = S.profile.name ? `-${S.profile.name.replace(/[\\/:*?"<>|]/g, '')}` : '';
    K.saveFile(`사주낙서-백업${name}.json`, JSON.stringify({ app: 'saju-doodle', v: 1, savedAt: new Date().toISOString(), profile: S.profile, done: [...S.done] }, null, 1), 'application/json', '사주낙서 백업')
      .then((r) => { if (r !== 'cancelled') { S.sheet = ['백업했어요', r === 'shared' ? '백업 파일을 보냈어요. 카톡 나에게·드라이브 등에 잘 보관하세요.' : '백업 파일을 다운로드 폴더에 저장했어요.']; render(); } });
  } else if (act === 'delete') {
    if (confirm('이 브라우저에 저장된 출생 정보를 지울까요? 되돌릴 수 없어요.')) { try { localStorage.removeItem('saju.profile'); } catch { } S.profile = null; S.draft = defaultBirth(); S.editing = false; render(); }
  }
});

document.addEventListener('change', (e) => {
  if (e.target.dataset.file === 'restore' && e.target.files[0]) {
    e.target.files[0].text().then((txt) => {
      const o = JSON.parse(txt), p = Object.assign(defaultBirth(), o && o.profile);
      SajuCalc.chart(p); // 잘못된 파일이면 여기서 오류
      S.draft = p; S.editing = !!S.profile;
      if (Array.isArray(o.done)) { o.done.filter((x) => typeof x === 'string').forEach((x) => S.done.add(x)); store.set('done', [...S.done].sort().slice(-400)); }
      S.sheet = ['백업을 불러왔어요', `${p.name || '이름 없음'} · ${p.year}년 ${p.month}월 ${p.day}일 정보를 채웠어요. 확인하고 ${S.profile ? '저장' : '사주 세우기'}를 눌러 주세요.`]; render();
    }).catch(() => { S.error = '백업 파일을 읽을 수 없어요. 사주낙서에서 저장한 .json 파일인지 확인해 주세요.'; render(); });
    return;
  }
  const f = e.target.dataset.field; if (!f || !S.draft) return;
  const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  if (f === 'placeName') { S.draft.placeName = v; S.draft.longitude = PLACES.find((p) => p[0] === v)[1]; }
  else if (['year', 'month', 'day', 'hour', 'minute', 'correction', 'jasi'].includes(f)) { S.draft[f] = +v; if (f === 'month' || f === 'year') S.draft.leapMonth = false; }
  else S.draft[f] = v;
  render();
});
document.addEventListener('input', (e) => { if (e.target.dataset.field === 'name' && S.draft) S.draft.name = e.target.value; });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (S.sheet || S.error)) { S.sheet = null; S.error = null; render(); }
  if (S.section === 'today' && S.profile && !S.editing && !e.target.closest('input,select')) {
    if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1);
  }
});
// 날짜가 바뀌면 오늘로 (앱을 켜 둔 채 자정을 넘긴 경우)
let lastToday = today().join('-');
function syncToday() {
  const t = today().join('-'); if (t === lastToday) return;
  if (S.day.join('-') === lastToday) S.day = today();
  if (S.month.join('-') === lastToday.split('-').slice(0, 2).join('-')) S.month = today().slice(0, 2);
  lastToday = t; render();
}
setInterval(syncToday, 60000);
// 휴대폰은 백그라운드에서 타이머를 멈추므로, 다시 볼 때 바로 확인
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncToday(); });
window.addEventListener('pageshow', syncToday);

render();
keepOnDevice();
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !qs.get('nosw')) navigator.serviceWorker.register('./sw.js').catch(() => {});
