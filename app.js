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
// the game's rank emblems, as listed by /api/academy/ranks (Mythic, Mythical Honor, Mythical Glory)
const RANK_IMG = 'https://wsrv.nl/?url=https%3A%2F%2Fakmweb.youngjoygame.com%2Fweb%2Fgms%2Fimage%2F';
const RANK_ICONS = { mythic: 'img/rank-mythic.png', honor: 'img/rank-honor.png', glory: 'img/rank-glory.png' };   // own redrawn emblems (tools/rank-icons.py), the game's colours kept
const ROLES = ['tank', 'fighter', 'assassin', 'mage', 'marksman', 'support'];
// Own symbols for the hero types and lanes (white shapes in img/, made with tools/*-icons.py: the game's silhouettes drawn as an upgraded tier)
const OWN_ICONS = { lanes: Object.fromEntries(LANES.map(k => [k, `img/lane-${k}.png`])), roles: Object.fromEntries(ROLES.map(k => [k, `img/role-${k}.png`])) };
const T = {
  en: { title: 'MLBB Helper', sMeta: 'Meta picks', reset: 'New draft', enemy: 'Enemy', ally: 'Your team', bans: 'Bans', suggest: 'Why this pick?', poolOnly: 'my heroes only', tagStrong: 'Counters', tagPairs: 'Combo', tagWeak: 'Careful', tagMeta: 'Meta pick',
    build: 'Build', builds: 'Core items players use', used: 'used by', emblem: 'Emblem', noBuild: 'No build data for this lane.', remove: 'Take out of the draft', undo: 'Undo', tabMpl: 'MPL', tabMplLong: 'MPL: matches and standings', mplMatches: 'Matches', mplStand: 'Standings', mplGames: 'Games', mplWeek: 'Week', mplPlayoffs: 'Playoffs', mplReplay: 'Replay', mplUpcoming: 'Upcoming', mplResults: 'Results', mplNone: 'No data for this league right now.', proLate: 'Late or situational, to consider:', rkTitle: 'By rank', rkShow: 'Compare ranks', tabDraft: 'Draft', tabMeta: 'Meta', tabDraftLong: 'Back to the draft', tabMetaLong: 'Meta: all heroes by win rate', mtWin: 'Win', mtPick: 'Pick', mtBan: 'Ban', anBack: 'Draft', anBackLong: 'Back to the draft', and: 'and', vdLabel: 'Verdict', vdEstimate: 'Estimate', vdYouBig: 'Your team is favoured', vdYouSmall: 'Small edge: your team', vdEven: 'Even draft', vdEnemySmall: 'Small edge: enemy', vdEnemyBig: 'The enemy is favoured', vdNothing: 'Nothing separates the teams clearly.', vdLeadYou: 'You lead in {0}.', vdLeadEnemy: 'The enemy leads in {0}.', chMatch: 'Matchups', chPairs: 'Pairs', chRate: 'Ratings', gpTitle: 'Your game plan', gpProtect: 'Play around {0}; {1} goes in first.', gpAround: 'Play around {0}.', gpGap: 'You have no {0}; the enemy has it with {1}.', gpThreat: '{0} is their biggest damage threat.', gpHeal: 'Buy anti-heal against {0}.', gpEnemy: 'Enemy plan: {0} around {1}.', gpEnemyNo: 'Enemy plan: {0}.', wcSame: 'Same plan as your team: the better fight decides.', rlCarry: 'Carry', rlFront: 'Front', rlPeel: 'Peel', rlFlank: 'Flank', rlFlex: 'Flex', ckTitle: 'Checklist', ckFront: 'Front line', ckCc: 'Crowd control', ckEngage: 'Engage', ckBurst: 'Burst', ckPoke: 'Poke', ckSustain: 'Sustain', ckYes: '✓ Yes', ckPart: '◐ Partly', ckMiss: '✕ Missing', thTitle: 'Threats and what to buy', thBuy: 'Buy,', thBanned: 'Often banned, still picked:', thNote: 'Tap a hero for the full item list.', mmTitle: 'Key matchups', mmYou: 'You have the upper hand', mmEnemy: 'The enemy has the upper hand', mmNone: 'No clear hero-against-hero edge.', mmListed: '{0} is listed as strong against {1}', mmStat: '{0} wins more games against {1}', edClear: 'Clear edge', edSmall: 'Small edge', lnTitle: 'Assumed lanes', lnNote: 'Lanes are guesses. Tap a lane to change it.', lpMove: 'Move {0} to:', anFoot: 'Advice, not a prediction. Built from the game data (counter lists and statistics, ratings, tags) and simple rules. One dot or arrow is a small edge, two are a clear edge.',  trendUp: 'Rising this week', trendDown: 'Falling this week', laneChange: 'Change lane', sPickShort: 'Pick', sBanShort: 'Ban', tagWeakTo: 'Weak against',
    pro: 'Pro builds', proNote: 'Standard builds from games the player won, newest pro games first (MPL Indonesia, Philippines, Malaysia). Items bought late or for one situation are listed apart.', proNone: 'No full build for this hero in the newest pro games.', proFail: 'The pro games could not be loaded.', won: 'won', lost: 'lost',
    dna: 'Draft DNA', dnaEarly: 'Short games', dnaMid: 'Mid-length', dnaLate: 'Long games', dnaOff: 'Damage', dnaCc: 'Control', dnaSus: 'Sustain', dnaYou: 'You', dnaThem: 'Enemy', dnaEven: 'Even', combo: 'Combo', banTitle: 'Worth banning', hurts: 'counters your', holdHint: 'Tap picks. Hold a hero for builds and matchups.',
    id_pick: ['Pick-off', 'Assassins hunt single targets. Avoid long fights.'], id_ftb: ['Front to back', 'A frontline protects the damage dealers in the back.'], id_dive: ['Dive', 'Everyone jumps the enemy backline together.'],
    id_poke: ['Poke & burst', 'Mages wear the enemy down before the fight starts.'], id_sustain: ['Sustain', 'Supports keep the team alive through long fights.'], id_team: ['Teamfight', 'Strongest when all five fight together.'],
    mEnemy: 'Enemy pick', mAlly: 'Our pick', mBan: 'Ban', mFav: '★ My heroes', startLane: 'Lane', startRole: 'Role', startMine: 'My heroes', startHint: 'Pick a type.', back: 'Back', rankAsk: 'Your rank?', in0: 'Keep this page open beside the game during the draft.', in1: 'Tap what the enemy and your team pick.', in2: 'See which heroes fit, and why.', in3: 'Hold a hero for builds and counter items.', inOk: 'Got it', inHelp: 'How it works', oops: 'Something went wrong here. Please reload the page.', rk_mythic: 'Mythic', rk_honor: 'Mythical Honor', rk_glory: 'Mythical Glory+', lnWr: 'win rate', lnEarly: 'short', lnLate: 'long', lnCounters: 'counters', lnEarlyEdge: 'wins short games more often', lnLateEdge: 'wins long games more often', lnLaneEdge: 'has the better win rate on this lane', ph_short: 'strong in short games', ph_mid: 'strong in mid-length games', ph_long: 'strong in long games', ph_even: 'steady at any game length', lnOnLane: 'on this lane', lnEven: 'Even matchup', analysis: 'Analysis', anTitle: 'Team composition & win conditions', anSpike: 'Team power by game length', anSpikeNote: 'Average win rate of the five heroes in games of that length (minutes).', anLanes: 'Lane matchups',
    anLaneNote: 'Win projection per lane, an estimate: mostly the win rate of each hero on that lane, plus the counter lists of the game. "Short" and "long" are win rates in games of under 12 and over 20 minutes; they say how the games of a hero end, not who wins the laning phase. The lanes are a guess: tap the lane under a hero to change it. Tap a hero for builds and counter items.', anWin: 'Core win conditions', anEst: 'All of this is calculated from public statistics and simple rules. Treat it as a hint, not a verdict.',
    tEarly: 'Wins short games', tLate: 'Wins long games', tEven: 'No timing edge', bEarly: 'Strongest in short games: press the lead and end before 16 minutes', bLate: 'Stronger the longer it goes: farm safely and stall', bEven: 'No clear timing edge: play around Turtle and Lord',
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
  de: { title: 'MLBB Helper', sMeta: 'Meta-Picks', reset: 'Neuer Draft', enemy: 'Gegner', ally: 'Dein Team', bans: 'Bans', suggest: 'Warum dieser Pick?', poolOnly: 'nur meine Helden', tagStrong: 'Kontert', tagPairs: 'Kombo', tagWeak: 'Vorsicht', tagMeta: 'Meta-Pick',
    build: 'Build', builds: 'Kern-Items der Spieler', used: 'genutzt von', emblem: 'Emblem', noBuild: 'Keine Build-Daten für diese Lane.', remove: 'Aus dem Draft nehmen', undo: 'Rückgängig', tabMpl: 'MPL', tabMplLong: 'MPL: Spiele und Tabelle', mplMatches: 'Spiele', mplStand: 'Tabelle', mplGames: 'Games', mplWeek: 'Woche', mplPlayoffs: 'Playoffs', mplReplay: 'Replay', mplUpcoming: 'Demnächst', mplResults: 'Ergebnisse', mplNone: 'Für diese Liga gibt es gerade keine Daten.', proLate: 'Spät oder situativ, je nach Spiel:', rkTitle: 'Nach Rang', rkShow: 'Ränge vergleichen', tabDraft: 'Draft', tabMeta: 'Meta', tabDraftLong: 'Zurück zum Draft', tabMetaLong: 'Meta: alle Helden nach Siegrate', mtWin: 'Sieg', mtPick: 'Pick', mtBan: 'Bann', anBack: 'Draft', anBackLong: 'Zurück zum Draft', and: 'und', vdLabel: 'Einschätzung', vdEstimate: 'Schätzung', vdYouBig: 'Dein Team ist im Vorteil', vdYouSmall: 'Leichter Vorteil: dein Team', vdEven: 'Ausgeglichener Draft', vdEnemySmall: 'Leichter Vorteil: Gegner', vdEnemyBig: 'Der Gegner ist im Vorteil', vdNothing: 'Nichts trennt die Teams deutlich.', vdLeadYou: 'Du liegst vorn bei {0}.', vdLeadEnemy: 'Der Gegner liegt vorn bei {0}.', chMatch: 'Matchups', chPairs: 'Paare', chRate: 'Werte', gpTitle: 'Dein Spielplan', gpProtect: 'Spielt um {0}; {1} geht zuerst rein.', gpAround: 'Spielt um {0}.', gpGap: 'Euch fehlt {0}; der Gegner hat das mit {1}.', gpThreat: '{0} ist ihre größte Schadensgefahr.', gpHeal: 'Kauft Anti-Heal gegen {0}.', gpEnemy: 'Plan des Gegners: {0} um {1}.', gpEnemyNo: 'Plan des Gegners: {0}.', wcSame: 'Gleicher Plan wie dein Team: der bessere Kampf entscheidet.', rlCarry: 'Carry', rlFront: 'Front', rlPeel: 'Schutz', rlFlank: 'Flanke', rlFlex: 'Flex', ckTitle: 'Checkliste', ckFront: 'Frontlinie', ckCc: 'Kontrolle', ckEngage: 'Engage', ckBurst: 'Burst', ckPoke: 'Poke', ckSustain: 'Standfestigkeit', ckYes: '✓ Ja', ckPart: '◐ Teilweise', ckMiss: '✕ Fehlt', thTitle: 'Gefahren und was kaufen', thBuy: 'Kaufen,', thBanned: 'Oft gebannt, trotzdem gewählt:', thNote: 'Held antippen für die ganze Item-Liste.', mmTitle: 'Wichtige Matchups', mmYou: 'Du hast die Oberhand', mmEnemy: 'Der Gegner hat die Oberhand', mmNone: 'Kein klarer Vorteil Held gegen Held.', mmListed: '{0} gilt als stark gegen {1}', mmStat: '{0} gewinnt öfter gegen {1}', edClear: 'Klarer Vorteil', edSmall: 'Leichter Vorteil', lnTitle: 'Vermutete Lanes', lnNote: 'Die Lanes sind geschätzt. Lane antippen, um sie zu ändern.', lpMove: '{0} verschieben nach:', anFoot: 'Ein Rat, keine Vorhersage. Aus den Spieldaten (Konter-Listen und Statistik, Werte, Tags) und einfachen Regeln. Ein Punkt oder Pfeil ist ein leichter, zwei sind ein klarer Vorteil.',  trendUp: 'Steigt diese Woche', trendDown: 'Fällt diese Woche', laneChange: 'Lane ändern', sPickShort: 'Pick', sBanShort: 'Ban', tagWeakTo: 'Schwach gegen',
    pro: 'Profi-Builds', proNote: 'Standard-Builds aus gewonnenen Spielen, neueste Profi-Spiele zuerst (MPL Indonesia, Philippinen, Malaysia). Spät oder für eine Situation gekaufte Items stehen getrennt.', proNone: 'Kein voller Build für diesen Helden in den neuesten Profi-Spielen.', proFail: 'Die Profi-Spiele konnten nicht geladen werden.', won: 'gewonnen', lost: 'verloren',
    dna: 'Draft-DNA', dnaEarly: 'Kurze Spiele', dnaMid: 'Mittellange', dnaLate: 'Lange Spiele', dnaOff: 'Schaden', dnaCc: 'Kontrolle', dnaSus: 'Standfestigkeit', dnaYou: 'Du', dnaThem: 'Gegner', dnaEven: 'Gleich', combo: 'Kombo', banTitle: 'Bannen lohnt sich', hurts: 'kontert deine', holdHint: 'Tippen wählt. Held gedrückt halten für Builds und Matchups.',
    id_pick: ['Pick-off', 'Assassinen jagen einzelne Ziele. Lange Kämpfe meiden.'], id_ftb: ['Front to back', 'Eine Frontlinie schützt die Schadensverursacher dahinter.'], id_dive: ['Dive', 'Alle springen gemeinsam auf die gegnerische Backline.'],
    id_poke: ['Poke & Burst', 'Magier zermürben den Gegner, bevor der Kampf beginnt.'], id_sustain: ['Sustain', 'Supporter halten das Team in langen Kämpfen am Leben.'], id_team: ['Teamfight', 'Am stärksten, wenn alle fünf zusammen kämpfen.'],
    mEnemy: 'Gegner-Pick', mAlly: 'Unser Pick', mBan: 'Ban', mFav: '★ Meine Helden', startLane: 'Lane', startRole: 'Rolle', startMine: 'Meine Helden', startHint: 'Typ wählen.', back: 'Zurück', rankAsk: 'Dein Rang?', in0: 'Lass diese Seite während des Drafts neben dem Spiel offen.', in1: 'Tippe an, was der Gegner und dein Team wählen.', in2: 'Sieh, welche Helden passen und warum.', in3: 'Held gedrückt halten für Builds und Konter-Items.', inOk: 'Alles klar', inHelp: 'So funktioniert es', oops: 'Hier ist etwas schiefgelaufen. Bitte die Seite neu laden.', rk_mythic: 'Mythic', rk_honor: 'Mythical Honor', rk_glory: 'Mythical Glory+', lnWr: 'Siegrate', lnEarly: 'kurz', lnLate: 'lang', lnCounters: 'kontert', lnEarlyEdge: 'gewinnt kurze Spiele öfter', lnLateEdge: 'gewinnt lange Spiele öfter', lnLaneEdge: 'hat auf dieser Lane die bessere Siegrate', ph_short: 'stark in kurzen Spielen', ph_mid: 'stark in mittellangen Spielen', ph_long: 'stark in langen Spielen', ph_even: 'in jeder Spiellänge stabil', lnOnLane: 'auf dieser Lane', lnEven: 'Ausgeglichenes Matchup', analysis: 'Analyse', anTitle: 'Team-Aufstellung & Siegbedingungen', anSpike: 'Team-Stärke nach Spiellänge', anSpikeNote: 'Durchschnittliche Siegrate der fünf Helden in Spielen dieser Länge (Minuten).', anLanes: 'Lane-Matchups',
    anLaneNote: 'Sieg-Prognose pro Lane, eine Schätzung: vor allem die Siegrate jedes Helden auf dieser Lane, dazu die Konter-Listen des Spiels. „Kurz“ und „lang“ sind Siegraten in Spielen unter 12 und über 20 Minuten; sie sagen, wie die Spiele eines Helden enden, nicht wer die Lane-Phase gewinnt. Die Lanes sind geschätzt: Lane unter einem Helden antippen, um sie zu ändern. Held antippen für Builds und Konter-Items.', anWin: 'Siegbedingungen', anEst: 'Alles hier ist aus öffentlichen Statistiken und einfachen Regeln berechnet. Ein Hinweis, kein Urteil.',
    tEarly: 'Gewinnt kurze Spiele', tLate: 'Gewinnt lange Spiele', tEven: 'Kein Zeitvorteil', bEarly: 'Am stärksten in kurzen Spielen: Vorsprung nutzen und vor Minute 16 beenden', bLate: 'Je länger, desto stärker: sicher farmen und verzögern', bEven: 'Kein klarer Zeitvorteil: um Turtle und Lord spielen',
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
  lang: store.get('lang', (navigator.language || 'en').startsWith('de') ? 'de' : 'en'), rank: store.get('rank2', 'glory'), days: store.get('days', 7),
  favs: new Set(),   // the 'My heroes' list was removed at the owner's request; the code that reads it stays harmless sort: 'meta', rankPicked: false, format: 'ranked', skipped: 0, icons: { lanes: {}, roles: {} },
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
// a short message at the bottom; with an action it carries one button (Undo) and stays 3 seconds
function toast(msg, label, act) { const el = $('toast'); el.replaceChildren(h('span', {}, msg), ...(label ? [h('button', { onclick: () => { el.hidden = true; act(); } }, label)] : [])); el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, label ? 3000 : 2200); }
// Undo: every change of the draft (pick, ban, taking out, New draft) first keeps the draft as it was; Undo steps back.
const UNDO = [];
function keep() { UNDO.push({ enemy: [...S.enemy], ally: [...S.ally], bans: [...S.bans] }); if (UNDO.length > 30) UNDO.shift(); $('btnUndo').disabled = false; }
function undo() { const d = UNDO.pop(); $('btnUndo').disabled = !UNDO.length; if (!d) return; S.enemy = d.enemy; S.ally = d.ally; S.bans = d.bans; store.set('draft', d); $('toast').hidden = true;
  place.wasFull = S.enemy.length === 5 && S.ally.length === 5; if (S.enemy.length || S.ally.length) S.rankPicked = true; clearFilters(); drawPhase(false); drawBoard(); drawGrid(); drawSuggest(); drawDna(); }

// ---- data ------------------------------------------------------------------------------------------------------
// A polite client: the data service limits how fast it may be asked (it answers 429 when it is too much). So at most
// two requests run at a time with a short pause between them, and a 429 is retried twice after waiting.
const Q = { running: 0, waiting: [] };
function fetchJson(path) {
  return new Promise((resolve, reject) => { Q.waiting.push({ path, resolve, reject, tries: 0 }); pump(); });
}
function pump() {
  while (Q.running < 2 && Q.waiting.length) {
    const job = Q.waiting.shift(); Q.running++;
    const done = () => { setTimeout(() => { Q.running--; pump(); }, 120); };
    fetch(API + job.path, { headers: { Accept: 'application/json' } }).then(async r => {
      if (r.status === 429 && job.tries < 2) { job.tries++; const wait = Math.min(8000, (Number(r.headers.get('Retry-After')) || 2 * job.tries) * 1000); setTimeout(() => { Q.waiting.unshift(job); pump(); }, wait); done(); return; }
      if (!r.ok) throw new Error(`${job.path}: ${r.status}`);
      job.resolve(await r.json()); done();
    }).catch(e => { job.reject(e); done(); });
  }
}
async function api(path) {
  const j = await fetchJson(path);
  return (j && j.data && j.data.records) || [];
}
const arr = x => (Array.isArray(x) ? x.filter(v => v && typeof v === 'object') : []);
const ids = x => (Array.isArray(x) ? x : (x && x.target_hero_id) || []).map(Number).filter(Boolean);

async function loadHeroes(force) {
  const key = `heroes3.${S.rank}.${S.days}`, cached = store.get(key, null);
  if (!force && cached && Date.now() - cached.at < 12 * 3600 * 1000) { S.heroes = new Map(cached.list.map(x => [x.id, x])); S.icons = OWN_ICONS; return; }
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
  S.icons = OWN_ICONS;
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
  // a full draft needs no suggestions: the row goes and the team comparison gets its space
  const fullDraft = S.enemy.length === 5 && S.ally.length === 5 && S.mode !== 'ban'; $('suggest').hidden = fullDraft; document.body.classList.toggle('full', fullDraft);
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
        h('span', { class: 'why bad' }, h('em', {}, t('mBan')), h('span', {}, `${t('sBanShort')} ${(x.ban * 100).toFixed(0)}% · ${t('meta')} ${(x.win * 100).toFixed(1)}%`)),
        ours.has(x.id) ? h('span', { class: 'why' }, h('em', {}, t('tagWeak')), h('span', {}, `${t('vsOurs')} ${ours.get(x.id).join(', ')}`))
          : threat.has(x.id) ? h('span', { class: 'why' }, h('em', {}, t('tagWeak')), h('span', {}, `${t('hurts')} ${threat.get(x.id).join(', ')}`)) : null))));
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
      r.strong.length ? h('span', { class: 'why good' }, h('em', {}, t('tagStrong')), h('span', {}, names(r.strong))) : null,
      r.pairs.length ? h('span', { class: 'why pair' }, h('em', {}, t('tagPairs')), h('span', {}, names(r.pairs))) : null,
      r.weak.length ? h('span', { class: 'why bad' }, h('em', {}, t('tagWeak')), h('span', {}, names(r.weak))) : null,
      !r.strong.length && !r.pairs.length && !r.weak.length ? h('span', { class: 'why' }, h('em', {}, t('tagMeta')), h('span', {}, `${t('meta')} ${(x.win * 100).toFixed(1)}%`)) : null))));
}

