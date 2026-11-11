/* ============================================================
   SWEET SAGA — mesin permainan
   Aturan mengikuti Candy Crush Saga: papan 9x9, permen spesial
   (garis / bungkus / bom warna), kombinasi, cascade, jelly, icing,
   cokelat, licorice, bahan, order, Sugar Crush, dan bintang.
   (Sistem nyawa sengaja tidak dipakai — main sepuasnya.)
   ============================================================ */
(function (CC) {
'use strict';

/* Dinaikkan tiap kali kode diterbitkan — ditampilkan di bawah peta supaya
   ketahuan apakah perangkat sudah memakai versi terbaru. */
CC.BUILD = 'r8 · 11 Nov';

const ROWS = 9, COLS = 9;
const ORTHO = [[-1,0],[1,0],[0,-1],[0,1]];
const $ = id => document.getElementById(id);
const clamp = (v,a,b) => v < a ? a : v > b ? b : v;
const wait = ms => new Promise(r => setTimeout(r, ms));
const fmt = n => Math.round(n).toLocaleString('id-ID');

/* ===================== PENYIMPANAN ===================== */
const DB = {
  get stars(){ try { return JSON.parse(localStorage.getItem('ss_stars')||'{}'); } catch(e){ return {}; } },
  set stars(v){ localStorage.setItem('ss_stars', JSON.stringify(v)); },
  get best(){ try { return JSON.parse(localStorage.getItem('ss_best')||'{}'); } catch(e){ return {}; } },
  set best(v){ localStorage.setItem('ss_best', JSON.stringify(v)); },
  get unlocked(){ return +(localStorage.getItem('ss_unlocked')||1); },
  set unlocked(v){ localStorage.setItem('ss_unlocked', v); },
  get sound(){ return localStorage.getItem('ss_sound') !== '0'; },
  set sound(v){ localStorage.setItem('ss_sound', v ? '1' : '0'); },
  get boost(){
    try { const b = JSON.parse(localStorage.getItem('ss_boost') || 'null');
          if (b && typeof b.hammer === 'number') return b; } catch(e){}
    return { hammer:5, swap:5 };          // bekal awal
  },
  set boost(v){ localStorage.setItem('ss_boost', JSON.stringify(v)); },
};

/* ===================== SUARA ===================== */
let actx = null, soundOn = DB.sound;
function tone(f, dur, type, vol, slideTo){
  if (!soundOn) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, actx.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, actx.currentTime + dur);
    g.gain.setValueAtTime(0, actx.currentTime);
    g.gain.linearRampToValueAtTime(vol == null ? .14 : vol, actx.currentTime + .012);
    g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur + .03);
  } catch (e) {}
}
function noise(dur, vol){
  if (!soundOn) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const n = Math.floor(actx.sampleRate * dur);
    const buf = actx.createBuffer(1, n, actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/n, 2.2);
    const src = actx.createBufferSource(); src.buffer = buf;
    const g = actx.createGain(); g.gain.value = vol == null ? .20 : vol;
    const f = actx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=1800;
    src.connect(f); f.connect(g); g.connect(actx.destination); src.start();
  } catch (e) {}
}
const SFX = {
  pick:  () => tone(700, .05, 'triangle', .09),
  swap:  () => tone(430, .07, 'sine', .11, 620),
  bad:   () => tone(180, .14, 'sawtooth', .07, 120),
  match: n => tone(430 + Math.min(n,7)*78, .10, 'triangle', .13),
  make:  () => { tone(760,.08,'square',.10); setTimeout(()=>tone(1140,.12,'square',.09),70); },
  beam:  () => { tone(1400,.18,'sawtooth',.07,420); noise(.18,.10); },
  blast: () => { tone(110,.30,'sawtooth',.13,55); noise(.32,.22); },
  bomb:  () => { tone(90,.45,'sawtooth',.14,40); noise(.5,.25); setTimeout(()=>tone(1500,.3,'sine',.08,200),80); },
  jelly: () => tone(880, .09, 'sine', .10, 1320),
  drop:  () => tone(300, .06, 'sine', .07, 180),
  ingr:  () => { [523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,.14,'triangle',.13),i*80)); },
  win:   () => { [523,659,784,1046,1318].forEach((f,i)=>setTimeout(()=>tone(f,.20,'triangle',.14),i*110)); },
  lose:  () => { [392,330,262,196].forEach((f,i)=>setTimeout(()=>tone(f,.26,'sine',.12),i*160)); },
  star:  i => tone([880,1100,1320][i]||1320, .22, 'triangle', .14),
};

/* ===================== TWEEN ===================== */
const tweens = [];
const easeOut   = p => 1 - Math.pow(1-p, 3);
const easeOut4  = p => 1 - Math.pow(1-p, 4);
const easeInOut = p => p < .5 ? 4*p*p*p : 1 - Math.pow(-2*p+2, 3)/2;
const easeBack  = p => { const c = 2.70158; return 1 + (c+1)*Math.pow(p-1,3) + c*Math.pow(p-1,2); };
function easeBounce(p){
  const n = 7.5625, d = 2.75;
  if (p < 1/d) return n*p*p;
  if (p < 2/d) return n*(p-=1.5/d)*p + .75;
  if (p < 2.5/d) return n*(p-=2.25/d)*p + .9375;
  return n*(p-=2.625/d)*p + .984375;
}
function tween(ms, fn){ return new Promise(res => tweens.push({ t0: performance.now(), ms, fn, res })); }
function stepTweens(now){
  for (let i = tweens.length-1; i >= 0; i--){
    const t = tweens[i];
    const p = Math.min(1, (now - t.t0) / t.ms);
    t.fn(p);
    if (p >= 1){ tweens.splice(i,1); t.res(); }
  }
}

/* ===================== EFEK VISUAL ===================== */
const particles = [], beams = [], waves = [], popups = [], rays = [];
let shake = 0, flash = 0;

function burst(x, y, color, light, n){
  for (let i = 0; i < (n||12); i++){
    const a = Math.random()*Math.PI*2, sp = 120 + Math.random()*240;
    particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 60,
      g: 950, life: .42 + Math.random()*.25, age: 0,
      col: Math.random() < .45 ? light : color,
      size: TS*(.07 + Math.random()*.08), rot: Math.random()*6, vr: (Math.random()-.5)*12, kind:'shard' });
  }
  for (let i = 0; i < 5; i++){
    const a = Math.random()*Math.PI*2, sp = 50 + Math.random()*110;
    particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, g: 0,
      life: .32, age: 0, col: '#ffffff', size: TS*.11, rot: 0, vr: 6, kind:'spark' });
  }
  waves.push({ x, y, r0: TS*.22, r1: TS*.78, age: 0, life: .26, col: '#ffffff', w: 3 });
}
function beamFx(r, c, axis, color){
  beams.push({ r, c, axis, age: 0, life: .42, col: color || '#ffffff' });
  SFX.beam();
}
function wrapFx(r, c, scale){
  waves.push({ x:(c+.5)*TS, y:(r+.5)*TS, r0: 0, r1: TS*1.9*(scale||1), age:0, life:.34, col:'#fff7c8', w: TS*.22, fill:true });
  shake = Math.max(shake, 7*(scale||1));
  SFX.blast();
}
function bombFx(r, c){
  waves.push({ x:(c+.5)*TS, y:(r+.5)*TS, r0: 0, r1: TS*6, age:0, life:.55, col:'#ffffff', w: TS*.3, chroma:true });
  flash = .3; shake = 11; SFX.bomb();
}
function popup(x, y, text, tier){ popups.push({ x, y, text, tier: tier||1, age: 0, life: .9 }); }
function praise(text){ rays.push({ text, age: 0, life: 1.25 }); }

/* ===================== STATE PAPAN ===================== */
let L = null, levelNo = 1;
let cellOpen, isExit, tiles, jelly, blocker;
let score = 0, moves = 0, cascade = 1, stepGain = 0;
let orders = [], ingrTotal = 0, ingrCollected = 0;
let busy = false, playing = false, selected = null;
let chocoHit = false, hasChoco = false;
let wrappedPending = [];
let idleAt = 0, hintMove = null, hintShow = 0;
let uid = 0, origin = new Map();
let comboOrderHits = [];
let turbo = false;            // animasi dipercepat saat Sugar Crush
let targetHit = false;        // target skor sudah tercapai (level tipe 'score')

const inb = (r,c) => r>=0 && r<ROWS && c>=0 && c<COLS;
const live = (r,c) => inb(r,c) && cellOpen[r][c];
function allTiles(){
  const o = [];
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (tiles[r][c]) o.push(tiles[r][c]);
  return o;
}
const matchable = t => !!t && t.color != null && !t.locked && !t.ingredient;
const movable   = t => !!t && !t.locked;

function newTile(color, r, c, special){
  return { id: ++uid, color, special: special||null, r, c, fx: c, fy: r,
           scale: 1, alpha: 1, rot: 0, phase: Math.random()*Math.PI*2,
           marmalade: false, locked: false, ingredient: null };
}
function randColor(){ return Math.floor(Math.random() * L.colors); }

