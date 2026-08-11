const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');

const stages = [
  { name: 'Dewdrop Meadow', sky: ['#9be7ff', '#e8fff2'], ground: '#63b35d', theme: 'rolling grass, mushroom bunkers, soft soil', unlockRank: 1, troopLimit: 3 },
  { name: 'Sugarcane Ruins', sky: ['#ffd6a5', '#fff1bd'], ground: '#c59b55', theme: 'crumbly temple blocks and cane bridges', unlockRank: 2, troopLimit: 4 },
  { name: 'Moonlit Compost Yard', sky: ['#273469', '#0b1026'], ground: '#5a7d3b', theme: 'metal scraps, toxic barrels, night ambushes', unlockRank: 3, troopLimit: 5 },
  { name: 'Monarch Cliffs', sky: ['#ff8fab', '#5f0f40'], ground: '#6d597a', theme: 'high winds and butterfly bombing runs', unlockRank: 4, troopLimit: 6 },
];

const troopTypes = [
  { key: 'spearman', name: 'Spearman', rank: 1, hp: 95, note: 'Reliable close arc jab.' },
  { key: 'bowman', name: 'Bowman', rank: 1, hp: 80, note: 'Fast arrows with clean arcs.' },
  { key: 'slinger', name: 'Slingshot', rank: 1, hp: 75, note: 'Pebbles chip brittle cover.' },
  { key: 'rifle', name: 'Rifleman', rank: 2, hp: 70, note: 'Flat bullet shots.' },
  { key: 'grenadier', name: 'Grenade Launcher', rank: 2, hp: 85, note: 'Lobs explosive shells.' },
  { key: 'rocket', name: 'Rocket Launcher', rank: 3, hp: 90, note: 'Target, random, or heat seeking rockets.' },
  { key: 'miner', name: 'Stealth Miner', rank: 3, hp: 65, note: 'Burrows and plants mines.' },
  { key: 'butterfly', name: 'Butterfly Bomber', rank: 4, hp: 70, note: 'Evolved aerial bomb dropper.' },
];

const weapons = [
  { key: 'spear', name: 'Spear', rank: 1, troop: ['spearman'], speed: 10, blast: 22, damage: 28, damageTerrain: false },
  { key: 'arrow', name: 'Arrow', rank: 1, troop: ['bowman'], speed: 14, blast: 16, damage: 22, damageTerrain: false },
  { key: 'stone', name: 'Stone', rank: 1, troop: ['slinger'], speed: 11, blast: 28, damage: 25, damageTerrain: true },
  { key: 'bullet', name: 'Bullet', rank: 2, troop: ['rifle'], speed: 19, blast: 12, damage: 34, damageTerrain: false },
  { key: 'grenade', name: 'Grenade', rank: 2, troop: ['grenadier'], speed: 9, blast: 50, damage: 42, damageTerrain: true },
  { key: 'rocket-target', name: 'Target Rocket', rank: 3, troop: ['rocket'], speed: 12, blast: 64, damage: 52, damageTerrain: true, seeking: 'target' },
  { key: 'rocket-heat', name: 'Heat Seeker', rank: 3, troop: ['rocket'], speed: 10, blast: 54, damage: 45, damageTerrain: true, seeking: 'heat' },
  { key: 'cluster', name: 'Cluster Bomb', rank: 3, troop: ['grenadier', 'butterfly'], speed: 8, blast: 42, damage: 38, damageTerrain: true, cluster: true },
  { key: 'mine', name: 'Stealth Mine', rank: 3, troop: ['miner'], speed: 7, blast: 58, damage: 50, damageTerrain: true },
  { key: 'butterbomb', name: 'Butterfly Bomb', rank: 4, troop: ['butterfly'], speed: 6, blast: 62, damage: 58, damageTerrain: true },
];

const state = { rank: 1, xp: 0, stageIndex: 0, activeWeapon: weapons[0], turn: 'player', projectile: null, winner: null, wind: 0, startedAt: Date.now() };
let terrain = [];
let troops = [];
let obstacles = [];