// ---- board -----------------------------------------------------------------------------------------------------
const SIDES = { ban: { list: () => S.bans, max: 10, el: 'slotsBan' }, enemy: { list: () => S.enemy, max: 5, el: 'slotsEnemy' }, ally: { list: () => S.ally, max: 5, el: 'slotsAlly' } };
// The order of a draft. Ranked: all bans, then all picks. Tournament: 3 bans each, 3 picks each, 2 bans each, 2 picks
// each. Bans are one list (who banned what does not matter here). The page follows the order by itself: it switches to
// Ban or to picking when a step is full; you can always tap another mode, and skip bans nobody used.
const FORMATS = { ranked: [['pick', 10]] };   // only the picks are counted: bans are optional (Ban mode), there is no ban phase
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
  let added = false;
  if (taken().has(id)) { keep(); // a second tap on a taken hero takes it out again
    for (const k of ['enemy', 'ally', 'bans']) { const i = S[k].indexOf(id); if (i >= 0) S[k].splice(i, 1); }
  } else {
    if (list.length >= side.max) { toast(t(mode === 'ban' ? 'banFull' : 'full')); return; }
    keep(); added = true; list.push(id); S.justPlaced = id; setTimeout(() => { if (S.justPlaced === id) S.justPlaced = 0; }, 600);
    if (mode === 'enemy') loadRelation('counters', id);
    if (mode === 'ally') loadRelation('compatibility', id);
    if (mode !== 'ban') { loadDetail(id); const hx = S.heroes.get(id); loadTimeline(id, (hx && hx.lanes[0]) || 'mid').then(drawDna); }
    clearFilters();
  }
  store.set('draft', { enemy: S.enemy, ally: S.ally, bans: S.bans });
  const full = S.enemy.length === 5 && S.ally.length === 5;
  if (full && !place.wasFull) setTimeout(openAnalysis, 250);
  place.wasFull = full;
  drawPhase(true); drawBoard(); drawGrid(); drawSuggest(); drawDna();
  if (added && !full) toast(`${(S.heroes.get(id) || {}).name || ''} · ${t(mode === 'ban' ? 'mBan' : mode)}`, t('undo'), undo);
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
    if (mode === 'ban') $('banSide').hidden = !list.length;   // the ban row only shows once something is banned
    for (let i = 0; i < (mode === 'ban' ? list.length : side.max); i++) {
      const x = S.heroes.get(list[i]);
      kids.push(x ? h('button', { class: 'slot filled' + (x.id === S.justPlaced ? ' new' : ''), title: x.name, onclick: () => openSheet(x.id) }, h('img', { src: x.img, alt: x.name }), h('span', {}, x.name))
        : h('button', { class: 'slot' + (S.mode === mode && i === list.length ? ' next' : ''), onclick: () => setMode(mode) }, mode === 'ban' ? '' : h('i', { class: 'slotnum' }, String(i + 1))));
    }
    $(side.el).replaceChildren(...kids);
  }
}
function setMode(mode) {
  S.mode = mode;
  for (const b of document.querySelectorAll('.mode')) b.classList.toggle('on', b.dataset.mode === mode);
  document.body.dataset.mode = mode;
  if (mode === 'fav') toast(t('favHint'));
  drawBoard(); drawGrid(); drawSuggest();
}

