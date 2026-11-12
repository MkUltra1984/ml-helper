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
    build: 'Build', builds: 'Builds players use', used: 'used by', emblem: 'Emblem', noBuild: 'No build data for this lane.', remove: 'Take out of the draft', sPickShort: 'Pick', sBanShort: 'Ban', tagWeakTo: 'Weak against',
    pro: 'Pro builds', proNote: 'from the latest MPL Indonesia games', proNone: 'None of the latest pro games had this hero.', proFail: 'The pro games could not be loaded.', won: 'won', lost: 'lost',
    dna: 'Draft DNA', dnaDur: 'Durability', dnaOff: 'Damage', dnaCtl: 'Skill effects', combo: 'Combo', banTitle: 'Worth banning', hurts: 'counters your', holdHint: 'Tap picks. Hold a hero for builds and matchups.',
    id_pick: ['Pick-off', 'Assassins hunt single targets. Avoid long fights.'], id_ftb: ['Front to back', 'A frontline protects the damage dealers in the back.'], id_dive: ['Dive', 'Everyone jumps the enemy backline together.'],
    id_poke: ['Poke & burst', 'Mages wear the enemy down before the fight starts.'], id_sustain: ['Sustain', 'Supports keep the team alive through long fights.'], id_team: ['Teamfight', 'Strongest when all five fight together.'],
    mEnemy: 'Enemy pick', mAlly: 'Our pick', mBan: 'Ban', mFav: '★ Edit my heroes', sPick: 'Most picked', sWin: 'Win rate', sBan: 'Most banned', sName: 'Name',
    settings: 'Settings', lang: 'Language', rank: 'Statistics from rank', days: 'Time window (days)', refresh: 'Reload game data', close: 'Close',
    credit: 'Unofficial fan tool. Game data © Moonton (Mobile Legends: Bang Bang), read through the public API of RoneAI (arena.rone.dev). Not affiliated with or endorsed by Moonton. You enter the draft by hand; this page does not read or touch the game.',
    exp: 'Exp', jungle: 'Jungle', mid: 'Mid', gold: 'Gold', roam: 'Roam', tank: 'Tank', fighter: 'Fighter', assassin: 'Assassin', mage: 'Mage', marksman: 'Marksman', support: 'Support',
    search: 'Search hero', empty: 'Tap the enemy picks and the page suggests heroes.', none: 'No hero fits these filters.', loading: 'Loading heroes…', failed: 'Could not load the game data. Check the connection and press reload.',
    strong: 'strong against', pairs: 'pairs with', weak: 'careful:', meta: 'win rate', full: 'That side is full.', favHint: 'Tap heroes you play. They show first and can be the only ones suggested.', taken: 'already taken',
    data: (r, d) => `${r} · ${d} days`, all: 'All' },
  de: { title: 'ML Helper', sMeta: 'Meta-Picks', reset: 'Neuer Draft', enemy: 'Gegner', ally: 'Dein Team', bans: 'Bans', suggest: 'Warum dieser Pick?', poolOnly: 'nur meine Helden', tagStrong: 'Kontert', tagPairs: 'Kombo', tagWeak: 'Vorsicht', tagMeta: 'Meta-Pick',
    build: 'Build', builds: 'Builds der Spieler', used: 'genutzt von', emblem: 'Emblem', noBuild: 'Keine Build-Daten für diese Lane.', remove: 'Aus dem Draft nehmen', sPickShort: 'Pick', sBanShort: 'Ban', tagWeakTo: 'Schwach gegen',
    pro: 'Profi-Builds', proNote: 'aus den letzten Spielen der MPL Indonesia', proNone: 'In den letzten Profi-Spielen kam dieser Held nicht vor.', proFail: 'Die Profi-Spiele konnten nicht geladen werden.', won: 'gewonnen', lost: 'verloren',
    dna: 'Draft-DNA', dnaDur: 'Standfestigkeit', dnaOff: 'Schaden', dnaCtl: 'Fähigkeiten', combo: 'Kombo', banTitle: 'Bannen lohnt sich', hurts: 'kontert deine', holdHint: 'Tippen wählt. Held gedrückt halten für Builds und Matchups.',
    id_pick: ['Pick-off', 'Assassinen jagen einzelne Ziele. Lange Kämpfe meiden.'], id_ftb: ['Front to back', 'Eine Frontlinie schützt die Schadensverursacher dahinter.'], id_dive: ['Dive', 'Alle springen gemeinsam auf die gegnerische Backline.'],
    id_poke: ['Poke & Burst', 'Magier zermürben den Gegner, bevor der Kampf beginnt.'], id_sustain: ['Sustain', 'Supporter halten das Team in langen Kämpfen am Leben.'], id_team: ['Teamfight', 'Am stärksten, wenn alle fünf zusammen kämpfen.'],
    mEnemy: 'Gegner-Pick', mAlly: 'Unser Pick', mBan: 'Ban', mFav: '★ Meine Helden wählen', sPick: 'Meistgewählt', sWin: 'Siegrate', sBan: 'Meistgebannt', sName: 'Name',
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
  favs: new Set(store.get('favs', [])), poolOnly: store.get('poolOnly', false), sort: store.get('sort', 'meta'),
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
  const key = `heroes2.${S.rank}.${S.days}`, cached = store.get(key, null);
  if (!force && cached && Date.now() - cached.at < 12 * 3600 * 1000) { S.heroes = new Map(cached.list.map(x => [x.id, x])); return; }
  const [pos, rank] = await Promise.all([api('/heroes/positions?size=300&index=1&lang=en'), api(`/heroes/rank?days=${S.days}&rank=${S.rank}&size=300&index=1&sort_field=pick_rate&sort_order=desc`)]);
  const map = new Map();
  for (const rec of pos) {
    const d = rec.data || {}, hero = d.hero || {}, info = hero.data || {}, rel = d.relation || hero.relation || {};
    const id = Number(d.hero_id ?? hero.hero_id); if (!id) continue;
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
  store.set(key, { at: Date.now(), list: [...map.values()] });
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
  $('sugTitle').textContent = t(!S.enemy.length && !S.ally.length ? 'banTitle' : 'suggest');
  if (!S.enemy.length && !S.ally.length) {
    // nothing picked yet: the most banned heroes right now, lifted when they counter heroes you play
    const threat = new Map(); for (const f of S.favs) { const fh = S.heroes.get(f); if (fh) for (const w of fh.weak) threat.set(w, [...(threat.get(w) || []), fh.name]); }
    const bans = [...S.heroes.values()].map(x => ({ x, s: x.ban * 10 + (threat.get(x.id) || []).length * 1.5 + (x.win - 0.5) * 10 })).sort((a, b) => b.s - a.s).slice(0, 6);
    box.replaceChildren(...bans.map(({ x }, i) => h('button', { class: 'sug' + (i === 0 ? ' top' : ''), title: x.name, onclick: () => openSheet(x.id) }, h('img', { src: x.img, alt: '', loading: 'lazy' }),
      h('span', { class: 'sugtext' }, h('b', {}, x.name, h('i', { class: 'lane' }, x.lanes.map(l => t(l)).join(' / '))),
        h('span', { class: 'why bad' }, h('em', {}, t('mBan')), `${t('sBanShort')} ${(x.ban * 100).toFixed(0)}% · ${t('meta')} ${(x.win * 100).toFixed(1)}%`),
        threat.has(x.id) ? h('span', { class: 'why' }, h('em', {}, t('tagWeak')), `${t('hurts')} ${threat.get(x.id).join(', ')}`) : null))));
    return;
  }
  const used = taken();
  const list = [...S.heroes.values()].filter(x => !used.has(x.id) && passesFilter(x) && (!S.poolOnly || !S.favs.size || S.favs.has(x.id)))
    .map(x => ({ x, r: scoreHero(x) })).sort((a, b) => b.r.s - a.r.s || b.x.pick - a.x.pick).slice(0, 8);
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
function place(id, mode) {
  if (mode === 'fav') { if (S.favs.has(id)) S.favs.delete(id); else S.favs.add(id); store.set('favs', [...S.favs]); drawGrid(); drawSuggest(); return; }
  const side = SIDES[mode], list = side.list();
  if (taken().has(id)) { // a second tap on a taken hero takes it out again
    for (const k of ['enemy', 'ally', 'bans']) { const i = S[k].indexOf(id); if (i >= 0) S[k].splice(i, 1); }
  } else {
    if (list.length >= side.max) { toast(t('full')); return; }
    list.push(id);
    if (mode === 'enemy') loadRelation('counters', id);
    if (mode === 'ally') loadRelation('compatibility', id);
    loadDetail(id);
  }
  store.set('draft', { enemy: S.enemy, ally: S.ally, bans: S.bans });
  drawBoard(); drawGrid(); drawSuggest(); drawDna();
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
const SLOT_LANES = ['exp', 'jungle', 'mid', 'roam', 'gold'];
function drawBoard() {
  for (const [el, list] of [['identEnemy', S.enemy], ['identAlly', S.ally]]) { const k = teamIdentity(list), box = $(el); box.textContent = k ? t(k)[0] : ''; box.title = k ? t(k)[1] : ''; }
  for (const [mode, side] of Object.entries(SIDES)) {
    const list = side.list(), kids = [];
    for (let i = 0; i < side.max; i++) {
      const x = S.heroes.get(list[i]);
      kids.push(x ? h('button', { class: 'slot filled', title: x.name, onclick: () => openSheet(x.id) }, h('img', { src: x.img, alt: x.name }), h('span', {}, x.name))
        : h('button', { class: 'slot' + (S.mode === mode && i === list.length ? ' next' : ''), onclick: () => setMode(mode) }, h('i', { class: 'lanehint' }, t(SLOT_LANES[i]))));
    }
    $(side.el).replaceChildren(...kids);
  }
}
function setMode(mode) {
  S.mode = mode;
  for (const b of document.querySelectorAll('.mode')) b.classList.toggle('on', b.dataset.mode === mode);
  document.body.dataset.mode = mode;
  if (mode === 'fav') toast(t('favHint'));
  drawBoard();
}

// ---- hero grid -------------------------------------------------------------------------------------------------
function drawChips() {
  const chip = (set, key) => h('button', { class: 'chip' + (set.has(key) ? ' on' : ''), onclick: () => { if (set.has(key)) set.delete(key); else set.add(key); drawChips(); drawGrid(); drawSuggest(); } }, t(key));
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
// Pro builds: what players built in the latest MPL Indonesia games (the league's public match pages, through the same
// API). The schedule and the last 10 finished matches are read once and kept for a day: about 11 requests.
//   /api/esports/id/schedule        weeks > days > matches { match_id, start_at, status, team1, team2 }
//   /api/esports/id/matches/<id>    games > teams > players { name, hero { name }, kills, deaths, assists, items, emblem, talents }
async function loadPro() {
  if (D.pro) return D.pro;
  const c = store.get('pro', null);
  if (c && Date.now() - c.at < 24 * 3600 * 1000) return D.pro = c.list;
  const raw = async path => { const r = await fetch(API + path, { headers: { Accept: 'application/json' } }); if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.json(); };
  const sched = await raw('/esports/id/schedule');
  const matches = arr(sched.weeks).flatMap(w => arr(w.days).flatMap(d => arr(d.matches))).filter(m => m.status === 'finished' && m.match_id != null)
    .sort((a, b) => String(b.start_at).localeCompare(String(a.start_at))).slice(0, 10);
  const list = [];
  await Promise.all(matches.map(async m => {
    try {
      const det = await raw(`/esports/id/matches/${m.match_id}`);
      for (const g of arr(det.games)) for (const tm of arr(g.teams)) for (const p of arr(tm.players)) {
        if (!p.hero || !p.hero.name) continue;
        list.push({ hero: norm(p.hero.name), player: p.name || '', team: (tm.team || {}).name || '', date: String(m.start_at || '').slice(0, 10), win: !!tm.winner, kda: [p.kills, p.deaths, p.assists].map(n => n ?? 0).join(' / '),
          items: arr(p.items).map(i => ({ id: Number(i.id), img: i.image || '' })), emblem: (p.emblem || {}).image || '', talents: arr(p.talents).map(x => x.image || '').filter(Boolean) });
      }
    } catch (e) { console.warn('pro match', m.match_id, e.message); }
  }));
  list.sort((a, b) => b.date.localeCompare(a.date));
  if (list.length) store.set('pro', { at: Date.now(), list });
  return D.pro = list;
}
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// The sheet that slides up from the bottom: who the hero is, pick buttons, matchups, and builds per lane.
async function openSheet(id) {
  const x = S.heroes.get(id); if (!x) return;
  D.open = id;
  const el = $('sheet'), where = S.enemy.includes(id) ? 'enemy' : S.ally.includes(id) ? 'ally' : '';
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
    const mine = pro.filter(p => p.hero === norm(x.name)).slice(0, 4);
    proBox.replaceChildren(...(mine.length ? mine.map(p => h('div', { class: 'build' },
      h('div', { class: 'bhead' }, h('b', {}, p.player), h('span', {}, `${p.team} · ${p.date}`), h('span', { class: p.win ? 'good' : 'bad' }, `${t(p.win ? 'won' : 'lost')} · ${p.kda}`)),
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

// ---- start -----------------------------------------------------------------------------------------------------
function applyLang() {
  document.documentElement.lang = S.lang;
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
  $('q').placeholder = t('search');
  $('dataNote').textContent = S.ready ? T[S.lang].data($('rank').selectedOptions[0].textContent, S.days) : '';
  drawChips(); drawGrid(); drawSuggest();
}
async function boot(force) {
  S.ready = false; S.failed = false; drawGrid(); drawSuggest();
  try { await loadHeroes(force); S.ready = true; } catch (e) { console.warn('load', e.message); S.failed = true; }
  // a draft in the address (#d=enemy ids/ally ids/ban ids, e.g. #d=30,88/45/132) wins over the one kept in the browser
  const m = /^#d=([\d,]*)\/([\d,]*)\/?([\d,]*)/.exec(location.hash), nums = s => s.split(',').map(Number).filter(Boolean);
  const d = m ? { enemy: nums(m[1]), ally: nums(m[2]), bans: nums(m[3]) } : store.get('draft', null);
  if (S.ready && d && !boot.restored) { boot.restored = true; for (const k of ['enemy', 'ally', 'bans']) S[k] = (d[k] || []).filter(i => S.heroes.has(i)); S.enemy.forEach(i => loadRelation('counters', i)); S.ally.forEach(i => loadRelation('compatibility', i)); [...S.enemy, ...S.ally].forEach(loadDetail); }
  applyLang(); drawBoard(); drawDna();
  const sm = /[#&]sheet=(\d+)/.exec(location.hash); if (S.ready && sm && !boot.sheet) { boot.sheet = true; openSheet(Number(sm[1])); }   // #...&sheet=<id> opens a hero's sheet (support, screenshots)
}
for (const b of document.querySelectorAll('.mode')) b.addEventListener('click', () => setMode(b.dataset.mode));
$('q').addEventListener('input', e => { S.q = e.target.value; drawGrid(); });
$('sort').value = S.sort; $('sort').addEventListener('change', e => { S.sort = e.target.value; store.set('sort', S.sort); drawGrid(); });
$('poolOnly').checked = S.poolOnly; $('poolOnly').addEventListener('change', e => { S.poolOnly = e.target.checked; store.set('poolOnly', S.poolOnly); drawSuggest(); });
$('btnReset').addEventListener('click', () => { S.enemy = []; S.ally = []; S.bans = []; store.set('draft', { enemy: [], ally: [], bans: [] }); setMode('enemy'); drawGrid(); drawSuggest(); drawDna(); });
$('sheet').querySelector('.sheetback').addEventListener('click', () => closeSheet());
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
$('btnMenu').addEventListener('click', () => $('menu').showModal());
$('lang').value = S.lang; $('lang').addEventListener('change', e => { S.lang = e.target.value; store.set('lang', S.lang); applyLang(); });
$('rank').value = S.rank; $('rank').addEventListener('change', e => { S.rank = e.target.value; store.set('rank', S.rank); S.vs.clear(); S.beside.clear(); boot(false); });
$('days').value = String(S.days); $('days').addEventListener('change', e => { S.days = Number(e.target.value); store.set('days', S.days); S.vs.clear(); S.beside.clear(); boot(false); });
$('btnRefresh').addEventListener('click', () => { S.vs.clear(); S.beside.clear(); boot(true); $('menu').close(); });
document.body.dataset.mode = S.mode;
document.body.dataset.design = S.design;
boot(false);