/* ===================== MEMBANGUN LEVEL ===================== */
function buildLevel(def){
  L = def; levelNo = def.n;
  score = 0; moves = def.moves; cascade = 1;
  ingrTotal = def.ingredients || 0; ingrCollected = 0;
  chocoHit = false; hasChoco = false; wrappedPending = [];
  comboOrderHits = []; targetHit = false;
  orders = (def.orders||[]).map(o => Object.assign({ got:0 }, o));

  cellOpen = []; isExit = []; tiles = []; jelly = []; blocker = [];
  for (let r=0;r<ROWS;r++){
    cellOpen[r]=[]; isExit[r]=[]; tiles[r]=[]; jelly[r]=[]; blocker[r]=[];
    const row = def.grid[r] || '.........';
    const jrow = (def.jelly && def.jelly[r]) || '000000000';
    for (let c=0;c<COLS;c++){
      const ch = row[c] || '.';
      cellOpen[r][c] = ch !== 'x';
      isExit[r][c] = ch === 'v';
      jelly[r][c] = +(jrow[c] || 0);
      blocker[r][c] = null; tiles[r][c] = null;
      if (!cellOpen[r][c]) continue;
      if (ch >= '1' && ch <= '5') blocker[r][c] = { kind:'icing', layers:+ch, hurt:0 };
      else if (ch === 'c'){ blocker[r][c] = { kind:'choco' }; hasChoco = true; }
      else if (ch === 'l') blocker[r][c] = { kind:'liquorice' };
      else {
        const t = newTile(0, r, c);
        if (ch === 'k') t.locked = true;
        if (ch === 'm') t.marmalade = true;
        tiles[r][c] = t;
      }
    }
  }
  // isi warna tanpa match awal
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
    const t = tiles[r][c]; if (!t) continue;
    let g = 0;
    do { t.color = randColor(); } while (g++ < 40 && makesLine(r,c,t.color));
  }
  // sebagian bahan sudah ada di papan sejak awal (seperti level aslinya)
  if (ingrTotal > 0){
    const k = Math.min(2, ingrTotal);
    const spots = [];
    for (let r=2;r<=5;r++) for (let c=0;c<COLS;c++)
      if (tiles[r][c] && !tiles[r][c].locked && !tiles[r][c].marmalade) spots.push([r,c]);
    for (let i=0;i<k && spots.length;i++){
      const j = Math.floor(Math.random()*spots.length);
      const p = spots.splice(j,1)[0];
      const t = tiles[p[0]][p[1]];
      t.ingredient = Math.random() < .5 ? 'cherry' : 'nut';
      t.color = null; t.special = null;
    }
  }
  let guard = 0;
  while (!findPossibleMove() && guard++ < 50) permute();
}
function makesLine(r,c,col){
  const at = (rr,cc) => (live(rr,cc) && tiles[rr][cc] && tiles[rr][cc].color != null) ? tiles[rr][cc].color : -1;
  return (at(r,c-1)===col && at(r,c-2)===col) || (at(r-1,c)===col && at(r-2,c)===col);
}

/* ===================== MENCARI MATCH ===================== */
function findMatchGroups(){
  const runs = [];
  for (let r=0;r<ROWS;r++){
    let c = 0;
    while (c < COLS){
      if (!matchable(tiles[r][c])) { c++; continue; }
      const col = tiles[r][c].color; let e = c+1;
      while (e < COLS && matchable(tiles[r][e]) && tiles[r][e].color === col) e++;
      if (e-c >= 3){ const cells=[]; for(let i=c;i<e;i++) cells.push(tiles[r][i]); runs.push({dir:'h',col,cells}); }
      c = e;
    }
  }
  for (let c=0;c<COLS;c++){
    let r = 0;
    while (r < ROWS){
      if (!matchable(tiles[r][c])) { r++; continue; }
      const col = tiles[r][c].color; let e = r+1;
      while (e < ROWS && matchable(tiles[e][c]) && tiles[e][c].color === col) e++;
      if (e-r >= 3){ const cells=[]; for(let i=r;i<e;i++) cells.push(tiles[i][c]); runs.push({dir:'v',col,cells}); }
      r = e;
    }
  }
  if (!runs.length) return [];
  const used = runs.map(()=>false), groups = [];
  for (let i=0;i<runs.length;i++){
    if (used[i]) continue;
    used[i] = true;
    const g = { color: runs[i].col, runs: [], cells: new Set() };
    const stack = [i];
    while (stack.length){
      const k = stack.pop();
      g.runs.push(runs[k]); runs[k].cells.forEach(t => g.cells.add(t));
      for (let j=0;j<runs.length;j++){
        if (used[j] || runs[j].col !== g.color) continue;
        if (runs[j].cells.some(t => runs[k].cells.indexOf(t) >= 0)){ used[j]=true; stack.push(j); }
      }
    }
    g.maxLen = Math.max.apply(null, g.runs.map(r=>r.cells.length));
    g.hasH = g.runs.some(r=>r.dir==='h');
    g.hasV = g.runs.some(r=>r.dir==='v');
    groups.push(g);
  }
  return groups;
}
function anyMatch(){ return findMatchGroups().length > 0; }

/* permen spesial yang lahir dari sebuah grup */
function specialForGroup(g, swapInfo){
  if (g.maxLen >= 5) return 'colorbomb';
  if (g.hasH && g.hasV) return 'wrapped';
  if (g.maxLen === 4){
    if (swapInfo && swapInfo.axis) return swapInfo.axis === 'h' ? 'striped-h' : 'striped-v';
    return Math.random() < .5 ? 'striped-h' : 'striped-v';
  }
  return null;
}
function hostCell(g, swapInfo){
  const cells = [...g.cells];
  if (swapInfo){
    const hit = cells.find(t => (t.r===swapInfo.r && t.c===swapInfo.c));
    if (hit) return hit;
  }
  return cells[Math.floor(cells.length/2)];
}

/* ===================== LANGKAH YANG MUNGKIN ===================== */
function findPossibleMove(){
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
    const t = tiles[r][c];
    if (!t || t.locked || t.marmalade || t.ingredient) continue;
    if (t.special === 'colorbomb'){
      for (const d of ORTHO){ const r2=r+d[0], c2=c+d[1];
        if (live(r2,c2) && swappable(tiles[r2][c2])) return {r,c,r2,c2}; }
    }
    for (const d of [[0,1],[1,0]]){
      const r2 = r+d[0], c2 = c+d[1];
      if (!live(r2,c2)) continue;
      const o = tiles[r2][c2];
      if (!swappable(o)) continue;
      if (o.special === 'colorbomb' || (t.special && o.special)) return {r,c,r2,c2};
      tiles[r][c]=o; tiles[r2][c2]=t; o.r=r;o.c=c; t.r=r2;t.c=c2;
      const ok = anyMatch();
      tiles[r][c]=t; tiles[r2][c2]=o; t.r=r;t.c=c; o.r=r2;o.c=c2;
      if (ok) return {r,c,r2,c2};
    }
  }
  return null;
}
const swappable = t => !!t && !t.locked && !t.marmalade && !t.ingredient;

/* Menilai sebuah pertukaran: makin tinggi makin berguna.
   Dipakai untuk tombol petunjuk dan untuk pengujian otomatis. */
function evalSwap(r,c,r2,c2){
  const t = tiles[r][c], o = tiles[r2][c2];
  if (!swappable(t) || !swappable(o)) return -1;
  let sc = 0;
  if (t.special === 'colorbomb' && o.special === 'colorbomb') sc += 900;
  else if (t.special === 'colorbomb' || o.special === 'colorbomb') sc += 520;
  else if (t.special && o.special) sc += 430;
  tiles[r][c]=o; tiles[r2][c2]=t; o.r=r; o.c=c; t.r=r2; t.c=c2;
  let add = 0;
  for (const g of findMatchGroups()){
    const cells = [...g.cells];
    if (!cells.some(x => (x.r===r&&x.c===c)||(x.r===r2&&x.c===c2))) continue;
    add += cells.length * 4;
    const sp = specialForGroup(g, null);
    if (sp === 'colorbomb') add += 130; else if (sp === 'wrapped') add += 75; else if (sp) add += 45;
    // sasaran "order" yang belum selesai
    for (const o of orders){
      if (o.got >= o.count) continue;
      if (o.kind === 'color' && o.color === g.color) add += cells.length * 22;
      if (o.kind === 'special' && sp){
        const key = sp.indexOf('striped') === 0 ? 'striped' : sp;
        if (key === o.special) add += 160;
      }
    }
    for (const x of cells){
      if (x.special) add += 35;
      add += jelly[x.r][x.c] * 30 * jellyUrgency;
      for (const d of ORTHO){
        const rr = x.r+d[0], cc = x.c+d[1];
        if (live(rr,cc) && blocker[rr][cc]) add += blocker[rr][cc].kind === 'choco' ? 40 : 20;
      }
      // membersihkan petak di bawah bahan jauh lebih berharga daripada apa pun:
      // bahan hanya turun kalau ada ruang kosong di bawahnya
      for (let rr = x.r-1; rr >= 0; rr--){
        const u = tiles[rr][x.c];
        if (u && u.ingredient){ add += Math.max(120, 460 - (x.r-rr)*55); break; }
      }
    }
  }
  tiles[r][c]=t; tiles[r2][c2]=o; t.r=r; t.c=c; o.r=r2; o.c=c2;
  return (add === 0 && sc === 0) ? -1 : sc + add;
}
let jellyUrgency = 1;
function bestMove(){
  // makin sedikit jelly tersisa, makin mahal nilainya — supaya sisa terakhir dikejar
  // normal selama jelly masih banyak; baru jadi prioritas saat tinggal sedikit
  if (L && L.type === 'jelly'){
    const left = jellyLeft();
    jellyUrgency = left > 24 ? 1 : 1 + (24 - left) * 0.55;
  } else jellyUrgency = 1;
  let best = null, bv = -1;
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
    if (!live(r,c) || !tiles[r][c]) continue;
    for (const d of [[0,1],[1,0]]){
      const r2 = r+d[0], c2 = c+d[1];
      if (!live(r2,c2) || !tiles[r2][c2]) continue;
      const v = evalSwap(r,c,r2,c2);
      if (v > bv){ bv = v; best = { r,c,r2,c2, v }; }
    }
  }
  return best;
}

function permute(){
  const list = allTiles().filter(t => !t.locked && !t.ingredient && !t.special && t.color != null);
  const cols = list.map(t => t.color);
  for (let i=cols.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const x=cols[i]; cols[i]=cols[j]; cols[j]=x; }
  list.forEach((t,i) => t.color = cols[i]);
}
async function shuffleBoard(){
  toast('Tidak ada langkah! Mengacak…');
  const list = allTiles();
  await tween(230, p => list.forEach(t => { t.scale = 1-.85*p; t.alpha = 1-.6*p; t.rot = p*3; }));
  let guard = 0;
  do { permute(); } while (guard++ < 120 && (anyMatch() || !findPossibleMove()));
  SFX.make();
  await tween(300, p => { const e = easeBack(p); list.forEach(t => { t.scale = e; t.alpha = .4+.6*p; t.rot = (1-p)*3; }); });
  list.forEach(t => { t.scale=1; t.alpha=1; t.rot=0; });
  await resolve(null, null);
}

