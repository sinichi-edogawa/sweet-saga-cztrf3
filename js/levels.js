/* ============================================================
   DEFINISI LEVEL
   ------------------------------------------------------------
   Papan selalu 9x9 (seperti Candy Crush Saga asli).

   Karakter pada "grid":
     .   petak normal
     x   bukan petak (lubang / di luar papan)
     1-5 icing (frosting) dengan jumlah lapisan segitu
     c   cokelat
     l   licorice swirl (permen hitam, menghalangi)
     k   permen terkunci (liquorice lock)
     m   permen bersalut marmalade
     v   petak keluar bahan (panah hijau)  -- untuk level ingredient

   Karakter pada "jelly":
     0   tanpa jelly
     1   jelly satu lapis
     2   jelly dua lapis

   type:  'score' | 'jelly' | 'ingredient' | 'order'
   stars: [target bintang 1, bintang 2, bintang 3]
   ============================================================ */
(function (CC) {
'use strict';

/* Urutan warna resmi: Biru, Hijau, Oranye, Ungu, Merah, Kuning.
   Level dengan N warna memakai N warna pertama dari daftar ini. */
CC.COLORS = [
  { key:'blue',   shape:'lollipop', base:'#2E9BE8', dark:'#0E5496', light:'#79CCF7', rim:'#C4EAFD', name:'Biru'   },
  { key:'green',  shape:'gum',      base:'#41C94F', dark:'#17772B', light:'#8EE88D', rim:'#CDF7C4', name:'Hijau'  },
  { key:'orange', shape:'lozenge',  base:'#FF8A1F', dark:'#B44C00', light:'#FFBE63', rim:'#FFE0AE', name:'Oranye' },
  { key:'purple', shape:'jujube',   base:'#9B4FD6', dark:'#5A1E8E', light:'#C98BF0', rim:'#E6C9FA', name:'Ungu'   },
  { key:'red',    shape:'bean',     base:'#E8344E', dark:'#9B1230', light:'#FF7D8E', rim:'#FFC2CB', name:'Merah'  },
  { key:'yellow', shape:'drop',     base:'#FFD21C', dark:'#C28A00', light:'#FFEE8A', rim:'#FFF8CF', name:'Kuning' },
];

const FULL = [
  '.........','.........','.........','.........','.........',
  '.........','.........','.........','.........'
];
const J_ALL = ['111111111','111111111','111111111','111111111','111111111',
               '111111111','111111111','111111111','111111111'];
const none = ['000000000','000000000','000000000','000000000','000000000',
              '000000000','000000000','000000000','000000000'];

CC.LEVELS = [

/* ---------- 1-5 : pengenalan, level skor ---------- */
{ n:1, type:'score', moves:25, colors:4, target:3000, stars:[3000, 45000, 120000],
  grid:[
    'xx.....xx',
    'x.......x',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    'x.......x',
    'xx.....xx' ] },

{ n:2, type:'score', moves:25, colors:5, target:6000, stars:[6000, 25000, 60000],
  grid:[
    '...xxx...',
    '...xxx...',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '...xxx...',
    '...xxx...' ] },

{ n:3, type:'score', moves:22, colors:5, target:10000, stars:[10000, 32000, 75000],
  grid:FULL },

{ n:4, type:'score', moves:22, colors:6, target:12000, stars:[12000, 26000, 45000],
  grid:[
    'x.......x',
    '.........',
    '..1...1..',
    '.........',
    '.........',
    '.........',
    '..1...1..',
    '.........',
    'x.......x' ] },

/* ---------- 5-9 : jelly ---------- */
{ n:5, type:'jelly', moves:25, colors:5, stars:[30000, 60000, 90000],
  grid:FULL,
  jelly:[
    '000000000',
    '000000000',
    '001111100',
    '001111100',
    '001111100',
    '001111100',
    '001111100',
    '000000000',
    '000000000' ] },

{ n:6, type:'jelly', moves:29, colors:6, stars:[60000, 110000, 160000],
  grid:FULL,
  jelly:[
    '000000000',
    '011111110',
    '012222210',
    '012222210',
    '012222210',
    '012222210',
    '012222210',
    '011111110',
    '000000000' ] },

{ n:7, type:'jelly', moves:24, colors:5, stars:[35000, 70000, 105000],
  grid:[
    '....x....',
    '...111...',
    '.........',
    '.........',
    'x.......x',
    '.........',
    '.........',
    '...111...',
    '....x....' ],
  jelly:[
    '000000000',
    '000000000',
    '011111110',
    '011111110',
    '011111110',
    '011111110',
    '011111110',
    '000000000',
    '000000000' ] },

{ n:8, type:'jelly', moves:34, colors:6, stars:[40000, 80000, 125000],
  grid:[
    '.........',
    '.22...22.',
    '.........',
    '...222...',
    '.........',
    '...222...',
    '.........',
    '.22...22.',
    '.........' ],
  jelly:[
    '111111111',
    '100000001',
    '101111101',
    '100000001',
    '101101101',
    '100000001',
    '101111101',
    '100000001',
    '111111111' ] },

/* ---------- 9-12 : cokelat & licorice ---------- */
{ n:9, type:'jelly', moves:26, colors:5, stars:[40000, 80000, 115000],
  grid:[
    'cc.....cc',
    'c.......c',
    '.........',
    '.........',
    '....l....',
    '.........',
    '.........',
    'c.......c',
    'cc.....cc' ],
  jelly:[
    '000000000',
    '011111110',
    '011111110',
    '011111110',
    '011101110',
    '011111110',
    '011111110',
    '011111110',
    '000000000' ] },

{ n:10, type:'order', moves:28, colors:6, stars:[30000, 60000, 100000],
  grid:[
    '...lll...',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '...lll...' ],
  orders:[ {kind:'color', color:4, count:25}, {kind:'color', color:5, count:25} ] },

{ n:11, type:'ingredient', moves:30, colors:5, stars:[40000, 80000, 120000],
  ingredients:2,
  grid:[
    '.........',
    '.........',
    '..2...2..',
    '.........',
    '.........',
    '.........',
    '..2...2..',
    '.........',
    'vvvvvvvvv' ] },

{ n:12, type:'jelly', moves:36, colors:6, stars:[55000, 105000, 155000],
  grid:[
    '..3...3..',
    '.........',
    '....c....',
    '.........',
    '.k.....k.',
    '.........',
    '....c....',
    '.........',
    '..3...3..' ],
  jelly:[
    '001110100',
    '111111111',
    '111101111',
    '111111111',
    '101111101',
    '111111111',
    '111101111',
    '111111111',
    '001110100' ] },

/* ---------- 13-16 : papan berbentuk ---------- */
{ n:13, type:'jelly', moves:36, colors:6, stars:[75000, 130000, 185000],
  grid:[
    'xxx...xxx',
    'xx.....xx',
    'x.......x',
    '.........',
    '.........',
    '.........',
    'x.......x',
    'xx.....xx',
    'xxx...xxx' ],
  jelly:[
    '000222000',
    '002222200',
    '022222220',
    '222222222',
    '222222222',
    '222222222',
    '022222220',
    '002222200',
    '000222000' ] },

{ n:14, type:'order', moves:32, colors:6, stars:[25000, 55000, 90000],
  grid:[
    '.x.....x.',
    '.........',
    '.........',
    '..mm.mm..',
    '.........',
    '..mm.mm..',
    '.........',
    '.........',
    '.x.....x.' ],
  orders:[ {kind:'special', special:'striped', count:3}, {kind:'special', special:'wrapped', count:1} ] },

{ n:15, type:'ingredient', moves:30, colors:6, stars:[45000, 90000, 140000],
  ingredients:3,
  grid:[
    '.........',
    '.1.1.1.1.',
    '.........',
    '..l...l..',
    '.........',
    '..l...l..',
    '.........',
    '.1.1.1.1.',
    'vvvvvvvvv' ] },

{ n:16, type:'jelly', moves:38, colors:6, stars:[60000, 115000, 170000],
  grid:[
    'c.......c',
    '.22...22.',
    '.........',
    '....k....',
    '....l....',
    '....k....',
    '.........',
    '.22...22.',
    'c.......c' ],
  jelly:[
    '000000000',
    '011111110',
    '011111110',
    '011111110',
    '011111110',
    '011111110',
    '011111110',
    '011111110',
    '000000000' ] },

/* ---------- 17-20 : tantangan ---------- */
{ n:17, type:'order', moves:34, colors:6, stars:[35000, 70000, 110000],
  grid:FULL,
  orders:[ {kind:'combo', combo:'striped+striped', count:1}, {kind:'color', color:0, count:30} ] },

{ n:18, type:'ingredient', moves:32, colors:6, stars:[40000, 80000, 125000],
  ingredients:3,
  grid:[
    '...xxx...',
    '.........',
    '.2.....2.',
    '.........',
    '..2...2..',
    '.........',
    '.2.....2.',
    '.........',
    'vvvvvvvvv' ] },

{ n:19, type:'jelly', moves:40, colors:6, stars:[80000, 145000, 210000],
  grid:[
    'ccc...ccc',
    'c.......c',
    '..555....',
    '.........',
    '....k....',
    '.........',
    '....555..',
    'c.......c',
    'ccc...ccc' ],
  jelly:[
    '000111000',
    '022222220',
    '222222222',
    '222222222',
    '222222222',
    '222222222',
    '222222222',
    '022222220',
    '000111000' ] },

{ n:20, type:'order', moves:38, colors:5, stars:[55000, 105000, 160000],
  grid:[
    'x.......x',
    '.ll...ll.',
    '.........',
    '..2...2..',
    '.........',
    '..2...2..',
    '.........',
    '.ll...ll.',
    'x.......x' ],
  orders:[
    {kind:'special', special:'colorbomb', count:1},
    {kind:'special', special:'wrapped',   count:2},
    {kind:'color',   color:3,             count:35} ] },
];

CC.LEVELS.forEach((L, i) => { L.n = i + 1; if (!L.jelly) L.jelly = none; });

/* ============================================================
   GENERATOR LEVEL  —  level 21 sampai 10.000
   ------------------------------------------------------------
   Tiap level punya benih acak dari nomornya sendiri, jadi
   level 7.432 selalu menghasilkan papan yang sama persis,
   tanpa perlu menyimpan 10.000 definisi.
   ============================================================ */

CC.HANDMADE = CC.LEVELS.length;
CC.TOTAL    = 10000;
CC.PER_EP   = 15;                       // level per episode

/* --- acak berbenih (mulberry32) --- */
function rng(seed){
  let a = (seed >>> 0) || 1;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v,a,b) => v < a ? a : v > b ? b : v;

/* --- kurva kesulitan 0..1 --- */
function difficulty(n, R){
  // naik cepat di awal lalu melandai, matang sekitar level 900
  let d = 1 - Math.exp(-(n - CC.HANDMADE) / 430);
  d = clamp(d, 0, 1);
  d += (R() - 0.5) * 0.18;              // variasi antar level
  if (n % 10 === 0) d -= 0.10;          // level "istirahat"
  if (n % 25 === 0) d += 0.14;          // level sulit
  if (n % 100 === 0) d += 0.10;         // penutup episode besar
  return clamp(d, 0.04, 1);
}

/* ============================================================
   BENTUK PAPAN
   mengembalikan larik 9x9 boolean (true = petak terpakai)
   ============================================================ */
function blank(v){ const g=[]; for(let r=0;r<9;r++){ g[r]=[]; for(let c=0;c<9;c++) g[r][c]=v; } return g; }

const SHAPES = [
  function full(){ return blank(true); },
  function cutCorners(R){
    const g = blank(true), k = 1 + Math.floor(R()*3);
    for (let r=0;r<9;r++) for (let c=0;c<9;c++){
      const dr = Math.min(r, 8-r), dc = Math.min(c, 8-c);
      if (dr + dc < k) g[r][c] = false;
    }
    return g;
  },
  function diamond(R){
    const g = blank(false), k = 5 + Math.floor(R()*3);   // 5..7
    for (let r=0;r<9;r++) for (let c=0;c<9;c++)
      if (Math.abs(r-4) + Math.abs(c-4) <= k) g[r][c] = true;
    return g;
  },
  function plus(R){
    const g = blank(false), w = 2 + Math.floor(R()*2);   // lebar lengan
    for (let r=0;r<9;r++) for (let c=0;c<9;c++)
      if (Math.abs(r-4) <= w || Math.abs(c-4) <= w) g[r][c] = true;
    return g;
  },
  function hourglass(R){
    const g = blank(true), k = 1 + Math.floor(R()*2);
    for (let r=0;r<9;r++){
      const w = Math.abs(r-4);
      for (let c=0;c<9;c++) if (Math.abs(c-4) > 4 - Math.max(0, k - w)) g[r][c] = false;
    }
    for (let r=0;r<9;r++) for (let c=0;c<9;c++)
      if (Math.abs(r-4) <= 0 && Math.abs(c-4) > 2) g[r][c] = false;
    return g;
  },
  function sideBites(R){
    const g = blank(true), k = 2 + Math.floor(R()*2);
    for (let r=4-k+1;r<=4+k-1;r++)
      for (let c=0;c<k-1;c++){ if(g[r]){ g[r][c]=false; g[r][8-c]=false; } }
    return g;
  },
  function topBottomBites(R){
    const g = blank(true), w = 2 + Math.floor(R()*2), h = 1 + Math.floor(R()*2);
    for (let r=0;r<h;r++) for (let c=4-w+1;c<=4+w-1;c++){ g[r][c]=false; g[8-r][c]=false; }
    return g;
  },
  function pillars(R){
    const g = blank(true);
    const cols = R() < .5 ? [1,7] : [2,6];
    const h = 2 + Math.floor(R()*2);
    for (const c of cols) for (let r=0;r<h;r++){ g[r][c]=false; g[8-r][c]=false; }
    return g;
  },
  function butterfly(R){
    const g = blank(true), k = 1 + Math.floor(R()*2);
    for (let r=0;r<9;r++) for (let c=0;c<9;c++){
      const dr = Math.abs(r-4), dc = Math.abs(c-4);
      if (dr <= k && dc >= 3) g[r][c] = false;
      if (dr >= 3 && dc <= k) g[r][c] = false;
    }
    return g;
  },
  function arch(R){
    const g = blank(true), w = 1 + Math.floor(R()*2);
    for (let r=6;r<9;r++) for (let c=4-w;c<=4+w;c++) g[r][c] = false;
    for (let c=0;c<2;c++){ g[0][c]=false; g[0][8-c]=false; }
    return g;
  },
];

/* pastikan papan menyatu dan cukup luas */
function tidyShape(g){
  // kolom yang cuma punya satu petak dibuang dulu (tidak berguna untuk dimainkan)
  for (let c=0;c<9;c++){
    let n = 0; for (let r=0;r<9;r++) if (g[r][c]) n++;
    if (n === 1) for (let r=0;r<9;r++) g[r][c] = false;
  }
  let count = 0, start = null;
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) if (g[r][c]){ count++; if(!start) start=[r,c]; }
  if (count < 46 || !start) return blank(true);
  // isi banjir dari satu titik
  const seen = blank(false), st = [start];
  seen[start[0]][start[1]] = true;
  let reach = 0;
  while (st.length){
    const p = st.pop(); reach++;
    for (const d of [[-1,0],[1,0],[0,-1],[0,1]]){
      const r = p[0]+d[0], c = p[1]+d[1];
      if (r<0||r>8||c<0||c>8||!g[r][c]||seen[r][c]) continue;
      seen[r][c] = true; st.push([r,c]);
    }
  }
  if (reach !== count) return blank(true);        // ada bagian terputus
  return g;
}

/* ============================================================
   POLA JELLY
   ============================================================ */
const JELLY_PATTERNS = [
  (r,c) => true,                                        // seluruh papan
  (r,c) => Math.abs(r-4) <= 2 && Math.abs(c-4) <= 2,    // kotak tengah
  (r,c) => Math.abs(r-4) + Math.abs(c-4) <= 4,          // berlian
  (r,c) => r>=1 && r<=7 && c>=1 && c<=7,                // bingkai dalam
  (r,c) => (r+c) % 2 === 0,                             // papan catur
  (r,c) => r % 2 === 0,                                 // baris selang-seling
  (r,c) => c % 2 === 0,                                 // kolom selang-seling
  (r,c) => Math.abs(r-4) >= 2 || Math.abs(c-4) >= 2,    // cincin luar
  (r,c) => r >= 3,                                      // bagian bawah
  (r,c) => Math.abs(r-4) <= 1 || Math.abs(c-4) <= 1,    // salib
];

/* ============================================================
   MEMBANGUN SATU LEVEL
   ============================================================ */
function generate(n){
  const R = rng(Math.imul(n, 2654435761) ^ 0x9E3779B9);
  R(); R();                                     // panaskan
  const d = difficulty(n, R);

  /* --- jumlah warna --- */
  let colors;
  if (n <= 24) colors = 5;
  else if (d < 0.22) colors = 5;
  else colors = (R() < 0.16) ? 5 : 6;

  /* --- jenis level (dipilih lebih dulu, karena memengaruhi bentuk papan) --- */
  const w = {
    score:      clamp(0.34 - d*0.26, 0.06, 0.34),
    jelly:      0.30 + d*0.04,
    ingredient: clamp(0.14 + d*0.12, 0.14, 0.26),
    order:      clamp(0.20 + d*0.14, 0.20, 0.34),
  };
  const tot = w.score + w.jelly + w.ingredient + w.order;
  let pick = R() * tot, type = 'jelly';
  for (const k of ['score','jelly','ingredient','order']){
    if (pick < w[k]){ type = k; break; }
    pick -= w[k];
  }
  const isIngredient = type === 'ingredient';

  // Level bahan memakai lebih sedikit warna. Petak tepat di bawah sebuah bahan hanya
  // bisa dibersihkan lewat match MENDATAR (match tegak selalu terhalang bahan itu
  // sendiri), jadi dengan 6 warna langkah pembebasnya terlalu langka.
  if (isIngredient) colors = d < 0.35 ? 4 : 5;

  /* --- bentuk papan --- */
  const shapeChance = clamp(0.25 + d * 0.5, 0, 0.8);
  let open;
  if (R() < shapeChance){
    const f = SHAPES[1 + Math.floor(R() * (SHAPES.length - 1))];
    open = tidyShape(f(R));
  } else open = blank(true);

  // Level bahan: dua baris terbawah WAJIB utuh selebar papan. Tanpa ini bahan
  // bisa terjebak di kolom pojok dan cuma bisa lepas lewat match sudut yang langka.
  // Level bahan: separuh bawah papan WAJIB utuh selebar papan, tanpa lubang.
  // Tanpa corong bersih, bahan gampang terjebak di kantong yang tidak bisa dilewati.
  if (isIngredient){
    for (let r=5;r<=8;r++) for (let c=0;c<9;c++) open[r][c] = true;
    open = tidyShape(open);                    // periksa ulang: jangan sampai terputus
  }

  const openCells = [];
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) if (open[r][c]) openCells.push([r,c]);

  /* --- papan kerja berisi karakter --- */
  const grid = [];
  for (let r=0;r<9;r++){
    grid[r] = [];
    for (let c=0;c<9;c++) grid[r][c] = open[r][c] ? '.' : 'x';
  }

  /* --- petak keluar bahan: petak PALING BAWAH tiap kolom --- */
  const exits = new Set();
  if (isIngredient){
    for (let c=0;c<9;c++){
      for (let r=8;r>=0;r--) if (open[r][c]){ exits.add(r*9+c); break; }
    }
  }

  /* --- rintangan, ditaruh simetris kiri-kanan ---
     Pada level bahan, sepertiga bawah papan dibiarkan bersih agar bahan lancar turun. */
  const freeRows = isIngredient ? [1,2,3,4] : [1,2,3,4,5,6,7,8];
  function placeSym(ch, pairs, pred){
    let put = 0, tries = 0;
    while (put < pairs && tries++ < 120){
      const r = freeRows[Math.floor(R()*freeRows.length)];
      const c = Math.floor(R()*4);                 // 0..3, dicermin ke 8-c
      const c2 = 8 - c;
      if (!open[r][c] || !open[r][c2]) continue;
      if (exits.has(r*9+c) || exits.has(r*9+c2)) continue;
      if (grid[r][c] !== '.' || grid[r][c2] !== '.') continue;
      if (pred && (!pred(r,c) || !pred(r,c2))) continue;
      grid[r][c] = ch; grid[r][c2] = ch; put++;
    }
    return put * 2;
  }

  let blockerCells = 0, kinds = 0;
  const budget = Math.round(d * 11);
  if (budget > 0 && R() < 0.75){
    // sebagian besar icing tipis; lapis tebal hanya sesekali di level sulit
    const layers = String(clamp(1 + Math.floor(Math.pow(R(), 1.7) * (1 + d*3.4)), 1, 5));
    blockerCells += placeSym(layers, 1 + Math.floor(R()*Math.min(5, budget))); kinds++;
  }
  if (d > 0.28 && R() < 0.45){ blockerCells += placeSym('c', 1 + Math.floor(R()*2)); kinds++; }
  if (d > 0.20 && R() < 0.50){ blockerCells += placeSym('l', 1 + Math.floor(R()*3)); kinds++; }
  if (d > 0.45 && R() < 0.35){ blockerCells += placeSym('k', 1 + Math.floor(R()*2)); kinds++; }
  if (d > 0.35 && R() < 0.40){ blockerCells += placeSym('m', 1 + Math.floor(R()*3)); kinds++; }

  /* jangan sampai papan terlalu padat */
  const maxBlock = Math.floor(openCells.length * 0.22);
  if (blockerCells > maxBlock){
    for (let r=8;r>=0 && blockerCells>maxBlock;r--)
      for (let c=0;c<9 && blockerCells>maxBlock;c++)
        if ('12345clkm'.indexOf(grid[r][c]) >= 0){ grid[r][c] = '.'; blockerCells--; }
  }
  /* Tidak boleh ada baris yang nyaris tertutup penuh. Dinding melintang membuat
     permen (dan terutama bahan) tidak bisa turun, sehingga level jadi mustahil. */
  const WALL = 'x12345clk';                     // 'm' tidak menghalangi, marmalade tetap jatuh
  const minFree = isIngredient ? 4 : 3;
  const order = [4,3,5,2,6,1,7,0,8];
  for (let r=0;r<9;r++){
    let openN = 0, free = 0;
    for (let c=0;c<9;c++){
      if (grid[r][c] === 'x') continue;
      openN++;
      if (WALL.indexOf(grid[r][c]) < 0) free++;
    }
    if (openN === 0) continue;
    const need = Math.min(minFree, openN);
    for (const c of order){
      if (free >= need) break;
      if (grid[r][c] === 'x' || WALL.indexOf(grid[r][c]) < 0) continue;
      grid[r][c] = '.'; free++; blockerCells--;
    }
  }

  const blockPenalty = kinds * 0.05 + Math.max(0, blockerCells) * 0.012;

  /* --- jelly --- */
  const jelly = [];
  for (let r=0;r<9;r++){ jelly[r] = []; for (let c=0;c<9;c++) jelly[r][c] = 0; }
  let layers = 0;
  if (type === 'jelly'){
    const pat = JELLY_PATTERNS[Math.floor(R()*JELLY_PATTERNS.length)];
    const dbl = clamp((d - 0.25) * 1.1, 0, 0.75);     // peluang jelly dua lapis
    for (const p of openCells){
      if (!pat(p[0], p[1])) continue;
      const v = R() < dbl ? 2 : 1;
      jelly[p[0]][p[1]] = v; layers += v;
    }
    if (layers < 12){                                  // terlalu sedikit, pakai seluruh papan
      layers = 0;
      for (const p of openCells){ jelly[p[0]][p[1]] = 1; layers++; }
    }
    if (layers > 150){                                 // terlalu banyak, turunkan jadi satu lapis
      layers = 0;
      for (const p of openCells) if (jelly[p[0]][p[1]]){ jelly[p[0]][p[1]] = 1; layers++; }
    }
  }

  /* --- bahan --- */
  let ingredients = 0;
  if (isIngredient){
    ingredients = Math.min(4, 2 + Math.floor(d * 2.6 + R() * 1.3));   // 2..4
    // tiap bahan butuh ±13 langkah; kurangi kalau tidak muat dalam batas langkah
    while (ingredients > 2 && Math.round((10 + ingredients*13) * (1 + blockPenalty)) > 64) ingredients--;
    exits.forEach(k => { grid[Math.floor(k/9)][k%9] = 'v'; });
  }

  /* --- order --- */
  const orders = [];
  if (type === 'order'){
    const howMany = d < 0.3 ? 1 : d < 0.65 ? (R()<0.5?1:2) : (R()<0.45?2:3);
    const usedColors = [], usedSpecials = [];
    for (let i=0;i<howMany;i++){
      const roll = R();
      if (roll < 0.52 || (i === 0 && d < 0.25)){
        let col; let g=0;
        do { col = Math.floor(R()*colors); } while (usedColors.indexOf(col) >= 0 && g++ < 10);
        usedColors.push(col);
        orders.push({ kind:'color', color:col, count: Math.round(16 + d*34 + R()*8) });
      } else if (roll < 0.92 || d < 0.5){
        const pool = d > 0.6 ? ['striped','wrapped','colorbomb'] : ['striped','wrapped'];
        let sp; let g=0;
        do { sp = pool[Math.floor(R()*pool.length)]; } while (usedSpecials.indexOf(sp) >= 0 && g++ < 10);
        usedSpecials.push(sp);
        const max = sp === 'colorbomb' ? 2 : sp === 'wrapped' ? 3 : 5;
        orders.push({ kind:'special', special:sp, count: clamp(1 + Math.floor(d*max), 1, max) });
      } else {
        // order kombinasi berat; jadikan satu-satunya sasaran supaya pemain bisa fokus
        const combos = ['striped+striped','striped+wrapped','wrapped+wrapped'];
        orders.length = 0;
        orders.push({ kind:'combo', combo: combos[Math.floor(R()*combos.length)], count: 1 });
        break;
      }
    }
    if (!orders.length) orders.push({ kind:'color', color:0, count:20 });
  }

  /* --- jumlah langkah --- */
  let moves;
  if (type === 'jelly'){
    moves = Math.round((12 + layers * 0.44) * (1 + blockPenalty));
  } else if (type === 'ingredient'){
    moves = Math.round((10 + ingredients * 13) * (1 + blockPenalty));
  } else if (type === 'order'){
    let wgt = 0;
    for (const o of orders){
      if (o.kind === 'color')   wgt += o.count * 0.62;
      if (o.kind === 'special') wgt += o.count * (o.special === 'colorbomb' ? 9 : o.special === 'wrapped' ? 6 : 4);
      if (o.kind === 'combo')   wgt += o.count * 30;
    }
    moves = Math.round((11 + wgt) * (1 + blockPenalty));
  } else {
    moves = Math.round(20 + R()*8 - d*4);
  }
  moves = clamp(moves, 15, 65);

  /* --- target skor & ambang bintang --- */
  const perMove = colors === 5 ? 560 : 430;
  let target = 0, s1;
  if (type === 'score'){
    // target dibuat konservatif: papan sempit atau penuh penghalang jauh lebih sulit
    // mencetak skor. Tantangan sebenarnya ada di ambang bintang 2 dan 3.
    const density = openCells.length / 81;
    const squeeze = 1 - Math.min(0.5, blockPenalty);
    target = Math.max(2500,
      Math.round(moves * perMove * (0.45 + d*0.30) * density * density * squeeze / 500) * 500);
    s1 = target;
  } else if (type === 'jelly'){
    s1 = Math.round((22000 + layers * 430) / 500) * 500;
  } else if (type === 'ingredient'){
    s1 = Math.round((moves * 1300) / 500) * 500;
  } else {
    s1 = Math.round((moves * 1250) / 500) * 500;
  }
  const stars = [s1, Math.round(s1*1.95/500)*500, Math.round(s1*2.95/500)*500];

  const L = {
    n, type, moves, colors, stars,
    grid: grid.map(r => r.join('')),
    jelly: jelly.map(r => r.join('')),
  };
  if (type === 'score')      L.target = target;
  if (type === 'ingredient') L.ingredients = ingredients;
  if (type === 'order')      L.orders = orders;
  return L;
}