const els = {
  difficulty: document.querySelector('#difficulty'), stageSelect: document.querySelector('#stageSelect'), newBattle: document.querySelector('#newBattle'),
  rankCard: document.querySelector('#rankCard'), troopList: document.querySelector('#troopList'), weaponList: document.querySelector('#weaponList'), briefing: document.querySelector('#briefing'),
  turnInfo: document.querySelector('#turnInfo'), angle: document.querySelector('#angle'), power: document.querySelector('#power'), angleValue: document.querySelector('#angleValue'), powerValue: document.querySelector('#powerValue'), fire: document.querySelector('#fire'), evolve: document.querySelector('#evolve'), log: document.querySelector('#log')
};

function terrainY(x) { return terrain[Math.max(0, Math.min(canvas.width - 1, Math.round(x)))] ?? 500; }
function rand(min, max) { return Math.random() * (max - min) + min; }
function log(message) { const li = document.createElement('li'); li.textContent = message; els.log.prepend(li); }
function currentStage() { return stages[state.stageIndex]; }
function unlockedTroops() { return troopTypes.filter(t => t.rank <= state.rank && t.rank <= currentStage().unlockRank); }
function unlockedWeapons(troop) { return weapons.filter(w => w.rank <= state.rank && (!troop || w.troop.includes(troop.type))); }

function makeTerrain() {
  terrain = Array.from({ length: canvas.width }, (_, x) => 440 + Math.sin(x / 75) * 45 + Math.sin(x / 31) * 14 + rand(-3, 3));
  obstacles = Array.from({ length: 7 }, (_, i) => ({ x: 190 + i * 125 + rand(-30, 30), y: terrainY(190 + i * 125) - rand(45, 95), w: rand(36, 70), h: rand(36, 96), hp: 70, brittle: i % 2 === 0 }));
}

function spawnTroops() {
  const picks = unlockedTroops().slice(0, currentStage().troopLimit);
  troops = [];
  picks.forEach((type, i) => troops.push({ team: 'player', type: type.key, name: type.name, hp: type.hp, x: 80 + i * 60, y: terrainY(80 + i * 60) - 18, alive: true, evolved: false }));
  picks.slice().reverse().forEach((type, i) => troops.push({ team: 'enemy', type: type.key, name: `Enemy ${type.name}`, hp: type.hp, x: 1020 - i * 60, y: terrainY(1020 - i * 60) - 18, alive: true, evolved: false }));
}

function resetBattle() {
  state.stageIndex = Number(els.stageSelect.value || 0); state.turn = 'player'; state.projectile = null; state.winner = null; state.wind = rand(-0.045, 0.045); state.startedAt = Date.now();
  els.log.innerHTML = ''; makeTerrain(); spawnTroops(); state.activeWeapon = unlockedWeapons(activeTroop())[0] || weapons[0]; log(`${currentStage().name}: ${currentStage().theme}.`); renderUI(); draw();
}
function activeTroop(team = state.turn) { return troops.find(t => t.team === team && t.alive); }

function fire() {
  if (state.projectile || state.winner) return;
  const troop = activeTroop(); if (!troop) return;
  const weapon = state.activeWeapon;
  const dir = troop.team === 'player' ? 1 : -1;
  const angle = (Number(els.angle.value) * Math.PI) / 180;
  const power = Number(els.power.value) / 5;
  state.projectile = { x: troop.x, y: troop.y - 12, vx: Math.cos(angle) * power * dir * (weapon.speed / 10), vy: -Math.sin(angle) * power * (weapon.speed / 10), weapon, life: 0 };
  log(`${troop.name} launches ${weapon.name}.`);
}

function explode(p) {
  const { weapon } = p;
  troops.forEach(t => { if (!t.alive) return; const d = Math.hypot(t.x - p.x, t.y - p.y); if (d < weapon.blast) { t.hp -= Math.round(weapon.damage * (1 - d / weapon.blast)); if (t.hp <= 0) { t.alive = false; log(`${t.name} is knocked out!`); } } });
  if (weapon.damageTerrain) {
    for (let x = Math.max(0, Math.floor(p.x - weapon.blast)); x < Math.min(canvas.width, p.x + weapon.blast); x++) {
      const d = Math.abs(x - p.x); if (d < weapon.blast) terrain[x] += Math.cos(d / weapon.blast * Math.PI / 2) * 46;
    }
    obstacles.forEach(o => { if (Math.hypot(o.x + o.w / 2 - p.x, o.y + o.h / 2 - p.y) < weapon.blast + 30) o.hp -= weapon.damage; });
  }
  if (weapon.cluster) for (let i = 0; i < 4; i++) setTimeout(() => explode({ x: p.x + rand(-70, 70), y: p.y + rand(-20, 25), weapon: { ...weapon, blast: 25, damage: 18, damageTerrain: true } }), i * 90);
  obstacles = obstacles.filter(o => o.hp > 0);
  state.projectile = null; nextTurn();
}