/* ===================== SKOR & SASARAN ===================== */
function addScore(n){ score += n; stepGain += n; }
function damageJelly(r,c){
  if (jelly[r][c] > 0){
    jelly[r][c]--; addScore(1000 * cascade); SFX.jelly();
    waves.push({ x:(c+.5)*TS, y:(r+.5)*TS, r0:TS*.1, r1:TS*.7, age:0, life:.3, col:'#cfe4ff', w:3 });
  }
}
function hitBlocker(r,c){
  const b = blocker[r][c];
  if (!b) return false;
  const x = (c+.5)*TS, y = (r+.5)*TS;
  if (b.kind === 'icing'){
    b.layers--; addScore(40);
    burst(x, y, '#bcdcf5', '#ffffff', 8);
    if (b.layers <= 0) blocker[r][c] = null;
    orderBlocker();
  } else if (b.kind === 'choco'){
    blocker[r][c] = null; chocoHit = true; addScore(40);
    burst(x, y, '#5e3615', '#a8713a', 12); orderBlocker();
  } else if (b.kind === 'liquorice'){
    blocker[r][c] = null; addScore(40);
    burst(x, y, '#1a1a22', '#ffffff', 12); orderBlocker();
  }
  noise(.10, .10);
  return true;
}
function orderBlocker(){ orders.forEach(o => { if (o.kind==='blocker' && o.got<o.count) o.got++; }); }
function orderColor(t){
  if (t.color == null) return;
  orders.forEach(o => { if (o.kind==='color' && o.color===t.color && o.got<o.count) o.got++; });
}
function orderSpecial(sp){
  const key = sp.indexOf('striped')===0 ? 'striped' : sp;
  orders.forEach(o => { if (o.kind==='special' && o.special===key && o.got<o.count) o.got++; });
}
function orderCombo(name){
  orders.forEach(o => { if (o.kind==='combo' && o.combo===name && o.got<o.count) o.got++; });
}
function jellyLeft(){ let n=0; for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++) n+=jelly[r][c]; return n; }
function ordersDone(){ return orders.every(o => o.got >= o.count); }
function goalMet(){
  // Target adalah target. Begitu tercapai, level selesai — sama seperti level
  // jelly/bahan/order. Sisa langkah berubah jadi poin lewat Sugar Crush, jadi
  // makin cepat target dicapai makin banyak bintang yang didapat.
  if (L.type === 'score')      return score >= L.target;
  if (L.type === 'jelly')      return jellyLeft() === 0;
  if (L.type === 'ingredient') return ingrCollected >= ingrTotal;
  if (L.type === 'order')      return ordersDone();
  return false;
}
function starCount(){ const s = L.stars; return score>=s[2]?3 : score>=s[1]?2 : score>=s[0]?1 : 0; }

/* ===================== LEDAKAN ===================== */
function mostAbundantColor(){
  const cnt = new Array(6).fill(0);
  allTiles().forEach(t => { if (t.color != null) cnt[t.color]++; });
  let b = 0; for (let i=1;i<6;i++) if (cnt[i] > cnt[b]) b = i;
  return b;
}

/* Mengumpulkan semua petak yang kena ledakan, sekaligus mengaktifkan
   permen spesial berantai. Mengembalikan Map kunci -> {r,c,tile,delay} */
function collect(starts){
  const out = new Map();
  const q = starts.slice();
  let safety = 0;
  while (q.length && safety++ < 4000){
    const s = q.shift();
    const r = s.r, c = s.c;
    if (!live(r,c)) continue;
    const k = r*COLS + c;
    if (out.has(k)) continue;
    if (blocker[r][c]) { hitBlocker(r,c); continue; }
    const t = tiles[r][c];
    if (!t) continue;
    if (t.ingredient) continue;
    if (t.locked)    { t.locked = false;    addScore(40); burst((c+.5)*TS,(r+.5)*TS,'#20202a','#d8c23a',10); continue; }
    if (t.marmalade) { t.marmalade = false; addScore(40); burst((c+.5)*TS,(r+.5)*TS,'#e28214','#ffd27a',10); continue; }
    const d = s.delay || 0;

    if (t.special === 'wrapped'){
      t.special = null; t.armed = true; wrappedPending.push(t);
      addScore(1000); orderSpecial('wrapped'); wrapFx(r,c,1);
      for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++)
        if (dr||dc) q.push({ r:r+dr, c:c+dc, delay:d+40 });
      continue;                       // permen bungkus belum hilang
    }

    out.set(k, { r, c, tile:t, delay:d, burst:false });

    if (t.special === 'striped-h' || t.special === 'striped-v'){
      const vert = t.special === 'striped-v';
      const col = CC.COLORS[t.color] ? CC.COLORS[t.color].light : '#fff';
      t.special = null;
      addScore(500); orderSpecial('striped');
      beamFx(r, c, vert ? 'v' : 'h', col);
      if (vert){
        for (const dir of [-1,1]) for (let i=1;i<ROWS;i++){
          const rr = r + dir*i; if (!inb(rr,c)) break;
          if (!cellOpen[rr][c]) continue;
          q.push({ r:rr, c, delay:d + i*22 });
          if (blocker[rr][c] && blocker[rr][c].kind==='liquorice') break;
        }
      } else {
        for (const dir of [-1,1]) for (let i=1;i<COLS;i++){
          const cc = c + dir*i; if (!inb(r,cc)) break;
          if (!cellOpen[r][cc]) continue;
          q.push({ r, c:cc, delay:d + i*22 });
          if (blocker[r][cc] && blocker[r][cc].kind==='liquorice') break;
        }
      }
    } else if (t.special === 'colorbomb'){
      const target = (s.cbColor != null) ? s.cbColor : mostAbundantColor();
      t.special = null;
      addScore(5000); orderSpecial('colorbomb'); bombFx(r,c);
      for (let rr=0;rr<ROWS;rr++) for (let cc=0;cc<COLS;cc++){
        const o = tiles[rr][cc];
        if (o && o.color === target) q.push({ r:rr, c:cc, delay:d + 60 + Math.abs(rr-r)*18 + Math.abs(cc-c)*18 });
      }
    }
  }
  return out;
}

/* ===================== MELEDAKKAN + MEMBERSIHKAN ===================== */
async function popAndRemove(res, spawns){
  const list = [...res.values()];
  if (!list.length && !spawns.length) return;

  const hitB = new Set();
  let sx = 0, sy = 0;
  for (const e of list){
    addScore(40 * cascade);
    damageJelly(e.r, e.c);
    orderColor(e.tile);
    sx += e.c; sy += e.r;
    for (const d of ORTHO){
      const r2 = e.r+d[0], c2 = e.c+d[1];
      if (live(r2,c2) && blocker[r2][c2] && !hitB.has(r2*COLS+c2)){ hitB.add(r2*COLS+c2); hitBlocker(r2,c2); }
    }
  }
  SFX.match(list.length);

  const maxD = list.reduce((m,e)=>Math.max(m,e.delay), 0);
  const dur = (230 + maxD) * (turbo ? .5 : 1);
  await tween(dur, p => {
    const t = p * dur;
    for (const e of list){
      const q = clamp((t - e.delay) / 210, 0, 1);
      const tile = e.tile;
      if (q <= 0) continue;
      tile.scale = q < .3 ? 1 + q*0.8 : 1.24 - (q-.3)*1.77;
      tile.alpha = q < .4 ? 1 : 1 - (q-.4)/.6;
      tile.rot = q * 0.7;
      if (!e.burst && q > .35){
        e.burst = true;
        const def = tile.color != null ? CC.COLORS[tile.color] : { base:'#444', light:'#fff' };
        burst((e.c+.5)*TS, (e.r+.5)*TS, def.base, def.light, 11 + Math.min(6,cascade*2));
      }
    }
  });
  list.forEach(e => { if (tiles[e.r][e.c] === e.tile) tiles[e.r][e.c] = null; });

  for (const s of spawns){
    const t = newTile(s.color, s.r, s.c, s.special);
    t.scale = 0; tiles[s.r][s.c] = t;
    tween(280, p => { t.scale = easeBack(p); t.rot = (1-p)*1.2; });
  }
  if (spawns.length) SFX.make();

  if (stepGain > 0){
    popup(((sx/Math.max(1,list.length))+.5)*TS, ((sy/Math.max(1,list.length))+.5)*TS, '+'+fmt(stepGain), cascade);
    stepGain = 0;
  }
  if (cascade === 2) praise('Sweet!');
  else if (cascade === 3) praise('Tasty!');
  else if (cascade === 4) praise('Divine!');
  else if (cascade >= 5) praise('Delicious!');
  updateHud();
}

