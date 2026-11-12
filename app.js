'use strict';
// Draft Board for Mobile Legends: Bang Bang. A page you keep open beside the game (second phone, tablet or PC).
// You tap what is banned and picked; it shows which heroes fit now. It never reads or touches the game.
//
// Data: the public community API at arena.rone.dev (RoneAI), which reads Moonton's public endpoints.
//   /api/heroes/positions            every hero: name, picture, lanes, roles, and its relations (strong / weak / assist)
//   /api/heroes/rank                 pick, ban and win rate per hero for a rank and time window
//   /api/heroes/<id>/counters        who does best and worst against a hero (asked once per picked enemy)
//   /api/heroes/<id>/compatibility   who does best and worst beside a hero (asked once per picked ally)
// The hero list and rates are kept in the browser for 12 hours, so a draft costs only a handful of requests.

const API = 'https://arena.rone.dev/api';
const LANES = ['exp', 'jungle', 'mid', 'gold', 'roam'];
const ROLES = ['tank', 'fighter', 'assassin', 'mage', 'marksman', 'support'];
const T = {
  en: { title: 'ML Helper', sMeta: 'Meta picks', reset: 'New draft', enemy: 'Enemy', ally: 'Your team', bans: 'Bans', suggest: 'Why this pick?', poolOnly: 'my heroes only', tagStrong: 'Counters', tagPairs: 'Combo', tagWeak: 'Careful', tagMeta: 'Meta pick',
    build: 'Build', builds: 'Core items players use', used: 'used by', emblem: 'Emblem', noBuild: 'No build data for this lane.', remove: 'Take out of the draft', sPickShort: 'Pick', sBanShort: 'Ban', tagWeakTo: 'Weak against',
    pro: 'Pro builds', proNote: 'Full builds from the newest pro games (MPL Indonesia, Philippines, Malaysia), newest first.', proNone: 'No full build for this hero in the newest pro games.', proFail: 'The pro games could not be loaded.', won: 'won', lost: 'lost',
    dna: 'Draft DNA', dnaDur: 'Durability', dnaOff: 'Damage', dnaCtl: 'Skill effects', combo: 'Combo', banTitle: 'Worth banning', hurts: 'counters your', holdHint: 'Tap picks. Hold a hero for builds and matchups.',
    id_pick: ['Pick-off', 'Assassins hunt single targets. Avoid long fights.'], id_ftb: ['Front to back', 'A frontline protects the damage dealers in the back.'], id_dive: ['Dive', 'Everyone jumps the enemy backline together.'],
    id_poke: ['Poke & burst', 'Mages wear the enemy down before the fight starts.'], id_sustain: ['Sustain', 'Supports keep the team alive through long fights.'], id_team: ['Teamfight', 'Strongest when all five fight together.'],
    mEnemy: 'Enemy pick', mAlly: 'Our pick', mBan: 'Ban', mFav: '★ My heroes', analysis: 'Analysis', anTitle: 'Team composition & win conditions', anSpike: 'Team power by game length', anSpikeNote: 'Average win rate of the five heroes in games of that length (minutes).', anLanes: 'Lane matchups',
    anLaneNote: 'Win projection per lane, an estimate from matchup statistics. Use ⇄ to move a hero to the next lane. Tap a hero for builds and counter items.', anWin: 'Core win conditions', anEst: 'All of this is calculated from public statistics and simple rules. Treat it as a hint, not a verdict.',
    tEarly: 'Early game', tLate: 'Late game scaling', tEven: 'Steady all game', bEarly: 'Strongest in short games: press the lead and end before 16 minutes', bLate: 'Stronger the longer it goes: farm safely and stall', bEven: 'No clear timing edge: play around Turtle and Lord',
    wc_id_pick: ['Catch single heroes before fights start', 'Control the jungle paths', 'Avoid long front-to-back fights'], wc_id_ftb: ['Protect the damage dealer in the back', 'Fight at objectives, frontline first', 'Do not chase into their jungle'],
    wc_id_dive: ['Jump their backline together on one target', 'Force fights when key skills are ready', 'Do not split up before a dive'], wc_id_poke: ['Wear them down before objectives', 'Keep distance, do not get engaged on', 'Siege turrets from skill range'],
    wc_id_sustain: ['Take long fights and heal through the damage', 'Group as five around the carry', 'Trade objectives instead of risky picks'], wc_id_team: ['Group for Turtle and Lord fights', 'Combine area skills in one fight', 'Do not get caught alone'],
    counterItems: 'Items against this hero', ci_heal: 'cuts its healing and shields', ci_magic: 'magic defence against its damage', ci_mm: 'against basic attacks and attack speed', ci_burst: 'survive its burst', ci_cc: 'shorter crowd control', ci_tank: 'damage that scales with its high HP',
    phaseBan: 'Ban phase', phasePick: 'Pick phase', phaseDone: 'Draft complete', skip: 'Skip to picks', fmt_ranked: 'Ranked', fmt_draft: 'Tournament',
    fmtTip_ranked: 'Ranked: all bans first (5 per team), then the picks. Tap to switch to tournament order.', fmtTip_draft: 'Tournament: 3 bans each, 3 picks each, 2 bans each, 2 picks each. Tap to switch to ranked order.', banFull: 'All bans are in.', vsOurs: 'counters our', sPick: 'Most picked', sWin: 'Win rate', sBan: 'Most banned', sName: 'Name',
    settings: 'Settings', lang: 'Language', rank: 'Statistics from rank', days: 'Time window (days)', refresh: 'Reload game data', close: 'Close',
    credit: 'Unofficial fan tool. Game data © Moonton (Mobile Legends: Bang Bang), read through the public API of RoneAI (arena.rone.dev). Not affiliated with or endorsed by Moonton. You enter the draft by hand; this page does not read or touch the game.',
    exp: 'Exp', jungle: 'Jungle', mid: 'Mid', gold: 'Gold', roam: 'Roam', tank: 'Tank', fighter: 'Fighter', assassin: 'Assassin', mage: 'Mage', marksman: 'Marksman', support: 'Support',
    search: 'Search hero', empty: 'Tap the enemy picks and the page suggests heroes.', none: 'No hero fits these filters.', loading: 'Loading heroes…', failed: 'Could not load the game data. Check the connection and press reload.',
    strong: 'strong against', pairs: 'pairs with', weak: 'careful:', meta: 'win rate', full: 'That side is full.', favHint: 'Tap heroes you play. They show first and can be the only ones suggested.', taken: 'already taken',
    data: (r, d) => `${r} · ${d} days`, all: 'All' },
  de: { title: 'ML Helper', sMeta: 'Meta-Picks', reset: 'Neuer Draft', enemy: 'Gegner', ally: 'Dein Team', bans: 'Bans', suggest: 'Warum dieser Pick?', poolOnly: 'nur meine Helden', tagStrong: 'Kontert', tagPairs: 'Kombo', tagWeak: 'Vorsicht', tagMeta: 'Meta-Pick',
    build: 'Build', builds: 'Kern-Items der Spieler', used: 'genutzt von', emblem: 'Emblem', noBuild: 'Keine Build-Daten für diese Lane.', remove: 'Aus dem Draft nehmen', sPickShort: 'Pick', sBanShort: 'Ban', tagWeakTo: 'Schwach gegen',
    pro: 'Profi-Builds', proNote: 'Volle Builds aus den neuesten Profi-Spielen (MPL Indonesia, Philippinen, Malaysia), neueste zuerst.', proNone: 'Kein voller Build für diesen Helden in den neuesten Profi-Spielen.', proFail: 'Die Profi-Spiele konnten nicht geladen werden.', won: 'gewonnen', lost: 'verloren',
    dna: 'Draft-DNA', dnaDur: 'Standfestigkeit', dnaOff: 'Schaden', dnaCtl: 'Fähigkeiten', combo: 'Kombo', banTitle: 'Bannen lohnt sich', hurts: 'kontert deine', holdHint: 'Tippen wählt. Held gedrückt halten für Builds und Matchups.',
    id_pick: ['Pick-off', 'Assassinen jagen einzelne Ziele. Lange Kämpfe meiden.'], id_ftb: ['Front to back', 'Eine Frontlinie schützt die Schadensverursacher dahinter.'], id_dive: ['Dive', 'Alle springen gemeinsam auf die gegnerische Backline.'],
    id_poke: ['Poke & Burst', 'Magier zermürben den Gegner, bevor der Kampf beginnt.'], id_sustain: ['Sustain', 'Supporter halten das Team in langen Kämpfen am Leben.'], id_team: ['Teamfight', 'Am stärksten, wenn alle fünf zusammen kämpfen.'],
    mEnemy: 'Gegner-Pick', mAlly: 'Unser Pick', mBan: 'Ban', mFav: '★ Meine Helden', analysis: 'Analyse', anTitle: 'Team-Aufstellung & Siegbedingungen', anSpike: 'Team-Stärke nach Spiellänge', anSpikeNote: 'Durchschnittliche Siegrate der fünf Helden in Spielen dieser Länge (Minuten).', anLanes: 'Lane-Matchups',
    anLaneNote: 'Sieg-Prognose pro Lane, eine Schätzung aus Matchup-Statistiken. Mit ⇄ einen Helden auf die nächste Lane schieben. Held antippen für Builds und Konter-Items.', anWin: 'Siegbedingungen', anEst: 'Alles hier ist aus öffentlichen Statistiken und einfachen Regeln berechnet. Ein Hinweis, kein Urteil.',
    tEarly: 'Early Game', tLate: 'Late-Game-Skalierung', tEven: 'Durchgehend stabil', bEarly: 'Am stärksten in kurzen Spielen: Vorsprung nutzen und vor Minute 16 beenden', bLate: 'Je länger, desto stärker: sicher farmen und verzögern', bEven: 'Kein klarer Zeitvorteil: um Turtle und Lord spielen',
    wc_id_pick: ['Einzelne Helden fangen, bevor Kämpfe beginnen', 'Die Jungle-Wege kontrollieren', 'Lange Front-to-back-Kämpfe meiden'], wc_id_ftb: ['Den Schadensverursacher hinten schützen', 'An Zielen kämpfen, Frontlinie zuerst', 'Nicht in ihren Jungle hinterherlaufen'],
    wc_id_dive: ['Gemeinsam auf ein Ziel in ihrer Backline springen', 'Kämpfe erzwingen, wenn die wichtigen Skills bereit sind', 'Vor einem Dive nicht aufteilen'], wc_id_poke: ['Vor Zielen zermürben', 'Abstand halten, sich nicht fangen lassen', 'Türme aus Skill-Reichweite belagern'],
    wc_id_sustain: ['Lange Kämpfe nehmen und den Schaden wegheilen', 'Zu fünft um den Carry gruppieren', 'Ziele tauschen statt riskanter Picks'], wc_id_team: ['Für Turtle- und Lord-Kämpfe gruppieren', 'Flächen-Skills in einem Kampf kombinieren', 'Nicht allein erwischen lassen'],
    counterItems: 'Items gegen diesen Helden', ci_heal: 'schwächt Heilung und Schilde', ci_magic: 'Magieverteidigung gegen den Schaden', ci_mm: 'gegen Standardangriffe und Angriffstempo', ci_burst: 'den Burst überleben', ci_cc: 'kürzere Kontrolleffekte', ci_tank: 'Schaden, der mit hohen HP skaliert',
    phaseBan: 'Ban-Phase', phasePick: 'Pick-Phase', phaseDone: 'Draft fertig', skip: 'Weiter zu den Picks', fmt_ranked: 'Ranked', fmt_draft: 'Turnier',
    fmtTip_ranked: 'Ranked: erst alle Bans (5 pro Team), dann die Picks. Antippen für die Turnier-Reihenfolge.', fmtTip_draft: 'Turnier: je 3 Bans, je 3 Picks, je 2 Bans, je 2 Picks. Antippen für die Ranked-Reihenfolge.', banFull: 'Alle Bans sind drin.', vsOurs: 'kontert unsere', sPick: 'Meistgewählt', sWin: 'Siegrate', sBan: 'Meistgebannt', sName: 'Name',
    settings: 'Einstellungen', lang: 'Sprache', rank: 'Statistik aus Rang', days: 'Zeitraum (Tage)', refresh: 'Spieldaten neu laden', close: 'Schließen',
    credit: 'Inoffizielles Fan-Tool. Spieldaten © Moonton (Mobile Legends: Bang Bang), gelesen über die öffentliche API von RoneAI (arena.rone.dev). Keine Verbindung zu Moonton. Du gibst den Draft von Hand ein; diese Seite liest und berührt das Spiel nicht.',
    exp: 'Exp', jungle: 'Jungle', mid: 'Mid', gold: 'Gold', roam: 'Roam', tank: 'Tank', fighter: 'Kämpfer', assassin: 'Assassine', mage: 'Magier', marksman: 'Schütze', support: 'Support',
    search: 'Held suchen', empty: 'Tippe die Gegner-Picks an, dann schlägt die Seite Helden vor.', none: 'Kein Held passt zu diesen Filtern.', loading: 'Helden werden geladen…', failed: 'Die Spieldaten konnten nicht geladen werden. Verbindung prüfen und neu laden.',
    strong: 'stark gegen', pairs: 'passt zu', weak: 'Vorsicht:', meta: 'Siegrate', full: 'Diese Seite ist voll.', favHint: 'Tippe die Helden an, die du spielst. Sie stehen vorn und können als einzige vorgeschlagen werden.', taken: 'schon vergeben',
    data: (r, d) => `${r} · ${d} Tage`, all: 'Alle' },
};