function nextTurn() {
  const playerAlive = troops.some(t => t.team === 'player' && t.alive), enemyAlive = troops.some(t => t.team === 'enemy' && t.alive);
  if (!playerAlive || !enemyAlive) { state.winner = playerAlive ? 'player' : 'enemy'; awardXP(); renderUI(); return; }
  state.turn = state.turn === 'player' ? 'enemy' : 'player';
  if (state.turn === 'enemy') setTimeout(enemyMove, 750);
  renderUI();
}
function awardXP() { if (state.winner === 'player') { const fast = Math.max(1, 4 - Math.floor((Date.now() - state.startedAt) / 45000)); state.xp += 45 * fast; if (state.xp >= state.rank * 100 && state.rank < 4) { state.xp = 0; state.rank++; log(`Promotion! General rank ${state.rank} unlocked new caterpillar doctrines.`); } } log(`${state.winner === 'player' ? 'Victory' : 'Defeat'}!`); }
function enemyMove() { const troop = activeTroop('enemy'); if (!troop) return; const arsenal = unlockedWeapons(troop); state.activeWeapon = arsenal[arsenal.length - 1] || weapons[0]; els.angle.value = rand(25, 65); els.power.value = rand(38, 68); fire(); renderUI(); }
function evolve() { const t = activeTroop('player'); if (state.rank < 4 || !t || t.evolved) { log('Evolution requires General rank 4 and a ready caterpillar.'); return; } t.type = 'butterfly'; t.name = 'Evolved Butterfly'; t.evolved = true; t.hp = Math.max(t.hp, 70); log('A caterpillar forms a chrysalis flash and emerges as a butterfly bomber!'); renderUI(); }

function update() {
  const p = state.projectile;
  if (p) {
    const target = troops.find(t => t.team !== state.turn && t.alive);
    if (p.weapon.seeking === 'heat' && target) { p.vx += Math.sign(target.x - p.x) * 0.018; p.vy += Math.sign(target.y - p.y) * 0.012; }
    if (p.weapon.seeking === 'random') p.vx += rand(-0.04, 0.04);
    p.vx += state.wind; p.vy += 0.16; p.x += p.vx; p.y += p.vy; p.life++;
    const hitObstacle = obstacles.find(o => p.x > o.x && p.x < o.x + o.w && p.y > o.y && p.y < o.y + o.h);
    if (p.x < 0 || p.x > canvas.width || p.y > canvas.height || p.y >= terrainY(p.x) || hitObstacle || p.life > 480) explode(p);
  }
  draw(); requestAnimationFrame(update);
}