/* ===================== GRAVITASI ===================== */
function topSpawnRow(c){
  for (let r=0;r<ROWS;r++){
    if (!cellOpen[r][c]) continue;
    if (blocker[r][c]) return -1;
    return r;
  }
  return -1;
}
function noteOrigin(t){ if (!origin.has(t)) origin.set(t, { x:t.fx, y:t.fy }); }
function moveTile(sr,sc,dr,dc){
  const t = tiles[sr][sc];
  noteOrigin(t);
  tiles[dr][dc] = t; tiles[sr][sc] = null;
  t.r = dr; t.c = dc;
}
function spawnAt(r,c,stagger){
  let t;
  const onBoard = allTiles().filter(x => x.ingredient).length;
  const needIngr = ingrTotal > 0 &&
    (ingrTotal - ingrCollected - onBoard) > 0 &&
    onBoard < Math.min(2, ingrTotal - ingrCollected) &&
    Math.random() < .6;
  if (needIngr){
    t = newTile(null, r, c);
    t.ingredient = Math.random() < .5 ? 'cherry' : 'nut';
  } else {
    t = newTile(randColor(), r, c);
  }
  t.fx = c; t.fy = -1 - stagger;
  tiles[r][c] = t;
  origin.set(t, { x:c, y:t.fy });
  return t;
}
function gravityPass(stag){
  let changed = false;
  for (let r=ROWS-1;r>=0;r--){
    for (let c=0;c<COLS;c++){
      if (!cellOpen[r][c] || blocker[r][c] || tiles[r][c]) continue;
      // 1) jatuh lurus
      let sr = r-1;
      while (sr >= 0 && cellOpen[sr][c] && !blocker[sr][c] && !tiles[sr][c]) sr--;
      if (sr >= 0 && cellOpen[sr][c] && !blocker[sr][c] && movable(tiles[sr][c])){
        moveTile(sr,c,r,c); changed = true; continue;
      }
      // 2) geser diagonal kalau kolom di atas tersumbat
      let did = false;
      const order = Math.random() < .5 ? [-1,1] : [1,-1];
      for (const dc of order){
        const ar = r-1, ac = c+dc;
        if (!live(ar,ac) || blocker[ar][ac]) continue;
        const t = tiles[ar][ac];
        if (!movable(t)) continue;
        if (live(ar+1,ac) && !blocker[ar+1][ac] && !tiles[ar+1][ac]) continue;
        moveTile(ar,ac,r,c); changed = true; did = true; break;
      }
      if (did) continue;
      // 3) permen baru dari atas
      if (topSpawnRow(c) === r){ spawnAt(r,c,stag[c]++); changed = true; }
    }
  }
  return changed;
}
async function applyGravity(){
  let any = false;
  for (let round=0; round<12; round++){
    origin = new Map();
    const stag = new Array(COLS).fill(0);
    let guard = 0;
    while (gravityPass(stag) && guard++ < 300) {}
    // jaring pengaman: petak yang tidak bisa dijangkau dari atas maupun diagonal
    // (mis. kolomnya tertutup cokelat) diisi langsung agar papan tidak pernah bolong
    for (let r=ROWS-1;r>=0;r--) for (let c=0;c<COLS;c++){
      if (cellOpen[r][c] && !blocker[r][c] && !tiles[r][c]){
        const t = spawnAt(r, c, 0);
        t.fy = r - 1.1; origin.set(t, { x:c, y:t.fy });
      }
    }
    const moving = [];
    for (const t of allTiles()){
      const o = origin.get(t);
      if (!o) continue;
      if (Math.abs(o.x - t.c) > .001 || Math.abs(o.y - t.r) > .001) moving.push({ t, x0:o.x, y0:o.y });
    }
    if (!moving.length) break;
    any = true;
    const maxDrop = moving.reduce((m,x)=>Math.max(m, t2d(x)), 1);
    const dur = clamp(190 + maxDrop*34, 220, 560) * (turbo ? .5 : 1);
    SFX.drop();
    await tween(dur, p => {
      const e = easeOut4(p);
      for (const m of moving){
        m.t.fx = m.x0 + (m.t.c - m.x0) * e;
        m.t.fy = m.y0 + (m.t.r - m.y0) * e;
      }
    });
    // mendarat: sedikit memantul
    moving.forEach(m => { m.t.fx = m.t.c; m.t.fy = m.t.r; });
    const land = moving.slice();
    tween(190, p => { const s = 1 + Math.sin(p*Math.PI)*0.16*(1-p); land.forEach(m => m.t.scale = s); })
      .then(()=> land.forEach(m => m.t.scale = 1));

    if (!collectIngredients()) break;
  }
  return any;
}
const t2d = x => Math.abs(x.t.r - x.y0);

/* bahan yang sampai di petak keluar */
function collectIngredients(){
  let again = false;
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
    if (!isExit[r][c]) continue;
    const t = tiles[r][c];
    if (t && t.ingredient){
      tiles[r][c] = null; ingrCollected++; addScore(10000);
      damageJelly(r,c);
      burst((c+.5)*TS,(r+.5)*TS,'#d8233f','#ffd27a',18);
      waves.push({ x:(c+.5)*TS, y:(r+.5)*TS, r0:0, r1:TS*2, age:0, life:.4, col:'#9BE37A', w:TS*.16 });
      SFX.ingr(); again = true; updateHud();
    }
  }
  return again;
}

/* ===================== SIKLUS PENYELESAIAN ===================== */
async function resolve(swapInfo, forced){
  cascade = 0; stepGain = 0;
  let first = forced;
  let guard = 0;
  while (guard++ < 60){
    let starts = [], spawns = [];
    if (first){ starts = first; first = null; cascade++; }
    else {
      const second = wrappedPending; wrappedPending = [];
      const groups = findMatchGroups();
      if (!groups.length && !second.length) break;
      cascade++;
      for (const t of second){
        if (!t || t.r == null || tiles[t.r][t.c] !== t) continue;
        addScore(1000); wrapFx(t.r, t.c, 1.25);
        starts.push({ r:t.r, c:t.c });
        for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++)
          if (dr||dc) starts.push({ r:t.r+dr, c:t.c+dc, delay:40 });
      }
      for (const g of groups){
        const sp = specialForGroup(g, swapInfo);
        g.cells.forEach(t => starts.push({ r:t.r, c:t.c }));
        if (sp){
          const h = hostCell(g, swapInfo);
          spawns.push({ r:h.r, c:h.c, color:g.color, special:sp });
        }
      }
    }
    const res = collect(starts);
    spawns.forEach(s => res.delete(s.r*COLS + s.c));
    await popAndRemove(res, spawns);
    await applyGravity();
    swapInfo = null;
  }
  cascade = 1;
}

/* ===================== KOMBINASI SPESIAL ===================== */
function comboStarts(A, B, at){
  const a = A.special, b = B.special;
  const isCB = s => s === 'colorbomb';
  const isSt = s => s === 'striped-h' || s === 'striped-v';
  const starts = [];
  const put = (r,c,d) => { if (live(r,c)) starts.push({ r, c, delay:d||0 }); };

  if (isCB(a) && isCB(b)){
    orderCombo('colorbomb+colorbomb');
    A.special = null; B.special = null;
    bombFx(at.r, at.c); addScore(10000);
    for (let c=0;c<COLS;c++) for (let r=0;r<ROWS;r++) put(r,c, c*26);
    return starts;
  }
  if (isCB(a) || isCB(b)){
    const bomb  = isCB(a) ? A : B;
    const other = bomb === A ? B : A;
    bomb.special = null;
    addScore(5000); bombFx(at.r, at.c);
    if (other.special){
      orderCombo('colorbomb+' + (isSt(other.special) ? 'striped' : 'wrapped'));
      orderSpecial('colorbomb');
      const sp = other.special; let k = 0;
      for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
        const t = tiles[r][c];
        if (t && t.color === other.color && !t.ingredient){
          t.special = isSt(sp) ? (k++ % 2 ? 'striped-h' : 'striped-v') : 'wrapped';
          put(r,c, 90 + k*22);
        }
      }
      put(bomb.r, bomb.c, 40);
    } else {
      orderSpecial('colorbomb');
      const target = other.color;
      for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
        const t = tiles[r][c];
        if (t && t.color === target) put(r,c, 60 + (Math.abs(r-at.r)+Math.abs(c-at.c))*18);
      }
      put(bomb.r, bomb.c, 0);
    }
    return starts;
  }
  if (isSt(a) && isSt(b)){
    orderCombo('striped+striped'); orderSpecial('striped');
    A.special = null; B.special = null;
    addScore(1000);
    beamFx(at.r, at.c, 'h', '#ffffff'); beamFx(at.r, at.c, 'v', '#ffffff');
    shake = Math.max(shake, 8);
    for (let c=0;c<COLS;c++) put(at.r, c, Math.abs(c-at.c)*20);
    for (let r=0;r<ROWS;r++) put(r, at.c, Math.abs(r-at.r)*20);
    return starts;
  }
  if ((isSt(a) && b==='wrapped') || (a==='wrapped' && isSt(b))){
    orderCombo('striped+wrapped'); orderSpecial('striped'); orderSpecial('wrapped');
    A.special = null; B.special = null;
    addScore(1500); shake = Math.max(shake, 10);
    beamFx(at.r, at.c, 'h', '#fff7c8'); beamFx(at.r, at.c, 'v', '#fff7c8');
    SFX.blast();
    for (let d=-1; d<=1; d++){
      for (let c=0;c<COLS;c++) put(at.r+d, c, Math.abs(c-at.c)*18);
      for (let r=0;r<ROWS;r++) put(r, at.c+d, 120 + Math.abs(r-at.r)*18);
    }
    return starts;
  }
  if (a==='wrapped' && b==='wrapped'){
    orderCombo('wrapped+wrapped'); orderSpecial('wrapped');
    A.special = null; B.special = null;
    A.armed = true; wrappedPending.push(A);
    addScore(2000); wrapFx(at.r, at.c, 1.6); shake = Math.max(shake, 13);
    for (let dr=-2;dr<=2;dr++) for (let dc=-2;dc<=2;dc++)
      if (dr||dc) put(at.r+dr, at.c+dc, (Math.abs(dr)+Math.abs(dc))*25);
    return starts;
  }
  return null;
}

/* ===================== PERTUKARAN ===================== */
let swapLock = false;
async function doSwap(a, b){
  if (busy || !playing || swapLock) return;
  const A = tiles[a.r][a.c], B = tiles[b.r][b.c];
  if (!swappable(A) || !swappable(B)) { SFX.bad(); return; }
  busy = true; selected = null; hintMove = null;
  SFX.swap();
  await animSwap(A, B);
  swapCells(a, b);     // sekarang A di b, B di a

  const axis = a.r === b.r ? 'h' : 'v';
  const combo = comboStarts(A, B, { r:b.r, c:b.c });

  if (combo){
    useMove();
    await resolve(null, combo);
    await endOfMove();
    busy = false; return;
  }
  // bom warna + permen biasa
  if (A.special === 'colorbomb' || B.special === 'colorbomb'){
    const bomb  = A.special === 'colorbomb' ? A : B;
    const other = bomb === A ? B : A;
    useMove();
    const starts = [{ r:bomb.r, c:bomb.c, cbColor: other.color }];
    await resolve(null, starts);
    await endOfMove();
    busy = false; return;
  }

  if (!anyMatch()){
    SFX.bad();
    shake = 4;
    await animSwap(A, B);
    swapCells(a, b);
    busy = false; return;
  }
  useMove();
  await resolve({ r:b.r, c:b.c, axis }, null);
  await endOfMove();
  busy = false;
}
/* ===================== BOOSTER ===================== */
let armed = null;                 // null | 'hammer' | 'swap'