// ---- hero grid -------------------------------------------------------------------------------------------------
// Picking in steps (the owner's design): step 1 shows only the six hero types, no heroes and no lanes. A tap on a type
// opens step 2: a Back button, the lane symbols as the only filter, and that type's heroes. After a pick the list
// returns to step 1. So a pick is two or three taps and hardly any scrolling.
function pickFilter(set, key) { const on = set.has(key); set.clear(); if (!on) set.add(key); drawChips(); drawGrid(); drawSuggest(); }
function clearFilters() { S.lanes.clear(); S.roles.clear(); S.q = ''; $('q').value = ''; drawChips(); }
function drawChips() {
  // a symbol per lane and role instead of the word (the word stays as tooltip and for screen readers)
  const chip = (set, key) => { const icon = S.icons.lanes[key] || S.icons.roles[key];
    return h('button', { class: 'chip' + (icon ? ' sym' : '') + (set.has(key) ? ' on' : ''), title: t(key), 'aria-label': t(key), 'aria-pressed': String(set.has(key)),
      onclick: () => pickFilter(set, key) }, icon ? h('img', { src: icon, alt: '' }) : t(key)); };
  const role = [...S.roles][0];
  $('laneChips').replaceChildren(h('button', { class: 'chip back', onclick: () => { clearFilters(); drawGrid(); drawSuggest(); } }, '‹ ', role && S.icons.roles[role] ? h('img', { src: S.icons.roles[role], alt: '' }) : null, role ? t(role) : t('back')),
    ...LANES.map(k => chip(S.lanes, k)));
  $('roleChips').replaceChildren();
}
function drawGrid() {
  try { drawGridInner(); } catch (e) { console.warn('grid', e); const g = $('grid'); g.classList.remove('start'); g.replaceChildren(h('p', { class: 'faint' }, `${t('oops')} (${e.message})`)); }
}
function drawGridInner() {
  const grid = $('grid');
  if (!S.ready) { grid.replaceChildren(h('p', { class: 'faint' }, t(S.failed ? 'failed' : 'loading'))); return; }
  const q = S.q.trim().toLowerCase(), used = taken();
  const start = !q && !S.roles.size && S.mode !== 'fav';
  const whereOf = id => (S.enemy.includes(id) ? 'enemy' : S.ally.includes(id) ? 'ally' : S.bans.includes(id) ? 'ban' : '');
  grid.classList.toggle('start', start); $('picker').classList.toggle('start', start);
  const tileOf = x => { const where = whereOf(x.id);
    const tile = h('button', { class: `hero ${where}${S.favs.has(x.id) ? ' fav' : ''}`, title: used.has(x.id) ? `${x.name} · ${t('taken')}` : x.name, onclick: () => place(x.id, S.mode) },
      h('img', { src: x.img, alt: '', loading: 'lazy', draggable: 'false' }), h('span', { class: 'n' }, x.name), h('span', { class: 'w' }, `${(x.win * 100).toFixed(0)}%`), S.favs.has(x.id) ? h('span', { class: 'star' }, '★') : null);
    holdToOpen(tile, x.id); return tile; };
  if (start) {
    const big = (set, key, icons) => h('button', { class: 'bigbtn', onclick: () => pickFilter(set, key) }, icons[key] ? h('img', { src: icons[key], alt: '' }) : null, h('span', {}, t(key)));
    S.lanes.clear();
    // Step 0, once per draft: the rank whose statistics to use. It shows alone before the types and is gone after a tap.
    if (!S.rankPicked && !S.enemy.length && !S.ally.length) {
      const choose = r => { S.rankPicked = true; if (S.rank === r) { drawGrid(); return; } S.rank = r; store.set('rank2', r); $('rank').value = r; S.vs.clear(); S.beside.clear(); boot(false); };
      grid.replaceChildren(h('p', { class: 'faint starthint' }, t('rankAsk')),
        h('div', { class: 'rankstep' }, ['mythic', 'honor', 'glory'].map(r => h('button', { class: 'rankbtn' + (S.rank === r ? ' on' : ''), title: t('rk_' + r), 'aria-label': t('rk_' + r), onclick: () => choose(r) }, h('img', { src: RANK_ICONS[r], alt: '', onerror: e => { e.target.replaceWith(t('rk_' + r)); } })))));
      return;
    }
    grid.replaceChildren(h('p', { class: 'faint starthint' }, t('startHint')), h('div', { class: 'bigrow roles step1' }, ROLES.map(k => big(S.roles, k, S.icons.roles))));
    return;
  }
  // meta = how often a hero is in the draft at all (picked or banned), lifted a little by its win rate
  const meta = x => (x.pick + x.ban) * (0.5 + x.win);
  const by = { meta: (a, b) => meta(b) - meta(a), pick: (a, b) => b.pick - a.pick, win: (a, b) => b.win - a.win, ban: (a, b) => b.ban - a.ban, name: (a, b) => a.name.localeCompare(b.name) }[S.sort] || ((a, b) => meta(b) - meta(a));
  const list = [...S.heroes.values()].filter(x => passesFilter(x) && (!q || x.name.toLowerCase().includes(q)))
    .sort((a, b) => (S.favs.has(b.id) ? 1 : 0) - (S.favs.has(a.id) ? 1 : 0) || by(a, b) || a.name.localeCompare(b.name));
  if (!list.length) { grid.replaceChildren(h('p', { class: 'faint' }, t('none'))); return; }
  grid.replaceChildren(...list.map(tileOf));
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
    return { items: (b.equipid || []).map(Number).filter(Boolean), pick: b.build_pick_rate || 0, win: b.build_win_rate || 0, emblem: ((b.emblem || {}).data || {}).emblemname || '', emblemIcon: ((b.emblem || {}).data || {}).attriicon || '', talents: (Array.isArray(b.new_rune_skill) ? b.new_rune_skill : []).map(Number).filter(Boolean), spell: sp.skillname || '', spellIcon: sp.skillicon || '' }; });
  D.builds.set(key, list);
  return list;
}
//   /api/academy/emblems                      the emblem talents (name and picture) by their id, kept for a week; a build names three of them
async function loadEmblems() {
  if (D.emblems) return D.emblems;
  const c = store.get('emblems', null); if (c && Date.now() - c.at < 7 * 86400e3) return D.emblems = new Map(c.list);
  try { const recs = await api('/academy/emblems?size=50&index=1&lang=en');
    const list = recs.map(r => r.data || {}).filter(x => x.giftid && x.emblemskill).map(x => [Number(x.giftid), { name: x.emblemskill.skillname || '', icon: x.emblemskill.skillicon || '' }]);
    if (list.length) store.set('emblems', { at: Date.now(), list }); return D.emblems = new Map(list); } catch (e) { console.warn('emblems', e.message); return new Map(); }
}
//   /api/heroes/<id>/trends?rank=&past-days=7  win, pick and ban rate per day, newest first: is the hero rising or falling this week
async function loadTrend(id) {
  const key = `${id}.${S.rank}`; D.trend = D.trend || new Map(); if (D.trend.has(key)) return D.trend.get(key);
  let v = null;
  try { const recs = await api(`/heroes/${id}/trends?rank=${S.rank}&past-days=7`), w = arr(((recs[0] || {}).data || {}).win_rate).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (w.length >= 4) v = (Number(w[w.length - 1].win_rate) - Number(w[0].win_rate)) * 100; } catch (e) { console.warn('trend', id, e.message); return null; }
  D.trend.set(key, v); return v;
}
//   /api/heroes/<id>/stats?rank=              win, pick and ban rate of one hero at one rank; five requests, so only on a tap
const RANKS5 = ['epic', 'legend', 'mythic', 'honor', 'glory'];
async function loadRanks(id) {
  D.ranks = D.ranks || new Map(); if (D.ranks.has(id)) return D.ranks.get(id);
  const out = [];
  for (const r of RANKS5) { try { const d = ((await api(`/heroes/${id}/stats?rank=${r}`))[0] || {}).data || {}; out.push({ r, win: d.main_hero_win_rate || 0, pick: d.main_hero_appearance_rate || 0, ban: d.main_hero_ban_rate || 0 }); } catch (e) { console.warn('ranks', id, r, e.message); } }
  if (out.length) D.ranks.set(id, out); return out;
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
  const c = store.get('pro5', null);
  if (c && Date.now() - c.at < 24 * 3600 * 1000) return D.pro = c.list;
  const raw = fetchJson;
  // every object with a match id and a start time, wherever it sits in the answer (schedule and playoffs differ)
  const collect = (node, lg, out) => { if (Array.isArray(node)) node.forEach(n => collect(n, lg, out)); else if (node && typeof node === 'object') {
    if (node.match_id != null && node.start_at && node.status === 'finished') out.push({ lg, id: node.match_id, at: String(node.start_at) }); else Object.values(node).forEach(n => collect(n, lg, out)); } };
  const found = [];
  await Promise.all(['id', 'ph', 'my'].flatMap(lg => ['schedule', 'playoffs'].map(async part => { try { collect(await raw(`/esports/${lg}/${part}`), lg, found); } catch (e) { console.warn('pro list', lg, part, e.message); } })));
  const seen = new Set(), matches = found.sort((a, b) => b.at.localeCompare(a.at)).filter(m => !seen.has(m.lg + m.id) && seen.add(m.lg + m.id)).slice(0, 24);
  if (!matches.length) throw new Error('no pro matches');
  const list = [];
  await Promise.all(matches.map(async m => {
    try {
      const det = await raw(`/esports/${m.lg}/matches/${encodeURIComponent(m.id)}`);
      for (const g of arr(det.games)) { const tms = arr(g.teams), st = x => x.stats || {};
        // some leagues do not say who won a game; then the team that destroyed more turrets (more gold on a tie) is taken as the winner
        const top = tms.some(x => x.winner != null) ? null : tms.slice().sort((p, q) => (st(q).tower_destroy || 0) - (st(p).tower_destroy || 0) || (st(q).total_gold || 0) - (st(p).total_gold || 0))[0];
        for (const tm of tms) for (const p of arr(tm.players)) {
        if (!p.hero || !p.hero.name) continue;
        list.push({ hero: norm(p.hero.name), player: p.name || '', team: (tm.team || {}).name || '', lg: m.lg.toUpperCase(), date: m.at.slice(0, 10), win: top ? tm === top : !!tm.winner, kda: [p.kills, p.deaths, p.assists].map(n => n ?? 0).join(' / '),
          items: arr(p.items).map(i => ({ id: Number(i.id), img: i.image || '' })), seq: arr(p.item_sequence).map(q => [Number(q.id), Math.round(Number(q.timeline_percent) || 0)]), emblem: (p.emblem || {}).image || '', talents: arr(p.talents).map(x => x.image || '').filter(Boolean) });
      } }
    } catch (e) { console.warn('pro match', m.lg, m.id, e.message); }
  }));
  list.sort((a, b) => b.date.localeCompare(a.date));
  if (list.length) store.set('pro5', { at: Date.now(), list });
  return D.pro = list;
}
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
// A pro build counts as finished only when none of its six items is still a part of a bigger item. The item list of the game has no
// such mark, so the parts are named here by hand (the second-tier parts; every first-tier item except the jungle and roam boots is a part too).
const PARTS = new Set(['legionsword', 'magicblade', 'roguemeteor', 'ogretomahawk', 'furyhammer', 'deadlyblade', 'tomeofevil', 'magicwand', 'azureblade', 'exoticveil', 'elegantgem', 'moltenessence',
  'aresbelt', 'silencerobe', 'blackiceshield', 'steellegplates', 'dreadnaughtarmor', 'cursesword', 'nimbleblade', 'pillageraxe', 'ironmask'].map(norm));