function drawGuide(troop) {
  if (els.difficulty.value === 'hard' || state.projectile || state.turn !== 'player') return;
  const steps = els.difficulty.value === 'easy' ? 52 : 24, skip = els.difficulty.value === 'easy' ? 1 : 2;
  let x = troop.x, y = troop.y - 12, vx = Math.cos(Number(els.angle.value) * Math.PI / 180) * Number(els.power.value) / 5, vy = -Math.sin(Number(els.angle.value) * Math.PI / 180) * Number(els.power.value) / 5;
  ctx.fillStyle = 'rgba(255,255,255,.72)';
  for (let i = 0; i < steps; i += skip) { vx += state.wind; vy += 0.16; x += vx; y += vy; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); if (y >= terrainY(x)) break; }
}
function draw() {
  const st = currentStage(); const grad = ctx.createLinearGradient(0, 0, 0, canvas.height); grad.addColorStop(0, st.sky[0]); grad.addColorStop(1, st.sky[1]); ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(110 + i * 160, 80 + Math.sin(i) * 25, 54, 18, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = st.ground; ctx.beginPath(); ctx.moveTo(0, canvas.height); terrain.forEach((y, x) => ctx.lineTo(x, y)); ctx.lineTo(canvas.width, canvas.height); ctx.fill();
  obstacles.forEach(o => { ctx.fillStyle = o.brittle ? '#b5651d' : '#6c757d'; ctx.fillRect(o.x, o.y, o.w, o.h); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.strokeRect(o.x, o.y, o.w, o.h); });
  const troop = activeTroop(); if (troop) drawGuide(troop);
  troops.forEach(t => { if (!t.alive) return; t.y = Math.min(t.y + 2, terrainY(t.x) - 18); ctx.fillStyle = t.team === 'player' ? '#8ac926' : '#ff595e'; if (t.type === 'butterfly') { ctx.beginPath(); ctx.ellipse(t.x - 14, t.y - 12, 16, 24, -.5, 0, Math.PI * 2); ctx.ellipse(t.x + 14, t.y - 12, 16, 24, .5, 0, Math.PI * 2); ctx.fill(); } for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(t.x - 18 + i * 12, t.y, 10, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#111'; ctx.fillRect(t.x - 23, t.y - 30, 46, 5); ctx.fillStyle = '#ffd166'; ctx.fillRect(t.x - 23, t.y - 30, 46 * Math.max(0, t.hp) / 100, 5); });
  if (state.projectile) { ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(state.projectile.x, state.projectile.y, 6, 0, Math.PI * 2); ctx.fill(); }
}
function renderUI() {
  stages.forEach((s, i) => { if (!els.stageSelect.options[i]) els.stageSelect.add(new Option(s.name, i)); els.stageSelect.options[i].disabled = s.unlockRank > state.rank; });
  els.rankCard.innerHTML = `<div class="card"><strong class="rank">Rank ${state.rank} General</strong><div class="meta">XP ${state.xp}/${state.rank * 100}. Promotions improve weapon prowess and unlock advanced troops.</div><div class="meta">Wind ${state.wind.toFixed(3)}</div></div>`;
  els.briefing.innerHTML = `<p>${currentStage().theme}</p><p class="meta">Troop limit: ${currentStage().troopLimit}. Stage tech cap: rank ${currentStage().unlockRank}.</p>`;
  const active = activeTroop();
  els.turnInfo.innerHTML = state.winner ? `<strong>${state.winner.toUpperCase()} WINS</strong>` : `<strong>${state.turn.toUpperCase()} TURN</strong> ${active ? active.name + ' HP ' + active.hp : ''}`;
  els.troopList.innerHTML = troopTypes.map(t => `<div class="troop ${t.rank <= state.rank ? '' : 'locked'}"><strong>${t.name}</strong><div class="meta">Rank ${t.rank}: ${t.note}</div></div>`).join('');
  const allowed = unlockedWeapons(active); if (!allowed.includes(state.activeWeapon)) state.activeWeapon = allowed[0] || weapons[0];
  els.weaponList.innerHTML = weapons.map(w => `<div class="weapon ${w === state.activeWeapon ? 'active' : ''} ${allowed.includes(w) ? '' : 'locked'}" data-key="${w.key}"><strong>${w.name}</strong><div class="meta">R${w.rank} • blast ${w.blast} • ${w.damageTerrain ? 'damages cover' : 'anti-caterpillar'}</div></div>`).join('');
}

els.weaponList.addEventListener('click', e => { const card = e.target.closest('.weapon'); if (!card) return; const picked = weapons.find(w => w.key === card.dataset.key); if (unlockedWeapons(activeTroop()).includes(picked)) { state.activeWeapon = picked; renderUI(); } });
els.stageSelect.addEventListener('change', resetBattle); els.newBattle.addEventListener('click', resetBattle); els.fire.addEventListener('click', fire); els.evolve.addEventListener('click', evolve);
els.angle.addEventListener('input', () => { els.angleValue.textContent = `${els.angle.value}°`; }); els.power.addEventListener('input', () => { els.powerValue.textContent = els.power.value; });
renderUI(); resetBattle(); update();