function setArmed(which){
  armed = (armed === which) ? null : which;
  selected = null; hintMove = null;
  updateDock();
  if (armed === 'hammer') toast('Ketuk satu petak untuk dihancurkan');
  else if (armed === 'swap') toast('Ketuk dua permen bersebelahan untuk ditukar');
}
function spendBooster(which){
  const b = DB.boost;
  b[which] = Math.max(0, (b[which] || 0) - 1);
  DB.boost = b;
  armed = null;
  updateDock();
}

/* --- palu lolipop: hancurkan satu petak, tanpa memakai langkah --- */
async function useHammer(cell){
  if (busy || !playing) return;
  const r = cell.r, c = cell.c;
  const t = tiles[r][c];
  if (!blocker[r][c] && !t){ toast('Petak itu kosong'); return; }
  if (t && t.ingredient){ toast('Bahan tidak bisa dihancurkan palu'); return; }

  busy = true;
  spendBooster('hammer');
  // efek pukulan
  waves.push({ x:(c+.5)*TS, y:(r+.5)*TS, r0:0, r1:TS*1.6, age:0, life:.32, col:'#ffffff', w:TS*.18 });
  shake = Math.max(shake, 9);
  tone(150, .16, 'square', .14, 60); noise(.22, .18);
  await wait(90);

  await resolve(null, [{ r, c }]);
  await endOfMove(false);
  busy = false;
  idleAt = performance.now();
}

/* --- tukar bebas: tukar dua permen bersebelahan tanpa perlu match.
       Permen spesial TIDAK ikut meledak, persis seperti aslinya. --- */
async function useFreeSwitch(a, b){
  if (busy || !playing) return;
  const A = tiles[a.r][a.c], B = tiles[b.r][b.c];
  if (!swappable(A) || !swappable(B)){ SFX.bad(); return; }

  busy = true;
  spendBooster('swap');
  SFX.swap();
  tone(980, .10, 'triangle', .10, 1500);
  await animSwap(A, B);
  swapCells(a, b);

  if (anyMatch()) await resolve({ r:b.r, c:b.c, axis: a.r === b.r ? 'h' : 'v' }, null);
  await endOfMove(false);
  busy = false;
  idleAt = performance.now();
}

const dockRef = {};
function updateDock(){
  const b = DB.boost;
  const set = (id, key, draw) => {
    let ref = dockRef[id];
    if (!ref){
      const el = $(id);
      ref = dockRef[id] = { el, cnt: el.querySelector('.cnt'), cv: el.querySelector('canvas') };
      if (ref.cv && ref.cv.getContext) draw(ref.cv.getContext('2d'), ref.cv.width || 96);
    }
    const n = b[key] || 0;
    if (ref.cnt) ref.cnt.textContent = n;
    // JANGAN ikut sertakan `busy` di sini: updateDock tidak dipanggil lagi saat
    // animasi selesai, jadi tombolnya akan tersangkut abu-abu selamanya.
    // Klik saat papan sibuk sudah ditolak di handler-nya.
    ref.el.disabled = n <= 0 || !playing;
    ref.el.classList.toggle('on', armed === key);
  };
  set('bHammer', 'hammer', CC.art.drawHammerIcon);
  set('bSwitch', 'swap',   CC.art.drawSwitchIcon);
}

function animSwap(A, B){
  const ax=A.fx, ay=A.fy, bx=B.fx, by=B.fy;
  const lift = .12;
  return tween(190, p => {
    const e = easeInOut(p), arc = Math.sin(p*Math.PI)*lift;
    A.fx = ax + (bx-ax)*e; A.fy = ay + (by-ay)*e - arc;
    B.fx = bx + (ax-bx)*e; B.fy = by + (ay-by)*e + arc;
    A.scale = 1 + Math.sin(p*Math.PI)*.10;
    B.scale = 1 + Math.sin(p*Math.PI)*.10;
  }).then(()=>{ A.scale = 1; B.scale = 1; });
}
function swapCells(a, b){
  const A = tiles[a.r][a.c], B = tiles[b.r][b.c];
  tiles[a.r][a.c] = B; tiles[b.r][b.c] = A;
  A.r = b.r; A.c = b.c; B.r = a.r; B.c = a.c;
  A.fx = A.c; A.fy = A.r; B.fx = B.c; B.fy = B.r;
}
function useMove(){ moves = Math.max(0, moves-1); chocoHit = false; updateHud(); }

/* Setelah satu aksi selesai.
   isMove = false untuk booster: tidak memakan langkah, cokelat tidak tumbuh. */
async function endOfMove(isMove){
  if (isMove !== false){
    // cokelat tumbuh kalau tidak ada yang dihancurkan
    if (hasChoco && !chocoHit) growChocolate();
  }
  chocoHit = false;
  updateHud();

  if (goalMet()){ await sugarCrush(); return; }
  if (isMove !== false && moves <= 0){ await levelFailed(); return; }
  if (!findPossibleMove()) await shuffleBoard();
  idleAt = performance.now();
}
function growChocolate(){
  const spots = [];
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
    if (!blocker[r][c] || blocker[r][c].kind !== 'choco') continue;
    for (const d of ORTHO){
      const r2=r+d[0], c2=c+d[1];
      if (live(r2,c2) && !blocker[r2][c2] && tiles[r2][c2] && !tiles[r2][c2].ingredient && !tiles[r2][c2].locked)
        spots.push({ r:r2, c:c2 });
    }
  }
  if (!spots.length) return;
  const s = spots[Math.floor(Math.random()*spots.length)];
  tiles[s.r][s.c] = null;
  blocker[s.r][s.c] = { kind:'choco' };
  burst((s.c+.5)*TS, (s.r+.5)*TS, '#5e3615', '#a8713a', 10);
  noise(.2, .14); tone(120, .2, 'sawtooth', .08, 70);
  toast('Cokelat menyebar!');
}

/* ===================== SUGAR CRUSH ===================== */
function randomPlain(){
  const list = allTiles().filter(t => !t.special && !t.ingredient && !t.locked && t.color != null);
  return list.length ? list[Math.floor(Math.random()*list.length)] : null;
}
let lastBase = 0;
async function sugarCrush(){
  playing = false; lastBase = score;
  praise('Sugar Crush!'); toast('Sugar Crush!'); SFX.win();
  await wait(600);
  turbo = true;

  // permen spesial yang masih di papan meledak lebih dulu, sekaligus
  for (let g=0; g<10; g++){
    const list = allTiles().filter(t => t.special);
    if (!list.length) break;
    await resolve(null, list.map((t,i) => ({ r:t.r, c:t.c, delay:i*45 })));
  }

  if (L.type === 'jelly'){
    // tiap sisa langkah = 3 "ikan jeli" yang memakan petak berjelly
    let left = moves * 3;
    for (let g=0; g<24 && left>0; g++){
      const batch = [], seen = {};
      const cands = allTiles().filter(t => jelly[t.r][t.c] > 0 && !t.ingredient && !t.locked);
      if (!cands.length) break;
      for (let k=0; k<Math.min(6,left); k++){
        const t = cands[Math.floor(Math.random()*cands.length)];
        const key = t.r+','+t.c;
        if (seen[key]) continue;
        seen[key] = 1; batch.push({ r:t.r, c:t.c, delay:k*50 }); addScore(2000);
        waves.push({ x:(t.c+.5)*TS, y:(t.r+.5)*TS, r0:0, r1:TS*1.1, age:0, life:.3, col:'#8fe4ff', w:4 });
      }
      if (!batch.length) break;
      left -= batch.length;
      SFX.jelly();
      await resolve(null, batch);
      updateHud();
    }
  } else {
    // tiap sisa langkah jadi permen garis, lalu semuanya diledakkan
    const n = Math.round(moves * 0.8), made = [];
    for (let i=0;i<n;i++){
      const t = randomPlain();
      if (!t) break;
      t.special = Math.random() < .5 ? 'striped-h' : 'striped-v';
      t.scale = 0; tween(200, p => { t.scale = easeBack(p); });
      addScore(6000); SFX.make(); made.push(t);
      await wait(70);
    }
    updateHud();
    await wait(240);
    const starts = made.filter(t => tiles[t.r] && tiles[t.r][t.c] === t)
                       .map((t,i) => ({ r:t.r, c:t.c, delay:i*45 }));
    if (starts.length) await resolve(null, starts);
  }

  turbo = false;
  moves = 0; updateHud();
  await wait(450);
  levelComplete();
}

/* ===================== SELESAI / GAGAL ===================== */
function levelComplete(){
  const st = Math.max(1, starCount());
  const S = DB.stars;
  const prev = S[levelNo] || 0;
  S[levelNo] = Math.max(prev, st); DB.stars = S;
  const B = DB.best;  B[levelNo] = Math.max(B[levelNo]||0, score); DB.best = B;
  if (levelNo + 1 > DB.unlocked && levelNo < CC.TOTAL) DB.unlocked = levelNo + 1;
  [0,1,2].forEach(i => { if (i < st) setTimeout(()=>SFX.star(i), 400 + i*220); });

  // hadiah booster: level baru dapat satu, tiga bintang pertama dapat sepasang
  const bo = DB.boost;
  const got = [];
  if (prev === 0){
    if (levelNo % 2) { bo.swap++;   got.push('1 tukar bebas'); }
    else             { bo.hammer++; got.push('1 palu'); }
  }
  if (st === 3 && prev < 3){ bo.hammer++; bo.swap++; got.push('bonus 3 bintang: 1 palu + 1 tukar bebas'); }
  DB.boost = bo;

  modal(`
    <h2>Level Selesai!</h2>
    <div class="bigstars">${[0,1,2].map(i=>`<i class="${i<st?'on':''}"></i>`).join('')}</div>
    <p class="big">${fmt(score)}</p>
    <p>${st===3?'Sempurna! Tiga bintang penuh.':'Bintang berikutnya di '+fmt(L.stars[st]||L.stars[2])+' poin.'}</p>
    ${got.length ? '<p style="color:#FFD21C;font-weight:800">🎁 Dapat ' + got.join(' · ') + '</p>' : ''}
    <div class="acts">
      <button class="btn alt" data-act="map">Peta</button>
      ${levelNo < CC.TOTAL ? '<button class="btn" data-act="next">Lanjut</button>' : ''}
    </div>`);
}
async function levelFailed(){
  playing = false;
  SFX.lose();
  await wait(500);
  modal(`
    <h2>Yah, Gagal!</h2>
    <h3>${objectiveText(true)}</h3>
    <p class="big">${fmt(score)}</p>
    <div class="acts">
      <button class="btn alt" data-act="map">Peta</button>
      <button class="btn" data-act="retry">Ulangi</button>
    </div>`);
}