/* --- akses level, dengan penyimpanan sementara --- */
const cache = new Map();
CC.getLevel = function (n) {
  n = Math.round(n);
  if (n < 1 || n > CC.TOTAL) return null;
  if (n <= CC.HANDMADE) return CC.LEVELS[n-1];
  if (!cache.has(n)){
    if (cache.size > 300) cache.clear();
    cache.set(n, generate(n));
  }
  return cache.get(n);
};

/* ============================================================
   NAMA EPISODE
   ============================================================ */
const EP_A = ['Lembah','Bukit','Hutan','Pantai','Sungai','Gua','Taman','Istana','Jembatan','Menara',
              'Danau','Padang','Kebun','Pulau','Gurun','Lorong','Puncak','Teluk','Air Terjun','Pasar',
              'Ladang','Rawa','Tebing','Kastil','Dermaga','Pelangi'];
const EP_B = ['Permen','Cokelat','Karamel','Marshmallow','Lolipop','Jeli','Biskuit','Stroberi','Vanila','Madu',
              'Gula','Mint','Kelapa','Nougat','Toffee','Krim','Sirup','Kayu Manis','Blueberry','Mangga',
              'Pisang','Lemon','Anggur','Ceri','Almond','Kapas'];
CC.episodeCount = Math.ceil(CC.TOTAL / CC.PER_EP);
CC.episodeName = function (i) {
  const a = EP_A[i % EP_A.length];
  const b = EP_B[Math.floor(i / EP_A.length) % EP_B.length];
  const round = Math.floor(i / (EP_A.length * EP_B.length));
  return a + ' ' + b + (round ? ' ' + ['','II','III','IV','V'][round] : '');
};

})(window.CC = window.CC || {});