const $ = id => document.getElementById(id);
const store = { get(k, d) { try { const v = localStorage.getItem('mld.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem('mld.' + k, JSON.stringify(v)); } catch { } } };
const S = {
  lang: store.get('lang', (navigator.language || 'en').startsWith('de') ? 'de' : 'en'), rank: store.get('rank', 'mythic'), days: store.get('days', 7),
  favs: new Set(store.get('favs', [])), sort: store.get('sort', 'meta'), format: 'ranked', skipped: 0, icons: { lanes: {}, roles: {} },
  design: new URLSearchParams(location.search).get('design') || 'm2',
  mode: 'enemy', lanes: new Set(), roles: new Set(), q: '',
  enemy: [], ally: [], bans: [],
  heroes: new Map(),     // id -> { id, name, img, lanes: [], roles: [], strong: [], weak: [], assist: [], pick, ban, win }
  vs: new Map(),         // enemy id -> { good: Map(heroId -> gain), bad: Map }   (counters endpoint)
  beside: new Map(),     // ally id -> { good: Map, bad: Map }                    (compatibility endpoint)
  ready: false, failed: false,
};
const t = k => (T[S.lang] || T.en)[k] ?? T.en[k] ?? k;
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) { if (v == null || v === false) continue; if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : v); }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
  return el;
}
let toastTimer = 0;
function toast(msg) { const el = $('toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2200); }

// ---- data ------------------------------------------------------------------------------------------------------
async function api(path) {
  const r = await fetch(API + path, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  const j = await r.json();
  return (j && j.data && j.data.records) || [];
}
const arr = x => (Array.isArray(x) ? x.filter(v => v && typeof v === 'object') : []);
const ids = x => (Array.isArray(x) ? x : (x && x.target_hero_id) || []).map(Number).filter(Boolean);

async function loadHeroes(force) {
  const key = `heroes3.${S.rank}.${S.days}`, cached = store.get(key, null);
  if (!force && cached && Date.now() - cached.at < 12 * 3600 * 1000) { S.heroes = new Map(cached.list.map(x => [x.id, x])); S.icons = cached.icons || S.icons; return; }
  const icons = { lanes: {}, roles: {} };
  const [pos, rank] = await Promise.all([api('/heroes/positions?size=300&index=1&lang=en'), api(`/heroes/rank?days=${S.days}&rank=${S.rank}&size=300&index=1&sort_field=pick_rate&sort_order=desc`)]);
  const map = new Map();
  for (const rec of pos) {
    const d = rec.data || {}, hero = d.hero || {}, info = hero.data || {}, rel = d.relation || hero.relation || {};
    const id = Number(d.hero_id ?? hero.hero_id); if (!id) continue;
    // the game's own lane and role symbols, taken from the first hero that carries each
    for (const r of arr(info.roadsort)) { const q = r.data || r, k = String(q.road_sort_title || '').toLowerCase().split(' ')[0]; if (k && q.road_sort_icon && !icons.lanes[k]) icons.lanes[k] = q.road_sort_icon; }
    for (const r of arr(info.sortid)) { const q = r.data || r, k = String(q.sort_title || '').toLowerCase(); if (k && q.sort_icon && !icons.roles[k]) icons.roles[k] = q.sort_icon; }
    map.set(id, { id, name: info.name || String(id), img: info.head || info.smallmap || '', small: info.smallmap || '',
      lanes: arr(info.roadsort).map(x => String((x.data || x).road_sort_title || '').toLowerCase().split(' ')[0]).filter(l => LANES.includes(l)),
      roles: arr(info.sortid).map(x => String((x.data || x).sort_title || '').toLowerCase()).filter(Boolean),
      strong: ids(rel.strong), weak: ids(rel.weak), assist: ids(rel.assist), pick: 0, ban: 0, win: 0 });
  }
  for (const rec of rank) {
    const d = rec.data || {}, x = map.get(Number(d.main_heroid)); if (!x) continue;
    x.pick = d.main_hero_appearance_rate || 0; x.ban = d.main_hero_ban_rate || 0; x.win = d.main_hero_win_rate || 0;
    const head = d.main_hero && d.main_hero.data && d.main_hero.data.head; if (head) x.img = head;
  }
  if (!map.size) throw new Error('no heroes');
  S.heroes = map;
  S.icons = icons;
  store.set(key, { at: Date.now(), list: [...map.values()], icons });
}
// who does best / worst against (counters) or beside (compatibility) one hero
async function loadRelation(kind, id) {
  const cache = kind === 'counters' ? S.vs : S.beside;
  if (cache.has(id)) return;
  cache.set(id, { good: new Map(), bad: new Map() });   // placeholder so a second tap does not ask again
  try {
    const recs = await api(`/heroes/${id}/${kind}?days=${S.days}&rank=${S.rank}`), d = (recs[0] && recs[0].data) || {};
    const pack = list => new Map(arr(list).map(x => [Number(x.heroid), Number(x.increase_win_rate) || 0]));
    cache.set(id, { good: pack(d.sub_hero), bad: pack(d.sub_hero_last) });
    drawSuggest();
  } catch (e) { console.warn('relation', kind, id, e.message); }
}

// ---- suggestions -----------------------------------------------------------------------------------------------
// Score of a hero for our next pick. Per enemy: +3 when the game lists it as strong against that enemy, -3 when weak;
// win-rate gain from the live counter statistics (x100, so +4% = 4 points). Per ally: +2 for a listed partner and the
// live gain beside that ally. A small part of its own win rate breaks ties.
function scoreHero(x) {
  let s = (x.win - 0.5) * 20; const strong = [], pairs = [], weak = [];
  for (const e of S.enemy) {
    const eh = S.heroes.get(e); let v = 0;
    if (x.strong.includes(e) || (eh && eh.weak.includes(x.id))) v += 3;
    if (x.weak.includes(e) || (eh && eh.strong.includes(x.id))) v -= 3;
    const live = S.vs.get(e);
    if (live) { if (live.good.has(x.id)) v += Math.max(1, live.good.get(x.id) * 100); if (live.bad.has(x.id)) v += Math.min(-1, live.bad.get(x.id) * 100); }
    if (v >= 2) strong.push(e); else if (v <= -2) weak.push(e);
    s += v;
  }
  for (const a of S.ally) {
    const ah = S.heroes.get(a); let v = 0;
    if (x.assist.includes(a) || (ah && ah.assist.includes(x.id))) v += 2;
    const live = S.beside.get(a);
    if (live) { if (live.good.has(x.id)) v += Math.max(1, live.good.get(x.id) * 100); if (live.bad.has(x.id)) v += Math.min(-1, live.bad.get(x.id) * 100); }
    if (v >= 2) pairs.push(a);
    s += v;
  }
  return { s, strong, pairs, weak };
}
const taken = () => new Set([...S.enemy, ...S.ally, ...S.bans]);
function passesFilter(x) {
  if (S.lanes.size && !x.lanes.some(l => S.lanes.has(l))) return false;
  if (S.roles.size && !x.roles.some(r => S.roles.has(r))) return false;
  return true;
}
function drawSuggest() {
  const box = $('sugList');
  if (!S.ready) { box.replaceChildren(h('p', { class: 'faint' }, t(S.failed ? 'failed' : 'loading'))); return; }
  $('sugTitle').textContent = t(S.mode === 'ban' ? 'banTitle' : 'suggest');
  if (S.mode === 'ban') {
    // what to ban: the most banned and strongest heroes right now, lifted when they counter our picks or heroes you play
    const threat = new Map(); for (const f of S.favs) { const fh = S.heroes.get(f); if (fh) for (const w of fh.weak) threat.set(w, [...(threat.get(w) || []), fh.name]); }
    const usedNow = taken(), ours = new Map();
    for (const a of S.ally) { const ah = S.heroes.get(a); if (!ah) continue; for (const x of S.heroes.values()) if (ah.weak.includes(x.id) || x.strong.includes(a)) ours.set(x.id, [...(ours.get(x.id) || []), ah.name]); }
    const bans = [...S.heroes.values()].filter(x => !usedNow.has(x.id)).map(x => ({ x, s: x.ban * 10 + (ours.get(x.id) || []).length * 3 + (threat.get(x.id) || []).length * 1.5 + (x.win - 0.5) * 10 })).sort((a, b) => b.s - a.s).slice(0, 8);
    box.replaceChildren(...bans.map(({ x }, i) => h('button', { class: 'sug' + (i === 0 ? ' top' : ''), title: x.name, onclick: () => place(x.id, 'ban') }, h('img', { src: x.img, alt: '', loading: 'lazy' }),
      h('span', { class: 'sugtext' }, h('b', {}, x.name, h('i', { class: 'lane' }, x.lanes.map(l => t(l)).join(' / '))),
        h('span', { class: 'why bad' }, h('em', {}, t('mBan')), `${t('sBanShort')} ${(x.ban * 100).toFixed(0)}% · ${t('meta')} ${(x.win * 100).toFixed(1)}%`),
        ours.has(x.id) ? h('span', { class: 'why' }, h('em', {}, t('tagWeak')), `${t('vsOurs')} ${ours.get(x.id).join(', ')}`)
          : threat.has(x.id) ? h('span', { class: 'why' }, h('em', {}, t('tagWeak')), `${t('hurts')} ${threat.get(x.id).join(', ')}`) : null))));
    return;
  }
  const used = taken();
  const list = [...S.heroes.values()].filter(x => !used.has(x.id) && passesFilter(x))
    .map(x => { const r = scoreHero(x); if (S.favs.has(x.id)) r.s += 1.5; return { x, r }; })   // heroes you play get a small lift
    // heroes that counter an enemy pick always come before plain meta picks, the more enemies countered the earlier
    .sort((a, b) => b.r.strong.length - a.r.strong.length || b.r.s - a.r.s || b.x.pick - a.x.pick).slice(0, 8);
  if (!list.length) { box.replaceChildren(h('p', { class: 'faint' }, t('none'))); return; }
  const names = idsList => idsList.map(i => (S.heroes.get(i) || {}).name).filter(Boolean).join(', ');
  box.replaceChildren(...list.map(({ x, r }, i) => h('button', { class: 'sug' + (i === 0 ? ' top' : ''), title: x.name, onclick: () => openSheet(x.id) },
    h('img', { src: x.img, alt: '', loading: 'lazy' }),
    h('span', { class: 'sugtext' }, h('b', {}, x.name, S.favs.has(x.id) ? h('span', { class: 'star' }, ' ★') : null, h('i', { class: 'lane' }, x.lanes.map(l => t(l)).join(' / '))),
      r.strong.length ? h('span', { class: 'why good' }, h('em', {}, t('tagStrong')), `${t('strong')} ${names(r.strong)}`) : null,
      r.pairs.length ? h('span', { class: 'why pair' }, h('em', {}, t('tagPairs')), `${t('pairs')} ${names(r.pairs)}`) : null,
      r.weak.length ? h('span', { class: 'why bad' }, h('em', {}, t('tagWeak')), `${t('weak')} ${names(r.weak)}`) : null,
      !r.strong.length && !r.pairs.length && !r.weak.length ? h('span', { class: 'why' }, h('em', {}, t('tagMeta')), `${t('meta')} ${(x.win * 100).toFixed(1)}%`) : null))));
}

// ---- board -----------------------------------------------------------------------------------------------------
const SIDES = { enemy: { list: () => S.enemy, max: 5, el: 'slotsEnemy' }, ally: { list: () => S.ally, max: 5, el: 'slotsAlly' } };
// The order of a draft. Ranked: all bans, then all picks. Tournament: 3 bans each, 3 picks each, 2 bans each, 2 picks
// each. Bans are one list (who banned what does not matter here). The page follows the order by itself: it switches to
// Ban or to picking when a step is full; you can always tap another mode, and skip bans nobody used.
const FORMATS = { ranked: [['pick', 10]] };   // bans are not tracked (the owner's choice); the ban code below stays unused
function phase() {
  let cb = 0, cp = 0; const steps = FORMATS[S.format] || FORMATS.ranked, picks = S.enemy.length + S.ally.length;
  for (let i = 0; i < steps.length; i++) { const [kind, n] = steps[i];
    if (kind === 'ban') { cb += n; if (S.bans.length < cb && i >= S.skipped && picks <= cp) return { i, kind, done: S.bans.length - (cb - n), n }; }
    else { cp += n; if (picks < cp) return { i, kind, done: picks - (cp - n), n }; } }
  return { i: steps.length, kind: 'done', done: 0, n: 0 };
}
function drawPhase(auto) {
  const p = phase(), box = $('phase');
  if (auto && p.i !== drawPhase.last) { if (p.kind === 'ban' && S.mode !== 'ban') setMode('ban'); else if (p.kind !== 'ban' && S.mode === 'ban') setMode('enemy'); }
  drawPhase.last = p.i;
  box.replaceChildren(h('b', { class: p.kind }, p.kind === 'done' ? t('phaseDone') : `${t(p.kind === 'ban' ? 'phaseBan' : 'phasePick')} · ${p.done} / ${p.n}`),
    ...(p.kind === 'ban' ? [h('button', { class: 'skipbtn', onclick: () => { S.skipped = p.i + 1; drawPhase(true); drawSuggest(); } }, t('skip') + ' ›')]
      : S.enemy.length && S.ally.length ? [h('button', { class: 'skipbtn an', onclick: () => openAnalysis() }, t('analysis') + ' ›')] : []));
}
function place(id, mode) {
  if (mode === 'fav') { if (S.favs.has(id)) S.favs.delete(id); else S.favs.add(id); store.set('favs', [...S.favs]); drawGrid(); drawSuggest(); return; }
  const side = SIDES[mode], list = side.list();
  if (!side) return;
  if (taken().has(id)) { // a second tap on a taken hero takes it out again
    for (const k of ['enemy', 'ally', 'bans']) { const i = S[k].indexOf(id); if (i >= 0) S[k].splice(i, 1); }
  } else {
    if (list.length >= side.max) { toast(t(mode === 'ban' ? 'banFull' : 'full')); return; }
    list.push(id);
    if (mode === 'enemy') loadRelation('counters', id);
    if (mode === 'ally') loadRelation('compatibility', id);
    loadDetail(id);
  }
  store.set('draft', { enemy: S.enemy, ally: S.ally, bans: S.bans });
  const full = S.enemy.length === 5 && S.ally.length === 5;
  if (full && !place.wasFull) setTimeout(openAnalysis, 250);
  place.wasFull = full;
  drawPhase(true); drawBoard(); drawGrid(); drawSuggest(); drawDna();
}
// What kind of team five (or at least three) picks make, read from the heroes' main roles. A rough label, like the
// "draft identity" line on tournament streams: pick-off, front to back, dive, poke, sustain, teamfight.
function teamIdentity(list) {
  if (list.length < 3) return null;
  const n = {}; for (const id of list) { const r = (S.heroes.get(id) || { roles: [] }).roles[0]; if (r) n[r] = (n[r] || 0) + 1; }
  const c = k => n[k] || 0, front = c('tank') + c('fighter');
  if (c('assassin') >= 2) return 'id_pick';
  if (front >= 2 && c('marksman') >= 1 && c('assassin') === 0) return 'id_ftb';
  if (front >= 2 && c('assassin') >= 1 && c('marksman') === 0) return 'id_dive';
  if (c('mage') >= 2) return 'id_poke';
  if (c('support') >= 2) return 'id_sustain';
  return 'id_team';
}
function drawBoard() {
  for (const [el, list] of [['identEnemy', S.enemy], ['identAlly', S.ally]]) { const k = teamIdentity(list), box = $(el); box.textContent = k ? t(k)[0] : ''; box.title = k ? t(k)[1] : ''; }
  for (const [mode, side] of Object.entries(SIDES)) {
    const list = side.list(), kids = [];
    for (let i = 0; i < side.max; i++) {
      const x = S.heroes.get(list[i]);
      kids.push(x ? h('button', { class: 'slot filled', title: x.name, onclick: () => openSheet(x.id) }, h('img', { src: x.img, alt: x.name }), h('span', {}, x.name))
        : h('button', { class: 'slot' + (S.mode === mode && i === list.length ? ' next' : ''), onclick: () => setMode(mode) }, ''));
    }
    $(side.el).replaceChildren(...kids);
  }
}
function setMode(mode) {
  S.mode = mode;
  for (const b of document.querySelectorAll('.mode')) b.classList.toggle('on', b.dataset.mode === mode);
  document.body.dataset.mode = mode;
  if (mode === 'fav') toast(t('favHint'));
  drawBoard(); drawSuggest();
}

// ---- hero grid -------------------------------------------------------------------------------------------------
function drawChips() {
  // a symbol per lane and role instead of the word (the word stays as tooltip and for screen readers)
  const chip = (set, key) => { const icon = S.icons.lanes[key] || S.icons.roles[key];
    return h('button', { class: 'chip' + (icon ? ' sym' : '') + (set.has(key) ? ' on' : ''), title: t(key), 'aria-label': t(key), 'aria-pressed': String(set.has(key)),
      onclick: () => { if (set.has(key)) set.delete(key); else set.add(key); drawChips(); drawGrid(); drawSuggest(); } }, icon ? h('img', { src: icon, alt: '' }) : t(key)); };
  $('laneChips').replaceChildren(...LANES.map(k => chip(S.lanes, k)));
  $('roleChips').replaceChildren(...ROLES.map(k => chip(S.roles, k)));
}
function drawGrid() {
  const grid = $('grid');
  if (!S.ready) { grid.replaceChildren(h('p', { class: 'faint' }, t(S.failed ? 'failed' : 'loading'))); return; }
  const q = S.q.trim().toLowerCase(), used = taken();
  // meta = how often a hero is in the draft at all (picked or banned), lifted a little by its win rate
  const meta = x => (x.pick + x.ban) * (0.5 + x.win);
  const by = { meta: (a, b) => meta(b) - meta(a), pick: (a, b) => b.pick - a.pick, win: (a, b) => b.win - a.win, ban: (a, b) => b.ban - a.ban, name: (a, b) => a.name.localeCompare(b.name) }[S.sort];
  const list = [...S.heroes.values()].filter(x => passesFilter(x) && (!q || x.name.toLowerCase().includes(q)))
    .sort((a, b) => (S.favs.has(b.id) ? 1 : 0) - (S.favs.has(a.id) ? 1 : 0) || by(a, b) || a.name.localeCompare(b.name));
  if (!list.length) { grid.replaceChildren(h('p', { class: 'faint' }, t('none'))); return; }
  grid.replaceChildren(...list.map(x => {
    const where = S.enemy.includes(x.id) ? 'enemy' : S.ally.includes(x.id) ? 'ally' : S.bans.includes(x.id) ? 'ban' : '';
    const tile = h('button', { class: `hero ${where}${S.favs.has(x.id) ? ' fav' : ''}`, title: used.has(x.id) ? `${x.name} · ${t('taken')}` : x.name, onclick: () => place(x.id, S.mode) },
      h('img', { src: x.img, alt: '', loading: 'lazy', draggable: 'false' }), h('span', { class: 'n' }, x.name), h('span', { class: 'w' }, `${(x.win * 100).toFixed(0)}%`), S.favs.has(x.id) ? h('span', { class: 'star' }, '★') : null);
    holdToOpen(tile, x.id);
    return tile;
  }));
}

// ---- hero details, builds, draft DNA -------------------------------------------------------------------------
//   /api/heroes/<id>                          four ratings (durability, offense, skill effects, difficulty), speciality
//                                             tags, big picture and the game's own sentence for each relation
//   /api/academy/equipment                    item names and pictures (kept for a week)
//   /api/academy/heroes/<id>/builds?lane=     the builds players use in that lane, with pick and win rate
const D = { detail: new Map(Object.entries(store.get('detail', {})).map(([k, v]) => [Number(k), v])), items: null, builds: new Map(), open: 0, lane: '', pro: null };
async function loadDetail(id) {
  if (D.detail.has(id)) return D.detail.get(id);
  try {
    const recs = await api(`/heroes/${id}?lang=en`), d = (recs[0] && recs[0].data) || {}, info = (d.hero && d.hero.data) || {}, rel = d.relation || {};
    const v = { ab: (info.abilityshow || []).map(Number).filter(n => !Number.isNaN(n)), spec: (info.speciality || []).filter(Boolean), art: d.head_big || info.squareheadbig || '',
      desc: { strong: (rel.strong || {}).desc || '', weak: (rel.weak || {}).desc || '', assist: (rel.assist || {}).desc || '' } };
    D.detail.set(id, v); store.set('detail', Object.fromEntries(D.detail)); drawDna();
    return v;
  } catch (e) { console.warn('detail', id, e.message); return null; }
}
async function loadItems() {
  if (D.items) return D.items;
  const c = store.get('items', null);
  if (c && Date.now() - c.at < 7 * 86400e3) return D.items = new Map(c.list);
  const recs = await api('/academy/equipment?size=400&index=1&lang=en');
  const list = recs.map(r => r.data || {}).filter(x => x.equipid).map(x => [Number(x.equipid), { name: x.equipname || '', icon: x.equipicon || '' }]);
  store.set('items', { at: Date.now(), list });
  return D.items = new Map(list);
}
async function loadBuilds(id, lane) {
  const key = `${id}.${lane}.${S.rank}`; if (D.builds.has(key)) return D.builds.get(key);
  const recs = await api(`/academy/heroes/${id}/builds?lane=${lane}&rank=${S.rank}&size=5&index=1&lang=en`);
  const list = arr(((recs[0] || {}).data || {}).build).map(b => { const sp = ((b.battleskill || {}).data || {}).__data || {};
    return { items: (b.equipid || []).map(Number).filter(Boolean), pick: b.build_pick_rate || 0, win: b.build_win_rate || 0, emblem: ((b.emblem || {}).data || {}).emblemname || '', spell: sp.skillname || '', spellIcon: sp.skillicon || '' }; });
  D.builds.set(key, list);
  return list;
}
const pct = v => `${(v * 100).toFixed(1)}%`;
// Pro builds: what players built in the newest pro games of MPL Indonesia, Philippines and Malaysia (the leagues'
// public match pages, through the same API). The data does not say which patch a game was played on, so "newest" is by
// date: the schedules and playoffs are read, the 12 newest finished matches opened, and all of it kept for a day
// (about 18 requests). Only full builds (six items) are shown.
//   /api/esports/<league>/schedule, /playoffs    matches { match_id, start_at, status }
//   /api/esports/<league>/matches/<id>           games > teams > players { name, hero { name }, kills, deaths, assists, items, emblem, talents }
async function loadPro() {
  if (D.pro) return D.pro;
  const c = store.get('pro2', null);
  if (c && Date.now() - c.at < 24 * 3600 * 1000) return D.pro = c.list;
  const raw = async path => { const r = await fetch(API + path, { headers: { Accept: 'application/json' } }); if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.json(); };
  // every object with a match id and a start time, wherever it sits in the answer (schedule and playoffs differ)
  const collect = (node, lg, out) => { if (Array.isArray(node)) node.forEach(n => collect(n, lg, out)); else if (node && typeof node === 'object') {
    if (node.match_id != null && node.start_at && node.status === 'finished') out.push({ lg, id: node.match_id, at: String(node.start_at) }); else Object.values(node).forEach(n => collect(n, lg, out)); } };
  const found = [];
  await Promise.all(['id', 'ph', 'my'].flatMap(lg => ['schedule', 'playoffs'].map(async part => { try { collect(await raw(`/esports/${lg}/${part}`), lg, found); } catch (e) { console.warn('pro list', lg, part, e.message); } })));
  const seen = new Set(), matches = found.sort((a, b) => b.at.localeCompare(a.at)).filter(m => !seen.has(m.lg + m.id) && seen.add(m.lg + m.id)).slice(0, 12);
  if (!matches.length) throw new Error('no pro matches');
  const list = [];
  await Promise.all(matches.map(async m => {
    try {
      const det = await raw(`/esports/${m.lg}/matches/${encodeURIComponent(m.id)}`);
      for (const g of arr(det.games)) for (const tm of arr(g.teams)) for (const p of arr(tm.players)) {
        if (!p.hero || !p.hero.name) continue;
        list.push({ hero: norm(p.hero.name), player: p.name || '', team: (tm.team || {}).name || '', lg: m.lg.toUpperCase(), date: m.at.slice(0, 10), win: !!tm.winner, kda: [p.kills, p.deaths, p.assists].map(n => n ?? 0).join(' / '),
          items: arr(p.items).map(i => ({ id: Number(i.id), img: i.image || '' })), emblem: (p.emblem || {}).image || '', talents: arr(p.talents).map(x => x.image || '').filter(Boolean) });
      }
    } catch (e) { console.warn('pro match', m.lg, m.id, e.message); }
  }));
  list.sort((a, b) => b.date.localeCompare(a.date));
  if (list.length) store.set('pro2', { at: Date.now(), list });
  return D.pro = list;
}
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// The sheet that slides up from the bottom: who the hero is, pick buttons, matchups, and builds per lane.
async function openSheet(id) {
  const x = S.heroes.get(id); if (!x) return;
  D.open = id;
  const el = $('sheet'), where = S.enemy.includes(id) ? 'enemy' : S.ally.includes(id) ? 'ally' : S.bans.includes(id) ? 'ban' : '';
  const minis = list => h('div', { class: 'minis' }, list.map(i => S.heroes.get(i)).filter(Boolean).map(o => h('button', { class: 'mini', title: o.name, onclick: () => openSheet(o.id) }, h('img', { src: o.img, alt: '' }), h('span', {}, o.name))));
  const buildsBox = h('div', { class: 'builds' }), laneTabs = h('div', { class: 'chips' });
  const showBuilds = async lane => {
    D.lane = lane;
    laneTabs.replaceChildren(...x.lanes.map(l => h('button', { class: 'chip' + (l === lane ? ' on' : ''), onclick: () => showBuilds(l) }, t(l))));
    buildsBox.replaceChildren(h('p', { class: 'faint' }, t('loading')));
    try {
      const [items, list] = await Promise.all([loadItems(), loadBuilds(id, lane)]);
      if (D.open !== id || D.lane !== lane) return;
      buildsBox.replaceChildren(...(list.length ? list.slice(0, 4).map((b, i) => h('div', { class: 'build' },
        h('div', { class: 'bhead' }, h('b', {}, `${t('build')} ${i + 1}`), h('span', {}, `${t('used')} ${pct(b.pick)}`), h('span', { class: 'good' }, `${t('meta')} ${pct(b.win)}`)),
        h('div', { class: 'bitems' }, b.items.map(it => { const o = items.get(it) || {}; return h('span', { class: 'bitem', title: o.name || String(it) }, o.icon ? h('img', { src: o.icon, alt: '', loading: 'lazy' }) : null, h('i', {}, o.name || `#${it}`)); })),
        h('div', { class: 'bmeta' }, b.emblem ? h('span', {}, `${t('emblem')}: ${b.emblem}`) : null, b.spell ? h('span', {}, b.spellIcon ? h('img', { src: b.spellIcon, alt: '' }) : null, b.spell) : null)))
        : [h('p', { class: 'faint' }, t('noBuild'))]));
    } catch (e) { console.warn('builds', e.message); if (D.open === id) buildsBox.replaceChildren(h('p', { class: 'faint' }, t('noBuild'))); }
  };
  const head = h('div', { class: 'shead' }, h('img', { class: 'sart', src: x.img, alt: '' }),
    h('div', { class: 'sinfo' }, h('h2', {}, x.name), h('div', { class: 'faint' }, [...x.lanes.map(l => t(l)), ...x.roles.map(r => t(r))].join(' · ')), h('div', { class: 'stags' }),
      h('div', { class: 'srates' }, h('span', {}, `${t('meta')} `, h('b', {}, pct(x.win))), h('span', {}, `${t('sPickShort')} `, h('b', {}, pct(x.pick))), h('span', {}, `${t('sBanShort')} `, h('b', {}, pct(x.ban))))),
    h('button', { class: 'sclose', 'aria-label': t('close'), onclick: closeSheet }, '✕'));
  const acts = h('div', { class: 'sacts' }, where ? h('button', { class: 'act remove', onclick: () => { place(id, where); closeSheet(); } }, t('remove'))
    : [h('button', { class: 'act ally', onclick: () => { place(id, 'ally'); closeSheet(); } }, t('mAlly')), h('button', { class: 'act enemy', onclick: () => { place(id, 'enemy'); closeSheet(); } }, t('mEnemy'))]);
  const rel = (key, label, cls) => (x[key].length ? h('div', { class: 'srel ' + cls }, h('em', {}, label), minis(x[key]), h('p', { class: 'faint', 'data-desc': key })) : null);
  const body = el.querySelector('.sheetbody');
  const proBox = h('div', { class: 'builds' }, h('p', { class: 'faint' }, t('loading')));
  body.replaceChildren(head, acts, rel('strong', t('tagStrong'), 'good'), rel('weak', t('tagWeakTo'), 'bad'), rel('assist', t('tagPairs'), 'pair'), h('h3', {}, t('builds')), laneTabs, buildsBox,
    h('h3', {}, t('pro')), h('p', { class: 'faint pronote' }, t('proNote')), proBox);
  Promise.all([loadPro(), loadItems().catch(() => new Map())]).then(([pro, items]) => {
    if (D.open !== id) return;
    const mine = pro.filter(p => p.hero === norm(x.name) && p.items.length >= 6).slice(0, 4);
    proBox.replaceChildren(...(mine.length ? mine.map(p => h('div', { class: 'build' },
      h('div', { class: 'bhead' }, h('b', {}, p.player), h('span', {}, `${p.team} · MPL ${p.lg} · ${p.date}`), h('span', { class: p.win ? 'good' : 'bad' }, `${t(p.win ? 'won' : 'lost')} · ${p.kda}`)),
      h('div', { class: 'bitems' }, p.items.map(it => { const o = items.get(it.id) || {}; return h('span', { class: 'bitem', title: o.name || '' }, h('img', { src: it.img || o.icon || '', alt: '', loading: 'lazy' }), h('i', {}, o.name || '')); })),
      h('div', { class: 'bmeta' }, p.emblem ? h('span', {}, h('img', { src: p.emblem, alt: '' }), t('emblem')) : null, p.talents.length ? h('span', {}, p.talents.map(u => h('img', { src: u, alt: '' }))) : null)))
      : [h('p', { class: 'faint' }, t('proNone'))]));
  }).catch(e => { console.warn('pro', e.message); if (D.open === id) proBox.replaceChildren(h('p', { class: 'faint', title: e.message }, t('proFail'))); });
  body.scrollTop = 0; el.hidden = false; document.body.classList.add('sheetopen');
  showBuilds(x.lanes[0] || 'mid');
  const d = await loadDetail(id);
  if (d && D.open === id && !el.hidden) {
    body.querySelector('.stags').replaceChildren(...d.spec.map(s => h('span', { class: 'stag' }, s)));
    if (d.art) body.querySelector('.sart').src = d.art;
    for (const p of body.querySelectorAll('[data-desc]')) p.textContent = d.desc[p.dataset.desc] || '';
    const ci = await counterItems(x, d).catch(() => []);
    if (ci.length && D.open === id) body.querySelector('.sacts').after(h('div', { class: 'srel ci' }, h('em', {}, t('counterItems')),
      h('div', { class: 'cilist' }, ci.map(c => h('span', { class: 'ciitem', title: c.name }, c.icon ? h('img', { src: c.icon, alt: '', loading: 'lazy' }) : null, h('span', {}, h('b', {}, c.name), h('i', {}, t(c.why))))))));
  }
}
function closeSheet() { D.open = 0; $('sheet').hidden = true; document.body.classList.remove('sheetopen'); }
// holding a hero in the list opens its sheet; a short tap still picks
function holdToOpen(el, id) {
  let timer = 0, held = false, y0 = 0;
  el.addEventListener('pointerdown', e => { held = false; y0 = e.clientY; clearTimeout(timer); timer = setTimeout(() => { held = true; openSheet(id); }, 430); });
  el.addEventListener('pointermove', e => { if (Math.abs(e.clientY - y0) > 8) clearTimeout(timer); });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) el.addEventListener(ev, () => clearTimeout(timer));
  el.addEventListener('click', e => { if (held) { e.preventDefault(); e.stopImmediatePropagation(); held = false; } }, true);
  el.addEventListener('contextmenu', e => e.preventDefault());
}

// Draft DNA: both teams side by side on the game's own hero ratings (0 to 10, average of the picks), and the best pair
// in each team from the game's partner lists and the live teammate statistics. Estimates, not the stream's numbers.
function drawDna() {
  const box = $('dna'); if (!box) return;
  const avg = (list, i) => { const v = list.map(id => D.detail.get(id)).filter(d => d && d.ab.length > i).map(d => d.ab[i]); return v.length ? v.reduce((a, b) => a + b, 0) / v.length / 10 : null; };
  const rows = [['dnaDur', 0], ['dnaOff', 1], ['dnaCtl', 2]].map(([k, i]) => [t(k), avg(S.ally, i), avg(S.enemy, i)]).filter(r => r[1] != null && r[2] != null);
  const combo = list => { let best = null;
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = S.heroes.get(list[i]), b = S.heroes.get(list[j]); if (!a || !b) continue;
      let v = (a.assist.includes(b.id) ? 2 : 0) + (b.assist.includes(a.id) ? 2 : 0);
      const la = S.beside.get(a.id), lb = S.beside.get(b.id); if (la && la.good.has(b.id)) v += la.good.get(b.id) * 100; if (lb && lb.good.has(a.id)) v += lb.good.get(a.id) * 100;
      if (v > 0 && (!best || v > best.v)) best = { v, a, b };
    } return best; };
  const ca = combo(S.ally), ce = combo(S.enemy);
  if (!rows.length && !ca && !ce) { box.hidden = true; return; }
  box.hidden = false;
  const comboEl = (c, cls) => (c ? h('span', { class: 'combo ' + cls }, h('em', {}, t('combo')), h('img', { src: c.a.img, alt: '' }), h('img', { src: c.b.img, alt: '' }), `${c.a.name} + ${c.b.name}`) : h('span', {}));
  box.replaceChildren(h('div', { class: 'dnatitle' }, t('dna')),
    ...rows.map(([label, a, e]) => h('div', { class: 'dnarow' }, h('b', { class: a >= e ? 'lead' : '' }, a.toFixed(1)), h('div', { class: 'dnabar a' }, h('i', { style: `width:${a * 10}%` })), h('span', {}, label),
      h('div', { class: 'dnabar e' }, h('i', { style: `width:${e * 10}%` })), h('b', { class: e > a ? 'lead' : '' }, e.toFixed(1)))),
    ...(ca || ce ? [h('div', { class: 'combos' }, comboEl(ca, 'a'), comboEl(ce, 'e'))] : []));
}

// ---- counter items, analysis after the draft -----------------------------------------------------------------
// Items that work against a hero, chosen by simple rules from its roles and speciality tags (general game knowledge,
// not statistics). Only items the game's own item list knows by that name are shown, so a renamed item drops out.
const COUNTER_RULES = [
  [(x, d) => d.spec.includes('Regen'), 'ci_heal', ['Sea Halberd', 'Necklace of Durance', 'Dominance Ice']],
  [(x, d) => x.roles[0] === 'mage' || d.spec.includes('Magic Damage'), 'ci_magic', ['Athena\'s Shield', 'Radiant Armor']],
  [(x) => x.roles[0] === 'marksman', 'ci_mm', ['Blade Armor', 'Wind of Nature', 'Dominance Ice']],
  [(x, d) => x.roles[0] === 'assassin' || d.spec.includes('Burst'), 'ci_burst', ['Winter Crown', 'Winter Truncheon', 'Immortality']],
  [(x, d) => d.spec.includes('Crowd Control') || d.spec.includes('Control'), 'ci_cc', ['Tough Boots']],
  [(x, d) => x.roles[0] === 'tank' || d.spec.includes('Guard'), 'ci_tank', ['Demon Hunter Sword', 'Glowing Wand', 'Malefic Gun']],
];
async function counterItems(x, d) {
  const items = await loadItems(), byName = new Map([...items.values()].map(o => [o.name.toLowerCase(), o])), out = [], seen = new Set();
  for (const [test, why, names] of COUNTER_RULES) { if (!test(x, d)) continue; for (const n of names) { const o = byName.get(n.toLowerCase()); if (o && !seen.has(o.name)) { seen.add(o.name); out.push({ name: o.name, icon: o.icon, why }); } } }
  return out.slice(0, 6);
}

// The analysis screen (after the tenth pick, or by the Analysis button), modelled on the "team composition & win
// condition" graphic of tournament streams:
//   power by game length   /api/academy/heroes/<id>/win-rate/timeline?lane=   win rate in games of 10-12 ... 20+ minutes
//   lane matchups          the heroes are put on the five lanes by their usual lanes (tap a lane name to move one);
//                          the projection is 50% shifted by the matchup statistics, the game's strong/weak lists and
//                          the two heroes' win rates, kept between 35 and 65
//   win conditions         the team type (teamIdentity) and whether the team is better early or late
const AN = { lanes: { ally: {}, enemy: {} }, time: new Map() };
function assignLanes(side) {
  const ids = S[side].slice(0, 5), fixed = AN.lanes[side]; let best = null, bestScore = -1;
  const go = (i, used, cur, score) => { if (i === ids.length) { if (score > bestScore) { bestScore = score; best = { ...cur }; } return; }
    const x = S.heroes.get(ids[i]) || { lanes: [] };
    for (const l of LANE_ORDER) { if (used.has(l)) continue; const want = fixed[ids[i]]; const v = want ? (want === l ? 10 : -10) : l === x.lanes[0] ? 2 : x.lanes.includes(l) ? 1 : 0;
      used.add(l); cur[l] = ids[i]; go(i + 1, used, cur, score + v); used.delete(l); delete cur[l]; } };
  go(0, new Set(), {}, 0);
  return best || {};
}
const LANE_ORDER = ['exp', 'jungle', 'mid', 'gold', 'roam'];
async function loadTimeline(id, lane) {
  const key = `${id}.${lane}.${S.rank}`; if (AN.time.has(key)) return AN.time.get(key);
  let v = null;
  try { const recs = await api(`/academy/heroes/${id}/win-rate/timeline?lane=${lane}&rank=${S.rank}&lang=en`); const tw = arr(((recs[0] || {}).data || {}).time_win_rate);
    if (tw.length >= 3) v = tw.map(b => ({ from: b.time_min, w: Number(b.win_rate) || 0 })); } catch (e) { console.warn('timeline', id, e.message); }
  AN.time.set(key, v);
  return v;
}
function laneProjection(a, e) {   // chance of our hero a against their hero e on one lane, in percent
  if (!a || !e) return null;
  let p = 50 + (a.win - e.win) * 50;
  if (a.strong.includes(e.id) || e.weak.includes(a.id)) p += 4;
  if (a.weak.includes(e.id) || e.strong.includes(a.id)) p -= 4;
  const live = S.vs.get(e.id); if (live) { if (live.good.has(a.id)) p += live.good.get(a.id) * 100; if (live.bad.has(a.id)) p += live.bad.get(a.id) * 100; }
  return Math.max(35, Math.min(65, Math.round(p)));
}
async function openAnalysis() {
  if (!S.enemy.length || !S.ally.length) return;
  const el = $('analysis'), body = el.querySelector('.anbody'), LA = assignLanes('ally'), LE = assignLanes('enemy');
  el.hidden = false; AN.open = true;
  const heroCard = (id, side) => { const x = S.heroes.get(id); return x ? h('button', { class: 'ancard ' + side, title: x.name, onclick: () => openSheet(x.id) }, h('img', { src: x.img, alt: '' }), h('span', {}, x.name)) : h('span', { class: 'ancard none' }); };
  const move = (side, lane) => { const map = side === 'ally' ? LA : LE, id = map[lane]; if (!id) return; const next = LANE_ORDER[(LANE_ORDER.indexOf(lane) + 1) % 5], other = map[next];
    AN.lanes[side] = { ...Object.fromEntries(Object.entries(map).map(([l, i]) => [i, l])), [id]: next }; if (other) AN.lanes[side][other] = lane; openAnalysis(); };
  const spec = id => { const d = D.detail.get(id); return d && d.spec.length ? d.spec[0] : ''; };
  const laneRows = LANE_ORDER.map(l => { const a = S.heroes.get(LA[l]), e = S.heroes.get(LE[l]), p = laneProjection(a, e);
    return h('div', { class: 'anlane' }, h('div', { class: 'anlanehead' }, h('button', { class: 'lanebtn a', onclick: () => move('ally', l), 'aria-label': t(l) }, '⇄'), h('b', {}, t(l)), h('button', { class: 'lanebtn e', onclick: () => move('enemy', l), 'aria-label': t(l) }, '⇄')),
      h('div', { class: 'anlanerow' }, heroCard(LA[l], 'ally'),
        h('div', { class: 'anproj' }, p == null ? h('span', { class: 'faint' }, '–') : [h('div', { class: 'projbar' }, h('i', { class: p >= 50 ? 'a' : 'e', style: `width:${p >= 50 ? p : 100 - p}%;margin-left:${p >= 50 ? 0 : p}%` })), h('b', { class: p >= 50 ? 'a' : 'e' }, `${p >= 50 ? '◀' : ''} ${p >= 50 ? p : 100 - p}% ${p < 50 ? '▶' : ''}`),
          h('span', { class: 'faint' }, [spec(LA[l]), spec(LE[l])].filter(Boolean).join(' vs. '))]),
        heroCard(LE[l], 'enemy'))); });
  const spikeBox = h('div', { class: 'anspike' }, h('p', { class: 'faint' }, t('loading'))), winBox = h('div', { class: 'anwin' });
  body.replaceChildren(h('div', { class: 'anhead' }, h('h2', {}, t('anTitle')), h('button', { class: 'sclose', 'aria-label': t('close'), onclick: closeAnalysis }, '✕')),
    h('h3', {}, t('anSpike')), spikeBox, h('p', { class: 'faint' }, t('anSpikeNote')),
    h('h3', {}, t('anLanes')), h('div', { class: 'anlanes' }, laneRows), h('p', { class: 'faint' }, t('anLaneNote')),
    h('h3', {}, t('anWin')), winBox, h('p', { class: 'faint' }, t('anEst')));
  const curve = async map => { const rows = (await Promise.all(Object.entries(map).map(([l, id]) => loadTimeline(id, l)))).filter(Boolean); if (!rows.length) return null;
    const n = Math.min(...rows.map(r => r.length)); return Array.from({ length: n }, (_, i) => ({ from: rows[0][i].from, w: rows.reduce((s, r) => s + r[i].w, 0) / rows.length })); };
  const [ca, ce] = await Promise.all([curve(LA), curve(LE)]);
  if (!AN.open) return;
  const timing = c => (!c ? 'Even' : c[0].w - c[c.length - 1].w > 0.012 ? 'Early' : c[c.length - 1].w - c[0].w > 0.012 ? 'Late' : 'Even');
  const box = (side, list, c) => { const idk = teamIdentity(list) || 'id_team', tm = timing(c);
    return h('div', { class: 'wcbox ' + side }, h('b', {}, `${t(idk)[0]} · ${t('t' + tm)}`), h('ul', {}, [...t('wc_' + idk), t('b' + tm)].map(s => h('li', {}, s)))); };
  winBox.replaceChildren(box('ally', S.ally, ca), box('enemy', S.enemy, ce));
  if (!ca && !ce) { spikeBox.replaceChildren(h('p', { class: 'faint' }, t('noBuild'))); return; }
  const all = [...(ca || []), ...(ce || [])].map(p => p.w), lo = Math.min(...all, 0.47) - 0.005, hi = Math.max(...all, 0.53) + 0.005, W = 300, H = 90;
  const pts = c => c.map((p, i) => `${(i * W / (c.length - 1)).toFixed(1)},${(H - (p.w - lo) / (hi - lo) * H).toFixed(1)}`).join(' ');
  const base = ca || ce, svg = `<svg viewBox="-4 -6 ${W + 8} ${H + 12}" preserveAspectRatio="none" role="img"><line x1="0" x2="${W}" y1="${(H - (0.5 - lo) / (hi - lo) * H).toFixed(1)}" y2="${(H - (0.5 - lo) / (hi - lo) * H).toFixed(1)}" class="mid"/>${ca ? `<polyline class="a" points="${pts(ca)}"/>` : ''}${ce ? `<polyline class="e" points="${pts(ce)}"/>` : ''}</svg>`;
  const wrap = h('div', { class: 'spikesvg' }); wrap.innerHTML = svg;
  const ends = c => (c ? `${(c[0].w * 100).toFixed(1)}% → ${(c[c.length - 1].w * 100).toFixed(1)}%` : '–');
  spikeBox.replaceChildren(h('div', { class: 'spikelegend' }, h('span', { class: 'a' }, `${t('ally')}: ${ends(ca)}`), h('span', { class: 'e' }, `${t('enemy')}: ${ends(ce)}`)), wrap,
    h('div', { class: 'spikeaxis' }, base.map((p, i) => h('span', {}, i === base.length - 1 ? `${p.from}+` : String(p.from)))));
}
function closeAnalysis() { AN.open = false; $('analysis').hidden = true; }

// ---- start -----------------------------------------------------------------------------------------------------
function applyLang() {
  document.documentElement.lang = S.lang;
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
  $('q').placeholder = t('search');
  $('dataNote').textContent = S.ready ? T[S.lang].data($('rank').selectedOptions[0].textContent, S.days) : '';
  drawPhase(false); drawChips(); drawGrid(); drawSuggest();
}
async function boot(force) {
  S.ready = false; S.failed = false; drawGrid(); drawSuggest();
  try { await loadHeroes(force); S.ready = true; } catch (e) { console.warn('load', e.message); S.failed = true; }
  // a draft in the address (#d=enemy ids/ally ids/ban ids, e.g. #d=30,88/45/132) wins over the one kept in the browser
  const m = /^#d=([\d,]*)\/([\d,]*)\/?([\d,]*)/.exec(location.hash), nums = s => s.split(',').map(Number).filter(Boolean);
  const d = m ? { enemy: nums(m[1]), ally: nums(m[2]), bans: nums(m[3]) } : store.get('draft', null);
  if (S.ready && d && !boot.restored) { boot.restored = true; for (const k of ['enemy', 'ally']) S[k] = (d[k] || []).filter(i => S.heroes.has(i)).slice(0, 5); S.bans = []; S.enemy.forEach(i => loadRelation('counters', i)); S.ally.forEach(i => loadRelation('compatibility', i)); [...S.enemy, ...S.ally].forEach(loadDetail); }
  drawPhase.last = -1; const ph = phase(); setMode(ph.kind === 'ban' ? 'ban' : 'enemy'); drawPhase.last = ph.i;
  applyLang(); drawBoard(); drawDna();
  if (S.ready && /[#&]analysis/.test(location.hash) && !boot.an) { boot.an = true; setTimeout(openAnalysis, 600); }   // #...&analysis opens the analysis screen (support, screenshots)
  const sm = /[#&]sheet=(\d+)/.exec(location.hash); if (S.ready && sm && !boot.sheet) { boot.sheet = true; openSheet(Number(sm[1])); }   // #...&sheet=<id> opens a hero's sheet (support, screenshots)
}
for (const b of document.querySelectorAll('.mode')) b.addEventListener('click', () => setMode(b.dataset.mode));
$('q').addEventListener('input', e => { S.q = e.target.value; drawGrid(); });
$('sort').value = S.sort; $('sort').addEventListener('change', e => { S.sort = e.target.value; store.set('sort', S.sort); drawGrid(); });
$('btnReset').addEventListener('click', () => { S.enemy = []; S.ally = []; S.bans = []; store.set('draft', { enemy: [], ally: [], bans: [] }); S.skipped = 0; drawPhase.last = -1; place.wasFull = false; setMode('enemy'); drawPhase(true); drawGrid(); drawSuggest(); drawDna(); });
$('sheet').querySelector('.sheetback').addEventListener('click', () => closeSheet());
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('sheet').hidden) closeSheet(); else closeAnalysis(); } });
$('btnMenu').addEventListener('click', () => $('menu').showModal());
$('lang').value = S.lang; $('lang').addEventListener('change', e => { S.lang = e.target.value; store.set('lang', S.lang); applyLang(); });
$('rank').value = S.rank; $('rank').addEventListener('change', e => { S.rank = e.target.value; store.set('rank', S.rank); S.vs.clear(); S.beside.clear(); boot(false); });
$('days').value = String(S.days); $('days').addEventListener('change', e => { S.days = Number(e.target.value); store.set('days', S.days); S.vs.clear(); S.beside.clear(); boot(false); });
$('btnRefresh').addEventListener('click', () => { S.vs.clear(); S.beside.clear(); boot(true); $('menu').close(); });
document.body.dataset.mode = S.mode;
document.body.dataset.design = S.design;
boot(false);