/* ===================== KANVAS & GAMBAR ===================== */
let cv, ctx, TS = 48, DPR = 1;
let bgcv, bgctx, bgW = 0, bgH = 0, bgStatic = null, bgLast = 0;

function resize(){
  // papan dibuat sebesar mungkin, dibatasi lebar DAN tinggi layar yang tersisa
  const wrap = $('boardwrap');
  const availW = (wrap.clientWidth || window.innerWidth) - 24;
  const availH = (wrap.clientHeight || 400) - 24;
  TS = Math.max(24, Math.floor(Math.min(availW, availH) / COLS));
  DPR = Math.min(window.devicePixelRatio || 1, 2.5);
  cv.width = TS*COLS*DPR; cv.height = TS*ROWS*DPR;
  cv.style.width = (TS*COLS)+'px'; cv.style.height = (TS*ROWS)+'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);

  const nw = Math.floor(window.innerWidth), nh = Math.floor(window.innerHeight);
  if (nw !== bgW || nh !== bgH){
    bgW = nw; bgH = nh;
    bgcv.width = nw; bgcv.height = nh;
    // pemandangan diam digambar sekali ke kanvas terpisah, lalu tiap frame
    // tinggal disalin dan ditimpa lapisan bergeraknya — jauh lebih ringan
    if (!bgStatic) bgStatic = document.createElement('canvas');
    bgStatic.width = nw; bgStatic.height = nh;
    CC.art.paintBackground(bgStatic.getContext('2d'), nw, nh);
  }
}