// A pro's end-of-game items mix the standard build with things bought late for one situation. Where the match record holds the purchase
// order (item_sequence with the moment of each purchase in percent of the game; not every league has it), items bought in the last
// 30 percent of the game are set apart as "late"; a short hand-written list of typical answer items is set apart in every case.
const SITUATIONAL = new Set(['Winter Crown', 'Immortality', 'Wind of Nature', 'Sea Halberd', 'Dominance Ice', "Athena's Shield", 'Radiant Armor', 'Antique Cuirass'].map(norm));
function splitBuild(p, items) {
  const first = new Map(); for (const [i, pc] of p.seq || []) if (!first.has(i)) first.set(i, pc);
  const its = p.items.map(it => ({ ...it, pc: first.has(it.id) ? first.get(it.id) : null, name: (items.get(it.id) || {}).name || '', icon: (items.get(it.id) || {}).icon || '' })).filter(x => x.name);   // an entry the item list does not know (an empty or special slot) is left out
  const timed = its.some(x => x.pc != null); if (timed) its.sort((a, b) => (a.pc ?? 999) - (b.pc ?? 999));
  const late = x => (x.pc != null && x.pc >= 70) || SITUATIONAL.has(norm(x.name));
  return { core: its.filter(x => !late(x)), late: its.filter(late), timed };
}
const finishedItem = (id, items) => { const o = items.get(id); if (!o || !o.name) return true; const n = norm(o.name); return !PARTS.has(n) && !(id < 2000 && !/boots/.test(n)) && n !== 'boots'; };

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
      const [items, list, emb] = await Promise.all([loadItems(), loadBuilds(id, lane), loadEmblems()]);
      if (D.open !== id || D.lane !== lane) return;
      buildsBox.replaceChildren(...(list.length ? list.slice(0, 4).map((b, i) => h('div', { class: 'build' },
        h('div', { class: 'bhead' }, h('b', {}, `${t('build')} ${i + 1}`), h('span', {}, `${t('used')} ${pct(b.pick)}`), h('span', { class: 'good' }, `${t('meta')} ${pct(b.win)}`)),
        h('div', { class: 'bitems' }, b.items.map(it => { const o = items.get(it) || {}; return h('span', { class: 'bitem', title: o.name || String(it) }, o.icon ? h('img', { src: o.icon, alt: '', loading: 'lazy' }) : null, h('i', {}, o.name || `#${it}`)); })),
        h('div', { class: 'bmeta' }, b.emblem ? h('span', {}, b.emblemIcon ? h('img', { src: b.emblemIcon, alt: '' }) : null, b.emblem) : null,
          b.talents.some(g => emb.get(g)) ? h('span', { class: 'talents' }, b.talents.map(g => emb.get(g)).filter(Boolean).map(o => h('img', { src: o.icon, alt: o.name, title: o.name }))) : null, b.spell ? h('span', {}, b.spellIcon ? h('img', { src: b.spellIcon, alt: '' }) : null, b.spell) : null)))
        : [h('p', { class: 'faint' }, t('noBuild'))]));
    } catch (e) { console.warn('builds', e.message); if (D.open === id) buildsBox.replaceChildren(h('p', { class: 'faint' }, t('noBuild'))); }
  };
  const head = h('div', { class: 'shead' }, h('img', { class: 'sart', src: x.img, alt: '' }),
    h('div', { class: 'sinfo' }, h('h2', {}, x.name), h('div', { class: 'faint' }, [...x.lanes.map(l => t(l)), ...x.roles.map(r => t(r))].join(' · ')), h('div', { class: 'stags' }),
      h('div', { class: 'srates' }, h('span', {}, `${t('meta')} `, h('b', {}, pct(x.win))), h('span', {}, `${t('sPickShort')} `, h('b', {}, pct(x.pick))), h('span', {}, `${t('sBanShort')} `, h('b', {}, pct(x.ban))))),
    h('button', { class: 'sclose', 'aria-label': t('close'), onclick: closeSheet }, '✕'));
  const acts = h('div', { class: 'sacts' }, where ? h('button', { class: 'act remove', onclick: () => { place(id, where); closeSheet(); } }, t('remove'))
    : [h('button', { class: 'act ally', onclick: () => { place(id, 'ally'); closeSheet(); } }, t('mAlly')), h('button', { class: 'act enemy', onclick: () => { place(id, 'enemy'); closeSheet(); } }, t('mEnemy')),
      h('button', { class: 'act ban', onclick: () => { place(id, 'ban'); closeSheet(); } }, t('mBan'))]);
  const rel = (key, label, cls) => (x[key].length ? h('div', { class: 'srel ' + cls }, h('em', {}, label), minis(x[key]), h('p', { class: 'faint', 'data-desc': key })) : null);
  const body = el.querySelector('.sheetbody');
  const proBox = h('div', { class: 'builds' }, h('p', { class: 'faint' }, t('loading')));
  // the same hero at five ranks, loaded on a tap
  const rankBox = h('div', { class: 'rktable' }); rankBox.append(h('button', { class: 'rkbtn', onclick: async () => { rankBox.replaceChildren(h('p', { class: 'faint' }, t('loading')));
    const rows = await loadRanks(id); if (D.open !== id) return; const best = Math.max(...rows.map(r => r.win));
    rankBox.replaceChildren(...(rows.length ? [h('div', { class: 'rkrow rkhead' }, h('span', {}), h('span', {}, t('mtWin')), h('span', {}, t('mtPick')), h('span', {}, t('mtBan'))),
      ...rows.map(r => h('div', { class: 'rkrow' + (r.r === S.rank ? ' on' : '') }, h('b', {}, ($('rank').querySelector(`option[value="${r.r}"]`) || {}).textContent || r.r), h('span', { class: r.win === best ? 'good' : '' }, pct(r.win)), h('span', {}, pct(r.pick)), h('span', {}, pct(r.ban))))] : [h('p', { class: 'faint' }, t('noBuild'))])); } }, t('rkShow')));
  if (/[#&]ranks/.test(location.hash)) setTimeout(() => { const b = rankBox.querySelector('.rkbtn'); if (b) b.click(); }, 300);   // #...&ranks opens the comparison (support, screenshots)
  body.replaceChildren(head, acts, rel('strong', t('tagStrong'), 'good'), rel('weak', t('tagWeakTo'), 'bad'), rel('assist', t('tagPairs'), 'pair'), h('h3', {}, t('builds')), laneTabs, buildsBox,
    h('h3', {}, t('pro')), h('p', { class: 'faint pronote' }, t('proNote')), proBox, h('h3', {}, t('rkTitle')), rankBox);
  Promise.all([loadPro(), loadItems().catch(() => new Map())]).then(([pro, items]) => {
    if (D.open !== id) return;
    // a build must be six different, finished, known items: records with a doubled or unknown item are faulty and are left out
    const sound = p => { const known = p.items.filter(it => (items.get(it.id) || {}).name); return known.length >= 6 && new Set(known.map(it => it.id)).size === known.length && known.every(it => finishedItem(it.id, items)); };
    const mine = pro.filter(p => p.win && p.hero === norm(x.name) && sound(p)).slice(0, 4);
    proBox.replaceChildren(...(mine.length ? mine.map(p => h('div', { class: 'build' },
      h('div', { class: 'bhead' }, h('b', {}, p.player), h('span', {}, `${p.team} · MPL ${p.lg} · ${p.date}`)),
      (() => { const sp = splitBuild(p, items); return [h('div', { class: 'bitems' }, sp.core.map((it, n) => h('span', { class: 'bitem', title: it.name }, h('img', { src: it.img || it.icon, alt: '', loading: 'lazy' }), h('i', {}, (sp.timed ? `${n + 1}. ` : '') + it.name)))),
        sp.late.length ? h('div', { class: 'blate' }, h('span', {}, t('proLate')), sp.late.map(it => h('span', { class: 'th-item' }, h('img', { src: it.img || it.icon, alt: '', loading: 'lazy' }), it.name))) : null]; })(),
      p.emblem && p.talents.length >= 3 ? h('div', { class: 'bmeta' }, h('span', {}, h('img', { src: p.emblem, alt: '' }), t('emblem')), h('span', {}, p.talents.map(u => h('img', { src: u, alt: '' })))) : null))
      : [h('p', { class: 'faint' }, t('proNone'))]));
  }).catch(e => { console.warn('pro', e.message); if (D.open === id) proBox.replaceChildren(h('p', { class: 'faint', title: e.message }, t('proFail'))); });
  body.scrollTop = 0; el.hidden = false; document.body.classList.add('sheetopen');
  showBuilds(x.lanes[0] || 'mid');
  const d = await loadDetail(id);
  if (d && D.open === id && !el.hidden) {
    body.querySelector('.stags').replaceChildren(...d.spec.map(s => h('span', { class: 'stag' }, s)));
    if (d.art) body.querySelector('.sart').src = d.art;
    for (const p of body.querySelectorAll('[data-desc]')) p.textContent = d.desc[p.dataset.desc] || '';
    loadTrend(id).then(v => { if (v != null && Math.abs(v) >= 0.5 && D.open === id) body.querySelector('.stags').append(h('span', { class: 'stag trend ' + (v > 0 ? 'up' : 'down') }, `${v > 0 ? '▲' : '▼'} ${t(v > 0 ? 'trendUp' : 'trendDown')} ${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`)); });
    loadTimeline(id, x.lanes[0] || 'mid').then(c => { const k = heroPhase(c); if (k && D.open === id) body.querySelector('.stags').append(h('span', { class: 'stag phase' }, t(k))); });
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

// Draft DNA: both teams side by side on six things that decide a game, and the best pair in each team.
//   Early / Mid / Late   average win rate of the picks in games of 10-12, 14-16 and 20+ minutes (real statistics)
//   Damage               average of the game's own offense rating (0 to 10)
//   Crowd control        how many of the picks carry a control tag (Crowd Control, Control, Initiator)
//   Sustain              average durability rating, lifted by half a point per hero with a Regen or Guard tag
// Shown as a tug of war: the bar grows from the middle towards the team that is ahead, with "You +1.4" or "Even"
// beside it. Win rates always sit close to 50%, so the raw numbers look alike; what matters is the gap, and a gap of
// two points in average win rate is a lot. A full bar means 4 points of win rate, 2.5 rating points or 3 heroes.
// Estimates to compare two drafts, not the numbers shown on a stream.
function drawDna() {
  const box = $('dna'); if (!box) return;
  const avg = (list, i) => { const v = list.map(id => D.detail.get(id)).filter(d => d && d.ab.length > i).map(d => d.ab[i]); return v.length ? v.reduce((a, b) => a + b, 0) / v.length / 10 : null; };
  const det = list => list.map(id => D.detail.get(id)).filter(Boolean), tagged = (list, tags) => det(list).filter(d => d.spec.some(x => tags.includes(x))).length;
  const timeOf = (list, bucket) => { const v = list.map(id => { const x = S.heroes.get(id), tl = x && AN.time.get(`${id}.${x.lanes[0] || 'mid'}.${S.rank}`); return tl && tl.length ? tl[Math.min(bucket, tl.length - 1)].w * 100 : null; }).filter(n => n != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const sustain = list => { const a = avg(list, 0); return a == null ? null : Math.min(10, a + 0.5 * tagged(list, ['Regen', 'Guard'])); };
  const both = (k, fa, fe, width, fmt) => ({ k, label: t(k), a: fa, e: fe, width, fmt });
  const pctW = v => Math.max(4, Math.min(100, (v - 44) * 100 / 12)), tenW = v => v * 10, fiveW = v => v * 20, f1 = v => v.toFixed(1), f0 = v => String(v);
  const rows = [both('dnaEarly', timeOf(S.ally, 0), timeOf(S.enemy, 0), pctW, f1), both('dnaMid', timeOf(S.ally, 2), timeOf(S.enemy, 2), pctW, f1), both('dnaLate', timeOf(S.ally, 5), timeOf(S.enemy, 5), pctW, f1),
    both('dnaOff', avg(S.ally, 1), avg(S.enemy, 1), tenW, f1), both('dnaCc', det(S.ally).length ? tagged(S.ally, ['Crowd Control', 'Control', 'Initiator']) : null, det(S.enemy).length ? tagged(S.enemy, ['Crowd Control', 'Control', 'Initiator']) : null, fiveW, f0),
    both('dnaSus', sustain(S.ally), sustain(S.enemy), tenW, f1)].filter(r => r.a != null && r.e != null);
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
  // the head of the block (shown where the block is large): title, each team's type, and the way into the analysis
  const idOf = (list, cls) => { const k = teamIdentity(list); return k ? h('span', { class: 'dnaid ' + cls }, t(k)[0]) : null; };
  box.replaceChildren(h('div', { class: 'dnatitle' }, h('b', {}, t('dna')), idOf(S.ally, 'a'), idOf(S.enemy, 'e'), h('span', { class: 'dnaopen' }, t('analysis') + ' ›')),
    ...rows.map(r => { const full = /Early|Mid|Late/.test(r.k) ? 4 : r.k === 'dnaCc' ? 3 : 2.5, even = /Early|Mid|Late/.test(r.k) ? 0.6 : r.k === 'dnaCc' ? 0.5 : 0.4;
      const d = r.a - r.e, lead = Math.abs(d) < even ? '' : d > 0 ? 'a' : 'e', w = lead ? Math.max(8, Math.min(100, Math.abs(d) / full * 100)) : 0;
      return h('div', { class: 'dnarow tug', title: `${r.fmt(r.a)} : ${r.fmt(r.e)}` }, h('span', {}, r.label), h('b', { class: lead }, lead ? `${t(lead === 'a' ? 'dnaYou' : 'dnaThem')} +${Math.abs(d).toFixed(r.k === 'dnaCc' ? 0 : 1)}` : t('dnaEven')),
        h('div', { class: 'tugbar' }, h('div', { class: 'half a' }, h('i', { style: `width:${lead === 'a' ? w : 0}%` })), h('div', { class: 'half e' }, h('i', { style: `width:${lead === 'e' ? w : 0}%` })))); }),
    ...(ca || ce ? [h('div', { class: 'combos' }, comboEl(ca, 'a'), comboEl(ce, 'e'))] : []));
}

// ---- counter items, analysis after the draft -----------------------------------------------------------------
// Items that work against a hero, chosen by simple rules from its roles and speciality tags (general game knowledge,
// not statistics). Only items the game's own item list knows by that name are shown, so a renamed item drops out.
const COUNTER_RULES = [
  [(x, d) => d.spec.includes('Regen'), 'ci_heal', ['Sea Halberd', 'Dominance Ice']],
  [(x, d) => x.roles[0] === 'mage' || d.spec.includes('Magic Damage'), 'ci_magic', ['Athena\'s Shield', 'Radiant Armor']],
  [(x) => x.roles[0] === 'marksman', 'ci_mm', ['Blade Armor', 'Wind of Nature', 'Dominance Ice']],
  [(x, d) => x.roles[0] === 'assassin' || d.spec.includes('Burst'), 'ci_burst', ['Winter Crown', 'Immortality']],
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
//                          the projection is 50% shifted mostly by each hero's win rate ON THAT LANE (it differs a
//                          lot: Selena wins 45% as roamer and 49% in mid at Mythical Glory), then the game's
//                          strong/weak lists, the matchup statistics and a little of the short-game numbers,
//                          kept between 30 and 70; each lane also says why.
//   NOTE on the game-length numbers: they are the win rate in games that END at that length. That is not strength in
//   the laning phase. A hero that takes turrets fast (Kimmy on gold: 58% under 12 minutes, 45% over 20) ends her wins
//   early; a pick-off roamer (Selena: 42% under 12, 50% over 20) wins late. So they are named "short" and "long"
//   games here and only nudge the lane projection.
//   win conditions         the team type (teamIdentity) and whether the team is better early or late
const AN = { lanes: { ally: {}, enemy: {} }, time: new Map(), total: new Map() };
{ const c = store.get('timelines2', null); if (c && Date.now() - c.at < 24 * 3600 * 1000) for (const [k, v, tot] of c.list) { AN.time.set(k, v); if (tot) AN.total.set(k, tot); } }
let timeSave = 0;
function assignLanes(side) {
  const ids = S[side].slice(0, 5), fixed = AN.lanes[side]; let best = null, bestScore = -1;
  const go = (i, used, cur, score) => { if (i === ids.length) { if (score > bestScore) { bestScore = score; best = { ...cur }; } return; }
    const x = S.heroes.get(ids[i]) || { lanes: [] };
    for (const l of LANE_ORDER) { if (used.has(l)) continue; const want = fixed[ids[i]]; const v = want ? (want === l ? 10 : -10) : (l === x.lanes[0] ? 3 : x.lanes.includes(l) ? 2.2 : 0) + (ROLE_LANE[(x.roles || [])[0]] === l ? 1 : ROLE_LANE[(x.roles || [])[1]] === l ? 0.5 : 0);
      used.add(l); cur[l] = ids[i]; go(i + 1, used, cur, score + v); used.delete(l); delete cur[l]; } };
  go(0, new Set(), {}, 0);
  return best || {};
}
const LANE_ORDER = ['exp', 'jungle', 'mid', 'gold', 'roam'];
// Putting five heroes on five lanes: a hero's first listed lane counts most, its other lanes nearly as much (flexible heroes
// move to make room for one-lane heroes), and the usual lane of its type breaks ties and places heroes off their lanes.
const ROLE_LANE = { assassin: 'jungle', marksman: 'gold', mage: 'mid', support: 'roam', tank: 'roam', fighter: 'exp' };
async function loadTimeline(id, lane) {
  const key = `${id}.${lane}.${S.rank}`; if (AN.time.has(key)) return AN.time.get(key);
  let v = null;
  try { const recs = await api(`/academy/heroes/${id}/win-rate/timeline?lane=${lane}&rank=${S.rank}&lang=en`); const tw = arr(((recs[0] || {}).data || {}).time_win_rate);
    if (tw.length >= 3) v = tw.map(b => ({ from: b.time_min, w: Number(b.win_rate) || 0 }));
    const tot = Number(((recs[0] || {}).data || {}).total_win_rate) || 0; if (tot) AN.total.set(key, tot); } catch (e) { console.warn('timeline', id, e.message); return null; }
  AN.time.set(key, v);
  clearTimeout(timeSave); timeSave = setTimeout(() => { const old = store.get('timelines2', null); store.set('timelines2', { at: old && Date.now() - old.at < 24 * 3600 * 1000 ? old.at : Date.now(), list: [...AN.time].filter(x => x[1]).map(([k, v]) => [k, v, AN.total.get(k) || 0]) }); }, 800);
  return v;
}
// What a hero is good at, said positively and from its own numbers: the game length where its win rate peaks
// (under 12, 14 to 16, or over 20 minutes), or "steady" when the three are within two points of each other.
function heroPhase(c) {
  if (!c || c.length < 3) return '';
  const sh = c[0].w, mid = c[Math.min(2, c.length - 1)].w, lg = c[c.length - 1].w, mx = Math.max(sh, mid, lg);
  if (mx - Math.min(sh, mid, lg) < 0.02) return 'ph_even';
  return mx === sh ? 'ph_short' : mx === lg ? 'ph_long' : 'ph_mid';
}
function laneInfo(a, e, lane) {   // our hero a against their hero e on one lane: chance in percent, numbers and reasons
  const tl = x => (x ? AN.time.get(`${x.id}.${lane}.${S.rank}`) : null);
  const num = x => { if (!x) return null; const c = tl(x), lw = AN.total.get(`${x.id}.${lane}.${S.rank}`); return { wr: (lw || x.win) * 100, onLane: !!lw, early: c && c.length ? c[0].w * 100 : null, late: c && c.length ? c[c.length - 1].w * 100 : null }; };
  const na = num(a), ne = num(e); if (!a || !e) return { p: null, na, ne, why: [] };
  const why = []; let p = 50 + (na.wr - ne.wr) * 1.2;
  if (Math.abs(na.wr - ne.wr) >= 1) why.push(`${(na.wr > ne.wr ? a : e).name} ${t('lnLaneEdge')}`);
  if (na.early != null && ne.early != null) p += (na.early - ne.early) * 0.25;
  for (const x of [a, e]) { const k = heroPhase(tl(x)); if (k) why.push(`${x.name}: ${t(k)}`); }
  if (a.strong.includes(e.id) || e.weak.includes(a.id)) { p += 5; why.unshift(`${a.name} ${t('lnCounters')} ${e.name}`); }
  if (a.weak.includes(e.id) || e.strong.includes(a.id)) { p -= 5; why.unshift(`${e.name} ${t('lnCounters')} ${a.name}`); }
  const live = S.vs.get(e.id); if (live) { if (live.good.has(a.id)) p += live.good.get(a.id) * 100; if (live.bad.has(a.id)) p += live.bad.get(a.id) * 100; }
  return { p: Math.max(30, Math.min(70, Math.round(p))), na, ne, why: why.slice(0, 4) };
}
// The analysis screen (after the tenth pick, or by a tap on the team comparison). Answer first, then the evidence:
//   verdict       three signals, each "even" or a small / clear edge, never a number: matchups (the game's counter lists and the
//                 counter statistics of the enemy picks), pairs (the game's "works well with" lists inside each team) and
//                 ratings (the game's durability, offense and skill-effect ratings). "Favoured" only when all three agree.
//   game plan     up to three sentences built from the blocks below (who to play around, what is missing, the biggest threat, anti-heal)
//   win conditions  team type (teamIdentity) and a role per hero: the two highest offense ratings carry, tanks are the front line
//   checklist     front line, crowd control, engage, burst, poke, sustain per team from roles and speciality tags, as yes / partly / missing
//   threats       the three most dangerous enemy picks with the items that answer them (COUNTER_RULES)
//   key matchups  hero against hero, independent of lanes
//   assumed lanes the lanes are a guess; a tap on a lane tag moves the hero (only this card is redrawn)
// Everything is an estimate from public data and simple rules. There is no early / mid / late strength: no usable source exists.
const fillT = (key, ...parts) => t(key).split(/\{(\d)\}/).map((s, i) => (i % 2 ? parts[Number(s)] : s));
const andList = nodes => nodes.flatMap((n, i) => (i ? [i === nodes.length - 1 ? ` ${t('and')} ` : ', ', n] : [n]));
const CHECK = [   // [label key, points of a hero, points for "yes", points for "partly"]
  ['ckFront', (x, has) => (x.roles[0] === 'tank' ? 1 : x.roles[0] === 'support' ? 0 : has(['Guard']) ? 0.75 : x.roles[0] === 'fighter' ? 0.5 : 0), 1.5, 0.5],
  ['ckCc', (x, has) => (has(['Crowd Control', 'Control']) ? 1 : 0), 3, 1],
  ['ckEngage', (x, has) => (has(['Initiator', 'Charge']) ? 1 : 0), 2, 1],
  ['ckBurst', (x, has) => (has(['Burst', 'Finisher']) ? 1 : 0), 2, 1],
  ['ckPoke', (x, has) => (has(['Poke']) ? 1 : 0), 2, 1],
  ['ckSustain', (x, has) => (has(['Regen', 'Guard']) ? 1 : 0), 2, 1],
];
async function openAnalysis() {
  if (!S.enemy.length || !S.ally.length) return;
  const el = $('analysis'); el.hidden = false; AN.open = true;
  const body = h('div', { class: 'anbody' }, h('p', { class: 'faint' }, t('loading')));
  el.replaceChildren(h('div', { class: 'anbar' }, h('button', { class: 'anback', onclick: closeAnalysis }, '‹ ' + t('anBack')), h('h2', {}, t('anTitle'))), body); el.scrollTop = 0;
  const A = S.ally.map(i => S.heroes.get(i)).filter(Boolean), E = S.enemy.map(i => S.heroes.get(i)).filter(Boolean);
  await Promise.all([...A, ...E].map(x => loadDetail(x.id)));
  if (!AN.open) return;
  const det = x => D.detail.get(x.id) || { ab: [], spec: [] }, has = x => tags => det(x).spec.some(s => tags.includes(s));
  const nm = (x, side) => h('b', { class: 'nm ' + side }, x.name);
  const port = (x, side, cls) => h('button', { class: `anp ${side} ${cls || ''}`, title: x.name, 'aria-label': x.name, onclick: () => openSheet(x.id) }, h('img', { src: x.img, alt: '' }));
  const edge = (v, small, clear) => (v >= clear ? 2 : v >= small ? 1 : v <= -clear ? -2 : v <= -small ? -1 : 0);
  const sideOf = e => (e > 0 ? 'you' : e < 0 ? 'enemy' : 'even');
  // ---- the three signals
  const pairs = []; let mScore = 0;
  for (const a of A) for (const e of E) { let v = 0, listed = 0;
    if (a.strong.includes(e.id) || e.weak.includes(a.id)) { v += 3; listed = 1; }
    if (a.weak.includes(e.id) || e.strong.includes(a.id)) { v -= 3; listed = listed ? 0 : -1; }
    const live = S.vs.get(e.id); if (live) { if (live.good.has(a.id)) v += live.good.get(a.id) * 100; else if (live.bad.has(a.id)) v += live.bad.get(a.id) * 100; }
    mScore += v; if (Math.abs(v) >= 2) pairs.push({ a, e, v, listed }); }
  const syn = list => { let c = 0; for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) if (list[i].assist.includes(list[j].id) || list[j].assist.includes(list[i].id)) c++; return c; };
  const rate = list => { const v = list.map(x => det(x).ab).filter(ab => ab.length >= 3).map(ab => (ab[0] + ab[1] + ab[2]) / 3); return v.length ? v.reduce((p, q) => p + q, 0) / v.length : null; };
  const rA = rate(A), rE = rate(E);
  const chips = [['chMatch', edge(mScore, 3, 8)], ['chPairs', edge(syn(A) - syn(E), 1, 3)], ['chRate', rA == null || rE == null ? 0 : edge(rA - rE, 3, 8)]];
  // ---- checklist
  const levelOf = (list, row) => { const pts = list.map(x => [x, row[1](x, has(x))]).filter(p => p[1] > 0).sort((p, q) => q[1] - p[1]), sum = pts.reduce((s, p) => s + p[1], 0);
    return { lvl: sum >= row[2] ? 2 : sum >= row[3] ? 1 : 0, who: pts.slice(0, 2).map(p => p[0]) }; };
  const rows = CHECK.map(row => ({ key: row[0], a: levelOf(A, row), e: levelOf(E, row) }));
  // ---- verdict
  const sum = chips.reduce((s, c) => s + c[1], 0), agree = chips.every(c => c[1] > 0) || chips.every(c => c[1] < 0);
  const vKey = Math.abs(sum) >= 4 && agree ? (sum > 0 ? 'vdYouBig' : 'vdEnemyBig') : Math.abs(sum) >= 2 ? (sum > 0 ? 'vdYouSmall' : 'vdEnemySmall') : 'vdEven';
  const leads = sgn => [...chips.filter(c => c[1] * sgn > 0).map(c => t(c[0])), ...rows.filter(r => (r.a.lvl - r.e.lvl) * sgn >= 2).map(r => t(r.key))].slice(0, 2).map(s => s.toLowerCase());
  const lY = leads(1), lE = leads(-1), listText = l => l.join(` ${t('and')} `);
  const reason = !lY.length && !lE.length ? t('vdNothing') : [lY.length ? fillT('vdLeadYou', listText(lY)).join('') : '', lE.length ? fillT('vdLeadEnemy', listText(lE)).join('') : ''].filter(Boolean).join(' ');
  const verdict = h('div', { class: 'ancard vd ' + sideOf(sum >= 2 ? 1 : sum <= -2 ? -1 : 0) }, h('div', { class: 'vd-top' }, h('span', {}, t('vdLabel')), h('span', { class: 'vd-tag' }, t('vdEstimate'))),
    h('h2', {}, t(vKey)), h('p', {}, reason),
    h('div', { class: 'vd-chips' }, chips.map(([k, e]) => h('div', { class: 'vd-chip ' + sideOf(e) }, h('small', {}, t(k)), h('b', {}, e ? `${t(e > 0 ? 'dnaYou' : 'dnaThem')} ${'●'.repeat(Math.abs(e))}` : t('dnaEven'))))));
  // ---- roles and plans
  const off = x => det(x).ab[1] || 0, frontPts = x => CHECK[0][1](x, has(x));
  const carriesOf = list => list.filter(x => !['tank', 'support'].includes(x.roles[0])).sort((p, q) => (q.roles[0] === 'marksman') - (p.roles[0] === 'marksman') || off(q) - off(p)).slice(0, 2);   // a marksman always carries, then the highest offense rating
  const frontOf = (list, not) => list.filter(x => !not.includes(x) && frontPts(x) >= 0.5).sort((p, q) => frontPts(q) - frontPts(p) || (det(q).ab[0] || 0) - (det(p).ab[0] || 0))[0] || null;
  const roleOf = (x, list) => { const c = carriesOf(list); return c.includes(x) ? 'rlCarry' : x.roles[0] === 'support' ? 'rlPeel' : frontPts(x) >= 0.75 || x === frontOf(list, c) ? 'rlFront' : ['assassin', 'fighter'].includes(x.roles[0]) ? 'rlFlank' : 'rlFlex'; };
  const cA = carriesOf(A), fA = frontOf(A, cA), cE = carriesOf(E), idA = teamIdentity(S.ally) || 'id_team', idE = teamIdentity(S.enemy) || 'id_team';
  const plan = [];
  if (cA.length) plan.push(fA ? fillT('gpProtect', andList(cA.map(x => nm(x, 'ally'))), nm(fA, 'ally')) : fillT('gpAround', andList(cA.map(x => nm(x, 'ally')))));
  const gap = rows.find(r => r.a.lvl === 0 && r.e.lvl >= 1); if (gap) plan.push(fillT('gpGap', t(gap.key).toLowerCase(), andList(gap.e.who.map(x => nm(x, 'enemy')))));
  const threatTop = [...E].sort((p, q) => off(q) - off(p))[0]; if (threatTop && off(threatTop)) plan.push(fillT('gpThreat', nm(threatTop, 'enemy')));
  const healer = E.find(x => has(x)(['Regen'])); if (healer) plan.push(fillT('gpHeal', nm(healer, 'enemy')));
  const planCard = h('div', { class: 'ancard gp' }, h('h3', {}, t('gpTitle')), h('ul', {}, plan.slice(0, 3).map(p => h('li', {}, p))),
    h('p', { class: 'gp-enemy' }, cE.length ? fillT('gpEnemy', t(idE)[0], andList(cE.map(x => nm(x, 'enemy')))) : fillT('gpEnemyNo', t(idE)[0])));
  const order = ['rlCarry', 'rlFront', 'rlPeel', 'rlFlank', 'rlFlex'];
  const winCard = (list, side, idk, same) => h('div', { class: 'ancard wc ' + side }, h('div', { class: 'wc-head' }, h('span', { class: 'wc-side' }, t(side === 'ally' ? 'ally' : 'enemy')), h('span', { class: 'wc-plan' }, t(idk)[0])),
    h('p', {}, same ? t('wcSame') : t(idk)[1]),
    h('div', { class: 'wc-row' }, list.map(x => [x, roleOf(x, list)]).sort((p, q) => order.indexOf(p[1]) - order.indexOf(q[1])).map(([x, r]) => h('div', { class: 'wc-hero' }, port(x, side), h('span', {}, t(r))))));
  // ---- checklist table
  const cell = (lv, side, ahead) => h('div', { class: `ck-cell ${['miss', 'part', 'yes'][lv.lvl]}${ahead ? ' ahead ' + side : ''}` }, h('b', {}, t(['ckMiss', 'ckPart', 'ckYes'][lv.lvl])), lv.who.length ? h('small', {}, lv.who.map(x => x.name).join(', ')) : null);
  const checkCard = h('div', { class: 'ancard ck' }, h('div', { class: 'ck-head' }, h('span', { class: 'y' }, t('dnaYou')), h('span', {}), h('span', { class: 'e' }, t('dnaThem'))),
    rows.map(r => { const d = r.a.lvl - r.e.lvl; return h('div', { class: 'ck-row' }, cell(r.a, 'you', d > 0), h('div', { class: 'ck-mid' }, h('span', {}, t(r.key)), h('i', { class: sideOf(d) }, d > 0 ? '◀'.repeat(d) : d < 0 ? '▶'.repeat(-d) : '=')), cell(r.e, 'enemy', d < 0)); }));
  // ---- threats and what to buy
  const threats = [...E].sort((p, q) => (off(q) + q.ban * 60) - (off(p) + p.ban * 60)).slice(0, 3);
  const threatRow = x => { const buy = h('div', { class: 'th-buy' });
    counterItems(x, det(x)).then(ci => { if (ci.length) buy.replaceChildren(h('span', {}, `${t(ci[0].why).replace(/^./, ch => ch.toUpperCase())}:`), ...ci.slice(0, 3).map(c => h('span', { class: 'th-item' }, c.icon ? h('img', { src: c.icon, alt: '', loading: 'lazy' }) : null, c.name))); }).catch(() => { });
    return h('div', { class: 'th-row' }, port(x, 'enemy'), h('div', {}, h('b', {}, x.name), h('span', { class: 'tag' }, det(x).spec.slice(0, 2).join(' · ')), buy)); };
  const banned = E.filter(x => x.ban >= 0.3);
  const threatCard = h('div', { class: 'ancard th' }, threats.map(threatRow), banned.length ? h('p', { class: 'th-ban' }, `${t('thBanned')} ${banned.map(x => x.name).join(', ')}`) : null, h('p', { class: 'faint' }, t('thNote')));
  // ---- key matchups
  const mmRow = (p, side) => { const clear = Math.abs(p.v) >= 5, w = side === 'you' ? p.a : p.e, l = side === 'you' ? p.e : p.a;
    return h('div', { class: 'mm-row' }, port(p.a, 'ally', side === 'you' ? 'win' : ''), h('div', { class: 'mm-mid ' + side }, h('b', {}, `${side === 'you' ? (clear ? '◀◀ ' : '◀ ') : ''}${t(clear ? 'edClear' : 'edSmall')}${side === 'enemy' ? (clear ? ' ▶▶' : ' ▶') : ''}`),
      h('p', {}, fillT((side === 'you' ? p.listed > 0 : p.listed < 0) ? 'mmListed' : 'mmStat', w.name, l.name).join(''))), port(p.e, 'enemy', side === 'enemy' ? 'win' : '')); };
  const mY = pairs.filter(p => p.v > 0).sort((p, q) => q.v - p.v).slice(0, 3), mE = pairs.filter(p => p.v < 0).sort((p, q) => p.v - q.v).slice(0, 3);
  const matchCard = h('div', { class: 'ancard mm' }, !mY.length && !mE.length ? h('p', { class: 'faint' }, t('mmNone')) : [mY.length ? [h('div', { class: 'mm-sub you' }, t('mmYou')), mY.map(p => mmRow(p, 'you'))] : null, mE.length ? [h('div', { class: 'mm-sub enemy' }, t('mmEnemy')), mE.map(p => mmRow(p, 'enemy'))] : null]);
  // ---- assumed lanes: only this card is redrawn when a lane changes
  const lanesCard = h('div', { class: 'ancard ln' }); let picking = null;
  const drawLanes = () => { const LA = assignLanes('ally'), LE = assignLanes('enemy'), maps = { ally: LA, enemy: LE };
    const setLane = (side, from, to) => { const map = maps[side], id = map[from], other = map[to]; picking = null; if (id && from !== to) { AN.lanes[side] = { ...Object.fromEntries(Object.entries(map).map(([l, i]) => [i, l])), [id]: to }; if (other) AN.lanes[side][other] = from; } drawLanes(); };
    const tag = (side, l) => (maps[side][l] ? h('button', { class: 'ln-tag' + (picking && picking.side === side && picking.lane === l ? ' on' : ''), 'aria-label': `${t('laneChange')}: ${(S.heroes.get(maps[side][l]) || {}).name || ''}`, onclick: () => { picking = picking && picking.side === side && picking.lane === l ? null : { side, lane: l }; drawLanes(); } }, h('img', { src: S.icons.lanes[l], alt: '' }), t(l)) : h('span', { class: 'ln-tag none' }));
    const hero = (side, l) => { const x = S.heroes.get(maps[side][l]); return x ? port(x, side, 'big') : h('span', { class: 'anp none' }); };
    const px = picking && S.heroes.get(maps[picking.side][picking.lane]);
    lanesCard.replaceChildren(h('div', { class: 'ln-lab y' }, t('dnaYou')), h('div', { class: 'ln-row' }, LANE_ORDER.map(l => hero('ally', l))), h('div', { class: 'ln-row' }, LANE_ORDER.map(l => tag('ally', l))),
      h('div', { class: 'ln-row' }, LANE_ORDER.map(l => tag('enemy', l))), h('div', { class: 'ln-row' }, LANE_ORDER.map(l => hero('enemy', l))), h('div', { class: 'ln-lab e' }, t('dnaThem')),
      px ? h('div', { class: 'lp' }, h('span', {}, fillT('lpMove', px.name).join('')), h('div', { class: 'lp-grid' }, LANE_ORDER.map(k => h('button', { class: 'lp-btn' + (k === picking.lane ? ' on' : ''), onclick: () => setLane(picking.side, picking.lane, k) }, h('img', { src: S.icons.lanes[k], alt: '' }), t(k))))) : h('p', { class: 'faint' }, t('lnNote'))); };
  drawLanes();
  body.replaceChildren(h('div', { class: 'ancol' }, verdict, planCard, h('h3', {}, t('anWin')), winCard(A, 'ally', idA, false), winCard(E, 'enemy', idE, idA === idE)),
    h('div', { class: 'ancol' }, h('h3', {}, t('ckTitle')), checkCard, h('h3', {}, t('thTitle')), threatCard, h('h3', {}, t('mmTitle')), matchCard, h('h3', {}, t('lnTitle')), lanesCard,
      h('p', { class: 'faint anfoot' }, t('anFoot')), h('button', { class: 'anback wide', onclick: closeAnalysis }, '‹ ' + t('anBackLong'))));
}
function closeAnalysis() { AN.open = false; $('analysis').hidden = true; }

// ---- meta page ---------------------------------------------------------------------------------------------------
// The second tab: every hero with win, pick and ban rate for the chosen rank and time window (the numbers the draft
// already loads), filtered by type and lane, sorted by a tap on a column. A tap on a hero opens its sheet.
const MT = { role: '', lane: '', sort: 'win' };
function setView(v) {
  S.view = v; document.body.dataset.view = v; $('meta').hidden = v !== 'meta'; $('mpl').hidden = v !== 'mpl';
  for (const b of document.querySelectorAll('.tab')) b.classList.toggle('on', b.dataset.view === v);
  $('btnView').textContent = t(v === 'draft' ? 'tabMetaLong' : 'tabDraftLong');
  if (v === 'meta') drawMeta(); if (v === 'mpl') drawMpl();
}
function drawMeta() {
  if (S.view !== 'meta') return;
  const head = $('metaHead'), list = $('metaList');
  if (!S.ready) { head.replaceChildren(); list.replaceChildren(h('p', { class: 'faint' }, t(S.failed ? 'failed' : 'loading'))); return; }
  const chip = (kind, key, icons) => h('button', { class: 'chip sym' + (MT[kind] === key ? ' on' : ''), title: t(key), 'aria-label': t(key), 'aria-pressed': String(MT[kind] === key), onclick: () => { MT[kind] = MT[kind] === key ? '' : key; drawMeta(); } }, h('img', { src: icons[key], alt: '' }));
  const col = (key, label) => h('button', { class: 'mtcol' + (MT.sort === key ? ' on' : ''), onclick: () => { MT.sort = key; drawMeta(); } }, label + (MT.sort === key ? ' ▾' : ''));
  head.replaceChildren(h('div', { class: 'chiprow' }, h('div', { class: 'chips' }, ROLES.map(k => chip('role', k, S.icons.roles))), h('span', { class: 'mtsep' }), h('div', { class: 'chips' }, LANES.map(k => chip('lane', k, S.icons.lanes)))),
    h('div', { class: 'mtrow mthead' }, h('span', {}), h('span', {}), h('span', { class: 'mtname' }, T[S.lang].data($('rank').selectedOptions[0].textContent, S.days)), col('win', t('mtWin')), col('pick', t('mtPick')), col('ban', t('mtBan'))));
  const rows = [...S.heroes.values()].filter(x => (!MT.role || x.roles.includes(MT.role)) && (!MT.lane || x.lanes.includes(MT.lane)) && (x.pick || x.win)).sort((a, b) => b[MT.sort] - a[MT.sort] || a.name.localeCompare(b.name));
  const p1 = v => `${(v * 100).toFixed(1)}%`;
  list.replaceChildren(...(rows.length ? rows.map((x, i) => h('button', { class: 'mtrow', onclick: () => openSheet(x.id) }, h('span', { class: 'mtnum' }, String(i + 1)), h('img', { src: x.img, alt: '', loading: 'lazy' }),
    h('span', { class: 'mtname' }, h('b', {}, x.name), h('small', {}, x.lanes.map(l => t(l)).join(' / '), h('i', { class: 'mttrend', 'data-id': String(x.id) }))),
    h('span', { class: 'mtval' + (MT.sort === 'win' ? ' on' : '') + (x.win >= 0.52 ? ' good' : x.win < 0.48 ? ' bad' : '') }, p1(x.win)), h('span', { class: 'mtval' + (MT.sort === 'pick' ? ' on' : '') }, p1(x.pick)), h('span', { class: 'mtval' + (MT.sort === 'ban' ? ' on' : '') }, p1(x.ban))))
    : [h('p', { class: 'faint' }, t('none'))]));
  list.scrollTop = 0;
  // weekly trend for the 20 heroes at the top of this sorting only, one after another (one request each; the service throttles more)
  const run = MT.run = (MT.run || 0) + 1;
  rows.slice(0, 20).reduce((p, x) => p.then(() => (MT.run !== run ? null : loadTrend(x.id).then(v => { const el = list.querySelector(`.mttrend[data-id="${x.id}"]`);
    if (el && v != null && Math.abs(v) >= 0.5) { el.textContent = `${v > 0 ? '▲ +' : '▼ −'}${Math.abs(v).toFixed(1)}`; el.classList.add(v > 0 ? 'up' : 'down'); } }))), Promise.resolve());
}
for (const b of document.querySelectorAll('.tab')) b.addEventListener('click', () => setView(b.dataset.view));
$('btnView').addEventListener('click', () => { $('menu').close(); setView(S.view === 'draft' ? 'meta' : 'draft'); });

// ---- MPL page ----------------------------------------------------------------------------------------------------
// The third tab: matches and standings of the four MPL leagues the data service follows.
//   /api/esports/<id|ph|my|kh>/standings    rank, team, matches won and lost, games won and lost
//   /api/esports/<league>/schedule          weeks > days > matches { start_at, team1, team2, score1, score2, status, winner, best_of, replay_url }
//   /api/esports/<league>/playoffs          days > matches, with a round name
// Three requests per league, kept for half an hour.
const ML = { lg: 'id', part: 'matches', data: new Map() };
const LEAGUES = [['id', 'Indonesia'], ['ph', 'Philippines'], ['my', 'Malaysia'], ['kh', 'Cambodia']];
async function loadLeague(lg) {
  if (ML.data.has(lg)) return ML.data.get(lg);
  const c = store.get('mpl.' + lg, null); if (c && Date.now() - c.at < 30 * 60e3) { ML.data.set(lg, c.v); return c.v; }
  const grab = async p => { try { return await fetchJson(`/esports/${lg}/${p}`); } catch (e) { console.warn('mpl', lg, p, e.message); return null; } };
  const [st, sc, po] = await Promise.all([grab('standings'), grab('schedule'), grab('playoffs')]);
  const matches = [], tm = x => ({ n: (x || {}).name || '?', l: (x || {}).logo || '' });
  const add = (days, week) => { for (const day of arr(days)) for (const m of arr(day.matches)) matches.push({ at: m.start_at || '', a: tm(m.team1), b: tm(m.team2), sa: m.score1, sb: m.score2, done: m.status === 'finished', win: m.winner || '', round: m.round || '', week, bo: m.best_of || 0, replay: m.replay_url || '' }); };
  for (const w of arr(sc && sc.weeks)) add(w.days, w.week || 0);
  add(po && po.days, 0);
  const v = { standings: arr(st && st.standings).map(r => ({ rank: r.rank, name: (r.team || {}).full_name || (r.team || {}).name || '?', logo: (r.team || {}).logo || '', mw: (r.match_wl || {}).win ?? 0, ml: (r.match_wl || {}).lose ?? 0, gw: (r.game_wl || {}).win ?? 0, gl: (r.game_wl || {}).lose ?? 0 })), matches };
  if (v.standings.length || matches.length) { ML.data.set(lg, v); store.set('mpl.' + lg, { at: Date.now(), v }); }
  return v;
}
async function drawMpl() {
  if (S.view !== 'mpl') return;
  const head = $('mplHead'), list = $('mplList'), lg = ML.lg;
  const seg = (on, label, act) => h('button', { class: 'chip' + (on ? ' on' : ''), 'aria-pressed': String(on), onclick: act }, label);
  head.replaceChildren(h('div', { class: 'chiprow' }, h('div', { class: 'chips' }, LEAGUES.map(([k, n]) => seg(ML.lg === k, n, () => { ML.lg = k; drawMpl(); })))),
    h('div', { class: 'chiprow mplseg' }, h('div', { class: 'chips' }, seg(ML.part === 'matches', t('mplMatches'), () => { ML.part = 'matches'; drawMpl(); }), seg(ML.part === 'standings', t('mplStand'), () => { ML.part = 'standings'; drawMpl(); }))));
  if (!ML.data.has(lg)) list.replaceChildren(h('p', { class: 'faint' }, t('loading')));
  const v = await loadLeague(lg); if (S.view !== 'mpl' || ML.lg !== lg) return;
  const logo = u => (u ? h('img', { src: u, alt: '', loading: 'lazy' }) : h('span', { class: 'nologo' }));
  if (ML.part === 'standings') {
    list.replaceChildren(...(v.standings.length ? [h('div', { class: 'strow sthead' }, h('span', {}), h('span', {}), h('span', {}), h('span', {}, t('mplMatches')), h('span', {}, t('mplGames'))),
      ...v.standings.map(r => h('div', { class: 'strow' }, h('span', { class: 'mtnum' }, String(r.rank)), logo(r.logo), h('b', {}, r.name), h('span', {}, `${r.mw} – ${r.ml}`), h('span', {}, `${r.gw} – ${r.gl}`)))] : [h('p', { class: 'faint' }, t('mplNone'))]));
  } else {
    const when = m => { const d = new Date(m.at); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(S.lang, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };
    const up = v.matches.filter(m => !m.done).sort((p, q) => p.at.localeCompare(q.at)), done = v.matches.filter(m => m.done).sort((p, q) => q.at.localeCompare(p.at)).slice(0, 40);
    const row = m => h('div', { class: 'mprow' + (m.done ? '' : ' up') }, h('div', { class: 'mpmeta' }, h('span', {}, when(m)), h('span', {}, [m.round || (m.week ? `${t('mplWeek')} ${m.week}` : t('mplPlayoffs')), m.bo ? `Bo${m.bo}` : ''].filter(Boolean).join(' · ')),
        m.replay ? h('a', { href: m.replay, target: '_blank', rel: 'noopener' }, t('mplReplay') + ' ›') : null),
      h('div', { class: 'mpteams' }, h('span', { class: 'mpt a' + (m.win === 'team1' ? ' win' : '') }, h('b', {}, m.a.n), logo(m.a.l)), h('span', { class: 'mpscore' }, m.done ? `${m.sa ?? 0} : ${m.sb ?? 0}` : 'vs'), h('span', { class: 'mpt b' + (m.win === 'team2' ? ' win' : '') }, logo(m.b.l), h('b', {}, m.b.n))));
    list.replaceChildren(...(up.length || done.length ? [...(up.length ? [h('div', { class: 'mpsub' }, t('mplUpcoming')), ...up.map(row)] : []), ...(done.length ? [h('div', { class: 'mpsub' }, t('mplResults')), ...done.map(row)] : [])] : [h('p', { class: 'faint' }, t('mplNone'))]));
  }
  list.scrollTop = 0;
}
$('btnMpl').addEventListener('click', () => { $('menu').close(); setView('mpl'); });

// ---- start -----------------------------------------------------------------------------------------------------
function applyLang() {
  document.documentElement.lang = S.lang;
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
  $('q').placeholder = t('search');
  $('dataNote').textContent = S.ready ? T[S.lang].data($('rank').selectedOptions[0].textContent, S.days) : '';
  drawPhase(false); drawChips(); drawGrid(); drawSuggest(); setView(S.view || (/[#&]meta/.test(location.hash) ? 'meta' : /[#&]mpl/.test(location.hash) ? 'mpl' : 'draft'));
}
async function boot(force) {
  S.ready = false; S.failed = false; drawGrid(); drawSuggest();
  try { await loadHeroes(force); S.ready = true; } catch (e) { console.warn('load', e.message); S.failed = true; }
  // a draft in the address (#d=enemy ids/ally ids/ban ids, e.g. #d=30,88/45/132) wins over the one kept in the browser
  const m = /^#d=([\d,]*)\/([\d,]*)\/?([\d,]*)/.exec(location.hash), nums = s => s.split(',').map(Number).filter(Boolean);
  // #h=enemy names/ally names (e.g. #h=paquito,atlas/sora,nolan) does the same with hero names (support, screenshots)
  const hm = /^#h=([^\/&]*)\/([^\/&]*)/.exec(decodeURIComponent(location.hash)), byName = s2 => s2.split(',').map(n => { const k = n.toLowerCase().replace(/[^a-z0-9]/g, ''); const x = k && [...S.heroes.values()].find(o => o.name.toLowerCase().replace(/[^a-z0-9]/g, '') === k); return x ? x.id : 0; }).filter(Boolean);
  const d = hm && S.ready ? { enemy: byName(hm[1]), ally: byName(hm[2]), bans: [] } : m ? { enemy: nums(m[1]), ally: nums(m[2]), bans: nums(m[3]) } : store.get('draft', null);
  if (S.ready && d && !boot.restored) { boot.restored = true; for (const k of ['enemy', 'ally']) S[k] = (d[k] || []).filter(i => S.heroes.has(i)).slice(0, 5); S.bans = (d.bans || []).filter(i => S.heroes.has(i)).slice(0, 10); S.enemy.forEach(i => loadRelation('counters', i)); S.ally.forEach(i => loadRelation('compatibility', i)); [...S.enemy, ...S.ally].forEach(i => { loadDetail(i); const hx = S.heroes.get(i); loadTimeline(i, (hx && hx.lanes[0]) || 'mid').then(drawDna); }); }
  if (S.enemy.length || S.ally.length) S.rankPicked = true;
  drawPhase.last = -1; const ph = phase(); setMode(ph.kind === 'ban' ? 'ban' : 'enemy'); drawPhase.last = ph.i;
  applyLang(); drawBoard(); drawDna();
  const fm = /[#&]role=(\w+)(?:&lane=(\w+))?/.exec(location.hash); if (S.ready && fm && !boot.fl) { boot.fl = true; S.roles.add(fm[1]); if (fm[2]) S.lanes.add(fm[2]); drawChips(); drawGrid(); }   // #...&role=<type>[&lane=<lane>] opens step 2 of the picker (support, screenshots)
  if (S.ready && /[#&]analysis/.test(location.hash) && !boot.an) { boot.an = true; setTimeout(openAnalysis, 600); }   // #...&analysis opens the analysis screen (support, screenshots)
  const sm = /[#&]sheet=(\d+)/.exec(location.hash); if (S.ready && sm && !boot.sheet) { boot.sheet = true; openSheet(Number(sm[1])); }   // #...&sheet=<id> opens a hero's sheet (support, screenshots)
}
for (const b of document.querySelectorAll('.mode')) b.addEventListener('click', () => setMode(b.dataset.mode));
$('q').addEventListener('input', e => { S.q = e.target.value; drawGrid(); });
$('btnUndo').addEventListener('click', undo);
$('dna').addEventListener('click', () => openAnalysis());   // the team comparison is the way into the analysis
$('btnReset').addEventListener('click', () => { if (S.enemy.length || S.ally.length || S.bans.length) keep(); S.enemy = []; S.ally = []; S.bans = []; store.set('draft', { enemy: [], ally: [], bans: [] }); S.skipped = 0; drawPhase.last = -1; place.wasFull = false; S.rankPicked = false; clearFilters(); setMode('enemy'); drawPhase(true); drawGrid(); drawSuggest(); drawDna(); });
$('sheet').querySelector('.sheetback').addEventListener('click', () => closeSheet());
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('sheet').hidden) closeSheet(); else closeAnalysis(); } });
$('btnMenu').addEventListener('click', () => $('menu').showModal());
// a one-panel explanation on the first visit; "How it works" in the settings shows it again
$('btnHelp').addEventListener('click', () => { $('menu').close(); $('intro').showModal(); });
$('intro').addEventListener('close', () => store.set('seenIntro', 1));
if (!store.get('seenIntro', 0) && !/[#&](sheet|analysis|nointro)/.test(location.hash)) setTimeout(() => { try { $('intro').showModal(); } catch { } }, 300);
$('lang').value = S.lang; $('lang').addEventListener('change', e => { S.lang = e.target.value; store.set('lang', S.lang); applyLang(); });
$('rank').value = S.rank; $('rank').addEventListener('change', e => { S.rank = e.target.value; store.set('rank2', S.rank); S.vs.clear(); S.beside.clear(); boot(false); });
$('days').value = String(S.days); $('days').addEventListener('change', e => { S.days = Number(e.target.value); store.set('days', S.days); S.vs.clear(); S.beside.clear(); boot(false); });
$('btnRefresh').addEventListener('click', () => { S.vs.clear(); S.beside.clear(); boot(true); $('menu').close(); });
document.body.dataset.mode = S.mode;
document.body.dataset.design = S.design;
boot(false);