function drawBoard(now){
  const W = TS*COLS, H = TS*ROWS;
  ctx.clearRect(0,0,W,H);
  ctx.save();
  if (shake > 0.2){
    ctx.translate((Math.random()-.5)*shake, (Math.random()-.5)*shake);
    shake *= 0.86;
  } else shake = 0;

  // petak papan
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
    if (!cellOpen[r][c]) continue;
    ctx.fillStyle = (r+c)%2 ? '#C8A27A' : '#BC9168';
    ctx.fillRect(c*TS, r*TS, TS, TS);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(c*TS+.5, r*TS+TS); ctx.lineTo(c*TS+.5, r*TS+.5); ctx.lineTo(c*TS+TS, r*TS+.5); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.13)';
    ctx.beginPath(); ctx.moveTo(c*TS+TS-.5, r*TS); ctx.lineTo(c*TS+TS-.5, r*TS+TS-.5); ctx.lineTo(c*TS, r*TS+TS-.5); ctx.stroke();
  }
  // jelly
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++)
    if (cellOpen[r][c] && jelly[r][c] > 0) CC.art.drawJelly(ctx, jelly[r][c], c*TS, r*TS, TS, now);
  // petak keluar bahan ditandai hijau
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
    if (!isExit[r][c]) continue;
    ctx.save();
    ctx.fillStyle = 'rgba(57,196,87,0.35)';
    ctx.fillRect(c*TS, r*TS, TS, TS);
    ctx.restore();
  }

  // sorotan pilihan
  if (selected && tiles[selected.r] && tiles[selected.r][selected.c]){
    const x = selected.c*TS, y = selected.r*TS;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.95)';
    ctx.lineWidth = Math.max(2, TS*.06);
    ctx.setLineDash([TS*.16, TS*.13]);
    ctx.lineDashOffset = -now/22;
    ctx.beginPath(); ctx.arc(x+TS/2, y+TS/2, TS*.46, 0, 7); ctx.stroke();
    ctx.restore();
  }
  // petunjuk
  if (hintMove && hintShow > 0 && !busy){
    const a = .4 + .6*Math.abs(Math.sin(now/180));
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${a})`;
    ctx.lineWidth = Math.max(2, TS*.055);
    [[hintMove.r,hintMove.c],[hintMove.r2,hintMove.c2]].forEach(p => {
      ctx.beginPath(); ctx.arc(p[1]*TS+TS/2, p[0]*TS+TS/2, TS*.44, 0, 7); ctx.stroke();
    });
    ctx.restore();
  }

  // blocker yang menempati petak
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
    const b = blocker[r][c]; if (!b) continue;
    if (b.kind==='icing') CC.art.drawIcing(ctx, b.layers, c*TS, r*TS, TS);
    else if (b.kind==='choco') CC.art.drawChocolate(ctx, c*TS, r*TS, TS, now);
    else if (b.kind==='liquorice') CC.art.drawLiquorice(ctx, c*TS, r*TS, TS, now);
  }

  // permen
  ctx.save();
  ctx.beginPath(); ctx.rect(0,0,W,H); ctx.clip();
  const list = allTiles().sort((a,b)=>a.fy-b.fy);
  for (const t of list){
    const idle = (!busy && playing) ? 1 : 0;
    const sc = t.scale * (1 + idle*0.020*Math.sin(now*0.0017 + t.phase));
    const ro = t.rot + (idle ? 0.026*Math.sin(now*0.0012 + t.phase*0.7) : 0);
    const cx = (t.fx+.5)*TS, cy = (t.fy+.5)*TS;
    if (t.alpha <= .02 || sc <= .02) continue;
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.translate(cx, cy); ctx.rotate(ro); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
    if (t.armed){
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = TS*.5*(0.5+0.5*Math.sin(now/90));
    }
    CC.art.drawCandy(ctx, t, cx, cy, TS, now);
    ctx.restore();
  }
  ctx.restore();

  // panah keluar di atas permen supaya tetap terlihat
  ctx.save();
  ctx.globalAlpha = .75;
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++)
    if (isExit[r][c]) CC.art.drawExit(ctx, c*TS, r*TS, TS, now);
  ctx.restore();

  drawFx(now, W, H);
  ctx.restore();

  if (flash > 0.01){
    ctx.fillStyle = `rgba(255,255,255,${flash})`;
    ctx.fillRect(0,0,W,H);
    flash *= 0.84;
  }
}

let lastT = 0;
function drawFx(now, W, H){
  const dt = Math.min(.05, (now - lastT)/1000); lastT = now;

  // sinar permen garis
  for (let i=beams.length-1;i>=0;i--){
    const b = beams[i]; b.age += dt;
    const p = b.age/b.life;
    if (p >= 1){ beams.splice(i,1); continue; }
    const grow = easeOut(Math.min(1, p*2.6));
    const fade = p < .45 ? 1 : 1-(p-.45)/.55;
    const cx = (b.c+.5)*TS, cy = (b.r+.5)*TS;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = fade;
    const len = grow * Math.max(W,H);
    const bands = [[TS*1.0, b.col, .35],[TS*.62, b.col, .6],[TS*.26, '#ffffff', 1]];
    for (const bd of bands){
      ctx.fillStyle = bd[1]; ctx.globalAlpha = fade*bd[2];
      if (b.axis === 'h') ctx.fillRect(cx-len, cy-bd[0]/2 + (Math.random()-.5)*2, len*2, bd[0]);
      else                ctx.fillRect(cx-bd[0]/2 + (Math.random()-.5)*2, cy-len, bd[0], len*2);
    }
    ctx.restore();
  }

  // gelombang
  for (let i=waves.length-1;i>=0;i--){
    const w = waves[i]; w.age += dt;
    const p = w.age/w.life;
    if (p >= 1){ waves.splice(i,1); continue; }
    const r = w.r0 + (w.r1-w.r0)*easeOut4(p);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1-p;
    if (w.fill){
      const g = ctx.createRadialGradient(w.x,w.y,r*.2,w.x,w.y,r);
      g.addColorStop(0,'rgba(255,255,255,.85)'); g.addColorStop(1,'rgba(255,200,80,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w.x,w.y,r,0,7); ctx.fill();
    }
    if (w.chroma){
      const cols = ['#66f0ff','#ff6ad5','#fff36a'];
      cols.forEach((c,k) => { ctx.strokeStyle=c; ctx.globalAlpha=(1-p)*.5; ctx.lineWidth=w.w*.6;
        ctx.beginPath(); ctx.arc(w.x,w.y,r + (k-1)*TS*.18,0,7); ctx.stroke(); });
      ctx.globalAlpha = 1-p;
    }
    ctx.strokeStyle = w.col; ctx.lineWidth = w.w;
    ctx.beginPath(); ctx.arc(w.x,w.y,r,0,7); ctx.stroke();
    ctx.restore();
  }

  // partikel
  for (let i=particles.length-1;i>=0;i--){
    const q = particles[i]; q.age += dt;
    const p = q.age/q.life;
    if (p >= 1){ particles.splice(i,1); continue; }
    q.vy += q.g*dt; q.x += q.vx*dt; q.y += q.vy*dt; q.rot += q.vr*dt;
    ctx.save();
    ctx.globalAlpha = p < .6 ? 1 : 1-(p-.6)/.4;
    ctx.translate(q.x, q.y); ctx.rotate(q.rot);
    const s = q.size*(1-p*.6);
    if (q.kind === 'spark'){
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = q.col;
      CC.art.starPath(ctx, 0, 0, s, s*.32, 4); ctx.fill();
    } else {
      ctx.fillStyle = q.col;
      CC.art.roundRect(ctx, -s/2, -s/2, s, s*.8, s*.3); ctx.fill();
    }
    ctx.restore();
  }

  // angka skor
  for (let i=popups.length-1;i>=0;i--){
    const u = popups[i]; u.age += dt;
    const p = u.age/u.life;
    if (p >= 1){ popups.splice(i,1); continue; }
    const y = u.y - easeOut(p)*TS*1.3;
    const sc = p < .2 ? .6 + (p/.2)*.6 : 1.2 - Math.min(1,(p-.2)/.15)*.2;
    const col = u.tier >= 4 ? '#FF4FA3' : u.tier === 3 ? '#FF8A3D' : u.tier === 2 ? '#FFE14D' : '#FFFFFF';
    ctx.save();
    ctx.globalAlpha = p < .65 ? 1 : 1-(p-.65)/.35;
    ctx.translate(u.x, y); ctx.scale(sc, sc);
    ctx.font = `800 ${Math.round(TS*.46)}px ${CC.FONT}`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.lineWidth = TS*.12; ctx.strokeStyle = 'rgba(30,10,55,.95)'; ctx.lineJoin='round';
    ctx.strokeText(u.text, 0, 0); ctx.fillStyle = col; ctx.fillText(u.text, 0, 0);
    ctx.restore();
  }

  // banner pujian
  for (let i=rays.length-1;i>=0;i--){
    const b = rays[i]; b.age += dt;
    const p = b.age/b.life;
    if (p >= 1){ rays.splice(i,1); continue; }
    const inS = p < .22 ? easeBack(p/.22) : 1;
    const out = p > .78 ? 1-(p-.78)/.22 : 1;
    ctx.save();
    ctx.globalAlpha = out;
    ctx.translate(W/2, H*.42);
    ctx.rotate(Math.sin(p*18)*0.02);
    ctx.scale(inS*1.0, inS*1.0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    for (let k=0;k<16;k++){
      const a = k*Math.PI/8 + p*0.5;
      ctx.beginPath(); ctx.moveTo(0,0);
      ctx.arc(0,0,W*.8,a-0.07,a+0.07); ctx.closePath(); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.font = `800 ${Math.round(TS*1.05)}px ${CC.FONT}`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.lineWidth = TS*.2; ctx.lineJoin='round'; ctx.strokeStyle = '#4A1070';
    ctx.strokeText(b.text, 0, 0);
    const g = ctx.createLinearGradient(0,-TS*.6,0,TS*.6);
    g.addColorStop(0,'#FFF6B0'); g.addColorStop(.55,'#FFC93D'); g.addColorStop(1,'#FF8A1F');
    ctx.fillStyle = g; ctx.fillText(b.text, 0, 0);
    ctx.restore();
  }
}

function drawBackdrop(now){
  if (!bgStatic || !bgctx) return;
  if (now - bgLast < 33) return;            // cukup ~30 fps untuk latar
  bgLast = now;
  bgctx.clearRect(0, 0, bgW, bgH);
  bgctx.drawImage(bgStatic, 0, 0);
  CC.art.drawBackdropAnim(bgctx, bgW, bgH, now);
}

function loop(now){
  stepTweens(now);
  drawBackdrop(now);
  if (cellOpen && $('screen-game').classList.contains('show')) drawBoard(now);
  if (playing && !busy){
    if (!hintMove && now - idleAt > 4200){ hintMove = findPossibleMove(); hintShow = 1; }
  }
  requestAnimationFrame(loop);
}

/* ===================== INPUT ===================== */
let press = null, pressXY = null;
function cellFromEvent(ev){
  const rect = cv.getBoundingClientRect();
  const c = Math.floor((ev.clientX - rect.left) / (rect.width/COLS));
  const r = Math.floor((ev.clientY - rect.top) / (rect.height/ROWS));
  return live(r,c) ? { r, c } : null;
}
function onDown(ev){
  if (!playing || busy) return;
  ev.preventDefault();
  const cell = cellFromEvent(ev);
  if (!cell) return;
  idleAt = performance.now(); hintMove = null;

  // mode booster
  if (armed === 'hammer'){ useHammer(cell); return; }
  if (armed === 'swap'){
    if (selected && (selected.r !== cell.r || selected.c !== cell.c) &&
        Math.abs(selected.r-cell.r) + Math.abs(selected.c-cell.c) === 1){
      const a = selected; selected = null; useFreeSwitch(a, cell); return;
    }
    selected = (selected && selected.r === cell.r && selected.c === cell.c) ? null : cell;
    if (selected) SFX.pick();
    return;
  }

  press = cell; pressXY = { x:ev.clientX, y:ev.clientY };
  if (selected && (selected.r !== cell.r || selected.c !== cell.c)){
    if (Math.abs(selected.r-cell.r) + Math.abs(selected.c-cell.c) === 1){
      const a = selected; press = null; selected = null; doSwap(a, cell); return;
    }
  }
  if (selected && selected.r === cell.r && selected.c === cell.c) selected = null;
  else { selected = cell; SFX.pick(); }
}
function onMove(ev){
  if (!press || busy || !playing || armed) return;
  const dx = ev.clientX - pressXY.x, dy = ev.clientY - pressXY.y;
  const d = Math.hypot(dx, dy);
  const rect = cv.getBoundingClientRect();
  if (d < rect.width/COLS*0.45) return;
  const a = press; press = null; selected = null;
  const to = Math.abs(dx) > Math.abs(dy)
    ? { r:a.r, c:a.c + (dx>0?1:-1) }
    : { r:a.r + (dy>0?1:-1), c:a.c };
  if (live(to.r, to.c)) doSwap(a, to); else SFX.bad();
}
function onUp(){ press = null; }

/* ===================== HUD ===================== */
let toastTimer = 0;
function toast(msg){
  const el = $('toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), 1500);
}
function miniCanvas(draw){
  const c = document.createElement('canvas');
  c.width = 56; c.height = 56;
  const x = c.getContext('2d');
  draw(x);
  return c;
}
function objectiveHtml(){
  const wrap = document.createElement('div');
  wrap.className = 'objective';
  const add = (node, label, done) => {
    const d = document.createElement('div');
    d.className = 'obj' + (done ? ' done' : '');
    if (typeof node === 'string'){ const s=document.createElement('span'); s.className='ic'; s.textContent=node; d.appendChild(s); }
    else d.appendChild(node);
    const b = document.createElement('b'); b.textContent = label; d.appendChild(b);
    wrap.appendChild(d);
  };
  if (L.type === 'score'){
    add('🎯', fmt(L.target), score >= L.target);
  } else if (L.type === 'jelly'){
    const n = jellyLeft();
    add(miniCanvas(x => { CC.art.drawJelly(x, 2, 2, 2, 52, 0); }), n, n === 0);
  } else if (L.type === 'ingredient'){
    const left = Math.max(0, ingrTotal - ingrCollected);
    add(miniCanvas(x => CC.art.drawIngredient(x, 'cherry', 28, 28, 56, 0)), left, left === 0);
  } else {
    orders.forEach(o => {
      const left = Math.max(0, o.count - o.got);
      let node;
      if (o.kind === 'color') node = miniCanvas(x => CC.art.drawCandy(x, { color:o.color, special:null }, 28, 28, 56, 0));
      else if (o.kind === 'special'){
        const sp = o.special === 'striped' ? 'striped-v' : o.special;
        node = miniCanvas(x => CC.art.drawCandy(x, { color:4, special:sp }, 28, 28, 56, 0));
      } else node = '✨';
      add(node, left, left === 0);
    });
  }
  return wrap;
}
function objectiveText(short){
  if (L.type === 'score')      return 'Kumpulkan ' + fmt(L.target) + ' poin';
  if (L.type === 'jelly')      return short ? 'Sisa jelly: ' + jellyLeft() : 'Hancurkan semua jelly';
  if (L.type === 'ingredient') return short ? 'Bahan: ' + ingrCollected + '/' + ingrTotal : 'Turunkan semua bahan ke dasar';
  return short ? 'Order belum selesai' : 'Selesaikan semua order';
}
function updateHud(){
  if (!L) return;
  $('hScore').textContent = fmt(score);
  $('hMoves').textContent = moves;
  document.querySelector('.movesbox').classList.toggle('low', moves <= 5);

  $('levelchip').innerHTML = 'Level <b>' + levelNo + '</b>';
  const o = $('hObjective'); o.innerHTML = ''; o.appendChild(objectiveHtml());
  // Bar bertahap seperti aslinya: bintang 1 selalu di 25%, bintang 2 di 60%,
  // bintang 3 di ujung. Tanpa ini, target yang kecil cuma mengisi beberapa persen
  // bar dan sisa permainan terasa tanpa tujuan.
  const s = L.stars;
  let pct;
  if (score >= s[2])      pct = 100;
  else if (score >= s[1]) pct = 60 + (score - s[1]) / Math.max(1, s[2] - s[1]) * 37;
  else if (score >= s[0]) pct = 25 + (score - s[0]) / Math.max(1, s[1] - s[0]) * 35;
  else                    pct = score / Math.max(1, s[0]) * 25;
  $('hBar').style.width = clamp(pct, 0, 100) + '%';
  updateDock();
  [0,1,2].forEach(i => {
    const el = $('n'+i);
    const on = score >= L.stars[i];
    if (on && !el.classList.contains('on')){ el.classList.add('on','pop'); setTimeout(()=>el.classList.remove('pop'),380); }
    if (!on) el.classList.remove('on');
  });
}

/* ===================== MODAL ===================== */
function modal(html){
  $('card').innerHTML = html;
  $('modal').classList.add('show');
}
function closeModal(){ $('modal').classList.remove('show'); }
$('modal').addEventListener('click', e => {
  const b = e.target.closest('button[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  closeModal();
  if (act === 'close') return;
  if (act === 'map') showMap();
  else if (act === 'next') openLevel(levelNo+1);
  else if (act === 'retry') openLevel(levelNo);
  else if (act === 'play') startLevel(+b.dataset.n);
});

/* ===================== PETA ===================== */
let mapEp = 0;
const episodeOf = n => Math.floor((n-1) / CC.PER_EP);

function showMap(){
  playing = false; busy = false;
  $('screen-game').classList.remove('show');
  $('screen-map').classList.add('show');
  mapEp = episodeOf(Math.min(CC.TOTAL, DB.unlocked));
  buildMap();
}
function buildMap(){
  const eps = CC.episodeCount;
  mapEp = clamp(mapEp, 0, eps-1);
  const first = mapEp * CC.PER_EP + 1;
  const last  = Math.min(CC.TOTAL, first + CC.PER_EP - 1);
  const count = last - first + 1;

  $('epName').textContent = CC.episodeName(mapEp);
  $('epMeta').textContent = 'Episode ' + (mapEp+1) + ' / ' + eps + ' · Level ' + first + '–' + last;
  $('epPrev').disabled = mapEp === 0;
  $('epNext').disabled = mapEp >= eps-1;

  const nodes = $('mapNodes'), svg = $('mapPath');
  const gap = 112, padTop = 78, padBottom = 130;
  const H = padTop + gap*(count-1) + padBottom;
  $('mapInner').style.height = H + 'px';
  const W = $('mapScroll').clientWidth || 400;
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

  const stars = DB.stars, unlocked = DB.unlocked;
  const pts = [];
  for (let i=0;i<count;i++){
    const idx = first + i;                       // lekuk jalur berlanjut antar episode
    const x = W*0.5 + Math.sin(idx*0.9)*W*0.27 + Math.sin(idx*2.1)*W*0.06;
    const y = H - padBottom - gap*i;
    pts.push({ x, y });
  }
  let d = 'M ' + pts[0].x + ' ' + pts[0].y;
  for (let i=1;i<pts.length;i++){
    const p0 = pts[i-1], p1 = pts[i], my = (p0.y+p1.y)/2;
    d += ' C ' + p0.x + ' ' + my + ', ' + p1.x + ' ' + my + ', ' + p1.x + ' ' + p1.y;
  }
  // jalur bergaya tongkat permen: bayangan, badan putih, pita merah muda, lalu kilau
  svg.innerHTML =
    '<path d="'+d+'" fill="none" stroke="rgba(92,40,120,.20)" stroke-width="27" ' +
      'stroke-linecap="round" transform="translate(0,6)"/>' +
    '<path d="'+d+'" fill="none" stroke="#ffffff" stroke-width="23" stroke-linecap="round"/>' +
    '<path d="'+d+'" fill="none" stroke="#FF77A8" stroke-width="23" stroke-dasharray="10 21"/>' +
    '<path d="'+d+'" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="6" ' +
      'stroke-linecap="round" transform="translate(0,-5)"/>' +
    '<path d="'+d+'" fill="none" stroke="rgba(150,70,110,.25)" stroke-width="2" stroke-linecap="round"/>';

  nodes.innerHTML = '';
  for (let i=0;i<count;i++){
    const n = first + i, p = pts[i];
    const st = stars[n] || 0;
    const locked = n > unlocked;
    const b = document.createElement('button');
    b.className = 'node' + (locked ? ' locked' : st > 0 ? ' done' : '') +
                  (n === unlocked ? ' current' : '');
    b.style.left = p.x + 'px'; b.style.top = p.y + 'px';
    b.innerHTML =
      '<div class="disc">' + (locked ? '🔒' : n) + '</div>' +
      '<div class="stars">' + [0,1,2].map(k => '<i class="' + (k<st?'on':'') + '"></i>').join('') + '</div>' +
      (n === unlocked ? '<div class="flag">MAIN</div>' : '');
    if (!locked) b.onclick = () => openLevel(n);
    nodes.appendChild(b);
  }
  setTimeout(() => {
    const i = clamp(unlocked - first, 0, count-1);
    const cur = pts[i];
    if (cur) $('mapScroll').scrollTop = Math.max(0, cur.y - ($('mapScroll').clientHeight||400)*0.6);
  }, 20);
}

/* ===================== MEMBUKA LEVEL ===================== */
function openLevel(n){
  const lv = CC.getLevel(n);
  if (!lv) { showMap(); return; }
  const goal = {
    score: 'Kumpulkan <b>'+fmt(lv.target||0)+'</b> poin',
    jelly: 'Hancurkan <b>semua jelly</b>',
    ingredient: 'Turunkan <b>'+(lv.ingredients||0)+' bahan</b> ke dasar papan',
    order: 'Selesaikan <b>semua order</b>'
  }[lv.type];
  modal(`
    <h2>Level ${n}</h2>
    <h3>${goal}</h3>
    <p>dalam <b>${lv.moves}</b> langkah</p>
    <div class="startstars">
      ${lv.stars.map(v => '<div><i></i><span>' + fmt(v) + '</span></div>').join('')}
    </div>
    <div class="acts">
      <button class="btn alt" data-act="map">Batal</button>
      <button class="btn" data-act="play" data-n="${n}">Main</button>
    </div>`);
}
async function startLevel(n){
  const lv = CC.getLevel(n);
  $('screen-map').classList.remove('show');
  $('screen-game').classList.add('show');
  buildLevel(lv);
  resize();
  particles.length = 0; beams.length = 0; waves.length = 0; popups.length = 0; rays.length = 0;
  updateHud();
  playing = true; busy = true; selected = null; hintMove = null; armed = null;
  updateDock();
  toast(objectiveText(false));
  await wait(260);
  await resolve(null, null);
  busy = false;
  updateDock();
  idleAt = performance.now();
}

/* ===================== TOMBOL ===================== */
function bindSound(btn){
  btn.textContent = soundOn ? '🔊' : '🔇';
  btn.onclick = () => {
    soundOn = !soundOn; DB.sound = soundOn;
    document.querySelectorAll('#mSound,#btnSound2').forEach(b => b.textContent = soundOn ? '🔊' : '🔇');
    if (soundOn) SFX.pick();
  };
}
function boot(){
  cv = $('board'); ctx = cv.getContext('2d');
  bgcv = $('bg'); bgctx = bgcv.getContext('2d');
  cellOpen = null;
  resize();
  const relayout = () => { resize(); if ($('screen-map').classList.contains('show')) buildMap(); };
  window.addEventListener('resize', relayout);
  window.addEventListener('orientationchange', () => setTimeout(relayout, 350));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', relayout);

  // iOS: AudioContext baru boleh hidup setelah ada sentuhan pengguna
  const kickAudio = () => {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch (e) {}
  };
  document.addEventListener('pointerdown', kickAudio, true);
  document.addEventListener('touchstart', kickAudio, true);

  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  cv.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('touchmove', e => { if (e.target === cv) e.preventDefault(); }, { passive:false });

  bindSound($('mSound')); bindSound($('btnSound2'));
  $('epPrev').onclick = () => { if (mapEp > 0){ mapEp--; buildMap(); } };
  $('epNext').onclick = () => { if (mapEp < CC.episodeCount-1){ mapEp++; buildMap(); } };
  $('btnBack').onclick = () => {
    if (!playing) { showMap(); return; }
    modal(`<h2>Keluar level?</h2><p>Kemajuan di level ini akan hilang.</p>
      <div class="acts"><button class="btn" data-act="none">Lanjut main</button>
      <button class="btn alt" data-act="quit">Keluar</button></div>`);
    $('card').querySelector('[data-act="none"]').onclick = closeModal;
    $('card').querySelector('[data-act="quit"]').onclick = () => { closeModal(); showMap(); };
  };
  $('bHammer').onclick = () => { if (playing && !busy) setArmed('hammer'); };
  $('bSwitch').onclick = () => { if (playing && !busy) setArmed('swap'); };
  $('btnHint').onclick = () => {
    if (!playing || busy) return;
    if (armed) setArmed(armed);        // batalkan booster dulu
    hintMove = bestMove() || findPossibleMove(); hintShow = 1;
    if (!hintMove) toast('Tidak ada langkah!');
  };
  $('mReset').onclick = () => {
    modal(`<h2>Hapus progres?</h2><p>Semua bintang dan level terbuka akan hilang.</p>
      <div class="acts"><button class="btn" data-act="none2">Batal</button>
      <button class="btn alt" data-act="wipe">Hapus</button></div>`);
    $('card').querySelector('[data-act="none2"]').onclick = closeModal;
    $('card').querySelector('[data-act="wipe"]').onclick = () => {
      ['ss_stars','ss_best','ss_unlocked','ss_boost','ss_lives','ss_lifeT']
        .forEach(k => localStorage.removeItem(k));
      closeModal(); buildMap();
    };
  };

  $('buildline').textContent = 'versi ' + CC.BUILD;
  showMap();
  requestAnimationFrame(loop);
}
CC.isPlaying = () => playing;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

/* kait untuk pengujian otomatis */
CC._dev = {
  startLevel, doSwap, findPossibleMove, bestMove, resolve, shuffleBoard, applyGravity,
  useHammer, useFreeSwitch, setArmed, boost: () => DB.boost,
  /* berapa banyak langkah sah yang benar-benar membebaskan jalan turun bahan */
  countFreeingMoves: () => {
    const ing = allTiles().filter(t => t.ingredient);
    if (!ing.length) return 0;
    let n = 0;
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
      if (!live(r,c) || !tiles[r][c]) continue;
      for (const d of [[0,1],[1,0]]){
        const r2=r+d[0], c2=c+d[1];
        if (!live(r2,c2) || !tiles[r2][c2]) continue;
        const t = tiles[r][c], o = tiles[r2][c2];
        if (!swappable(t) || !swappable(o)) continue;
        tiles[r][c]=o; tiles[r2][c2]=t; o.r=r;o.c=c; t.r=r2;t.c=c2;
        let hit = false;
        for (const g of findMatchGroups())
          for (const x of g.cells)
            if (ing.some(i => i.c === x.c && i.r < x.r)) hit = true;
        tiles[r][c]=t; tiles[r2][c2]=o; t.r=r;t.c=c; o.r=r2;o.c=c2;
        if (hit) n++;
      }
    }
    return n;
  },
  state: () => ({ levelNo, score, base: lastBase, moves, busy, playing, cascade,
                  jelly: jellyLeft(), ingr: ingrCollected+'/'+ingrTotal,
                  orders: orders.map(o=>o.got+'/'+o.count), goal: goalMet(),
                  tiles: allTiles().length }),
  board: () => ({ tiles, cellOpen, blocker, jelly }),
};

})(window.CC = window.CC || {});

