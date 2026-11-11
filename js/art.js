/* ============================================================
   ART  —  menggambar permen, blocker, papan, dan latar
   Semua digambar dari kode (tanpa aset gambar).
   ============================================================ */
(function (CC) {
'use strict';

const art = CC.art = {};

/* ---------- util path ---------- */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
art.roundRect = roundRect;

function starPath(ctx, cx, cy, R, r, n) {
  n = n || 5;
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 ? r : R;
    const a = -Math.PI / 2 + i * Math.PI / n;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}
art.starPath = starPath;

/* ---------- siluet keenam permen ----------
   Semua digambar dalam kotak R*2 di sekitar (cx, cy). */
function shapePath(ctx, shape, cx, cy, R) {
  switch (shape) {

    /* BIRU — kepala lollipop: bola bulat */
    case 'lollipop':
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      break;

    /* HIJAU — permen karet: kotak membulat dengan sisi sedikit cembung */
    case 'gum': {
      const s = R * 0.90, k = R * 0.30;
      ctx.beginPath();
      ctx.moveTo(cx - s + k, cy - s);
      ctx.quadraticCurveTo(cx, cy - s - R * 0.10, cx + s - k, cy - s);
      ctx.quadraticCurveTo(cx + s, cy - s, cx + s, cy - s + k);
      ctx.quadraticCurveTo(cx + s + R * 0.10, cy, cx + s, cy + s - k);
      ctx.quadraticCurveTo(cx + s, cy + s, cx + s - k, cy + s);
      ctx.quadraticCurveTo(cx, cy + s + R * 0.10, cx - s + k, cy + s);
      ctx.quadraticCurveTo(cx - s, cy + s, cx - s, cy + s - k);
      ctx.quadraticCurveTo(cx - s - R * 0.10, cy, cx - s, cy - s + k);
      ctx.quadraticCurveTo(cx - s, cy - s, cx - s + k, cy - s);
      ctx.closePath();
      break;
    }

    /* ORANYE — lozenge / pastiles: stadium miring */
    case 'lozenge': {
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(-0.38);
      const w = R * 1.08, h = R * 0.66;
      ctx.beginPath();
      ctx.moveTo(-w + h, -h);
      ctx.arcTo(w, -h, w, h, h);
      ctx.arcTo(w, h, -w, h, h);
      ctx.arcTo(-w, h, -w, -h, h);
      ctx.arcTo(-w, -h, w, -h, h);
      ctx.closePath();
      ctx.restore();
      break;
    }

    /* UNGU — jujube: gumpalan tiga lobus */
    case 'jujube': {
      const r = R * 0.56, d = R * 0.46;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 3;
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.92;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.arc(cx, cy, R * 0.52, 0, Math.PI * 2);
      break;
    }

    /* MERAH — jelly bean: kacang melengkung */
    case 'bean': {
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(-0.42);
      ctx.beginPath();
      ctx.moveTo(-R * 0.95, R * 0.06);
      ctx.bezierCurveTo(-R * 1.00, -R * 0.62, -R * 0.20, -R * 0.86, R * 0.42, -R * 0.62);
      ctx.bezierCurveTo(R * 1.02, -R * 0.40, R * 1.02, R * 0.46, R * 0.44, R * 0.68);
      ctx.bezierCurveTo(-R * 0.10, R * 0.88, -R * 0.74, R * 0.62, -R * 0.95, R * 0.06);
      ctx.closePath();
      ctx.restore();
      break;
    }

    /* KUNING — lemon drop: tetesan */
    case 'drop': {
      ctx.beginPath();
      ctx.moveTo(cx, cy - R * 1.05);
      ctx.bezierCurveTo(cx + R * 0.52, cy - R * 0.54, cx + R * 0.92, cy - R * 0.06, cx + R * 0.92, cy + R * 0.22);
      ctx.arc(cx, cy + R * 0.22, R * 0.92, 0, Math.PI);
      ctx.bezierCurveTo(cx - R * 0.92, cy - R * 0.06, cx - R * 0.52, cy - R * 0.54, cx, cy - R * 1.05);
      ctx.closePath();
      break;
    }

    default:
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
  }
}
art.shapePath = shapePath;

/* ---------- badan permen bergradasi ---------- */
function paintBody(ctx, def, cx, cy, R) {
  // bayangan jatuh
  ctx.save();
  ctx.translate(0, R * 0.16);
  ctx.fillStyle = 'rgba(40,16,60,0.26)';
  shapePath(ctx, def.shape, cx, cy, R);
  ctx.fill();
  ctx.restore();

  // badan
  const g = ctx.createLinearGradient(cx - R, cy - R, cx + R * 0.8, cy + R);
  g.addColorStop(0.00, def.light);
  g.addColorStop(0.45, def.base);
  g.addColorStop(1.00, def.dark);
  shapePath(ctx, def.shape, cx, cy, R);
  ctx.fillStyle = g;
  ctx.fill();

  // pantulan bawah (kesan tembus cahaya)
  ctx.save();
  shapePath(ctx, def.shape, cx, cy, R); ctx.clip();
  const rg = ctx.createRadialGradient(cx, cy + R * 0.58, 1, cx, cy + R * 0.58, R * 1.05);
  rg.addColorStop(0, 'rgba(255,255,255,0.26)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(cx - R * 1.4, cy - R * 1.4, R * 2.8, R * 2.8);
  ctx.restore();

  // garis tepi
  shapePath(ctx, def.shape, cx, cy, R);
  ctx.lineWidth = Math.max(1.4, R * 0.11);
  ctx.strokeStyle = def.dark;
  ctx.save(); shapePath(ctx, def.shape, cx, cy, R); ctx.clip();
  ctx.stroke();
  ctx.restore();
}

/* ---------- kilau ---------- */
function paintGloss(ctx, def, cx, cy, R) {
  ctx.save();
  shapePath(ctx, def.shape, cx, cy, R); ctx.clip();
  // kilau utama
  ctx.save();
  ctx.translate(cx - R * 0.34, cy - R * 0.44); ctx.rotate(-0.44);
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, R * 0.42);
  g.addColorStop(0, 'rgba(255,255,255,0.92)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, 0, R * 0.40, R * 0.20, 0, 0, 7); ctx.fill();
  ctx.restore();
  // kilau kecil kedua
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.beginPath(); ctx.ellipse(cx + R * 0.36, cy - R * 0.50, R * 0.10, R * 0.07, -0.3, 0, 7); ctx.fill();
  // rim light kanan-bawah
  ctx.strokeStyle = def.rim;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(1.2, R * 0.09);
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.93, 0.15, 1.5); ctx.stroke();
  ctx.restore();
}

/* ---------- tekstur khas tiap permen ---------- */
function paintTexture(ctx, def, cx, cy, R, t) {
  ctx.save();
  shapePath(ctx, def.shape, cx, cy, R); ctx.clip();
  switch (def.shape) {
    case 'lollipop': { // pusaran lollipop
      ctx.strokeStyle = 'rgba(255,255,255,0.30)';
      ctx.lineWidth = Math.max(1.5, R * 0.14);
      ctx.beginPath();
      for (let i = 0; i <= 42; i++) {
        const a = i / 42 * Math.PI * 3.1;
        const rr = R * 0.10 + (i / 42) * R * 0.85;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      break;
    }
    case 'gum': { // kisi wafel
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1;
      const st = R * 0.30;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath(); ctx.moveTo(cx + i * st, cy - R); ctx.lineTo(cx + i * st, cy + R); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - R, cy + i * st); ctx.lineTo(cx + R, cy + i * st); ctx.stroke();
      }
      break;
    }
    case 'lozenge': { // panel dalam
      ctx.strokeStyle = 'rgba(255,255,255,0.26)';
      ctx.lineWidth = Math.max(1, R * 0.07);
      shapePath(ctx, 'lozenge', cx, cy, R * 0.70); ctx.stroke();
      break;
    }
    case 'drop': { // kristal gula
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      const pts = [[-0.35,-0.10],[0.22,0.12],[-0.08,0.46],[0.40,-0.34],[-0.42,0.34]];
      pts.forEach(p => { ctx.beginPath(); ctx.arc(cx + p[0]*R, cy + p[1]*R, R*0.075, 0, 7); ctx.fill(); });
      break;
    }
    case 'bean': { // garis halus
      ctx.strokeStyle = 'rgba(255,255,255,0.20)';
      ctx.lineWidth = Math.max(1, R * 0.08);
      ctx.beginPath();
      ctx.moveTo(cx - R * 0.55, cy + R * 0.30);
      ctx.quadraticCurveTo(cx, cy + R * 0.58, cx + R * 0.55, cy + R * 0.10);
      ctx.stroke();
      break;
    }
    case 'jujube': { // kilau tiap lobus
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 3;
        const x = cx + Math.cos(a) * R * 0.46, y = cy + Math.sin(a) * R * 0.42;
        ctx.beginPath(); ctx.ellipse(x - R*0.14, y - R*0.18, R*0.14, R*0.09, -0.5, 0, 7); ctx.fill();
      }
      break;
    }
  }
  ctx.restore();
}

/* ============================================================
   PERMEN LENGKAP (termasuk spesial)
   tile: {color, special:'striped-h'|'striped-v'|'wrapped'|'colorbomb'|null,
          marmalade, locked, ingredient}
   ============================================================ */
art.drawCandy = function (ctx, tile, cx, cy, S, t) {
  const R = S * 0.40;

  if (tile.ingredient) { art.drawIngredient(ctx, tile.ingredient, cx, cy, S, t); return; }

  // bom warna, termasuk saat sudah dipicu (special dikosongkan tapi warna tetap null)
  if (tile.special === 'colorbomb' || tile.color == null) { art.drawColorBomb(ctx, cx, cy, S, t); return; }

  const def = CC.COLORS[tile.color] || CC.COLORS[0];

  if (tile.special === 'wrapped') {
    art.drawWrapped(ctx, def, cx, cy, S, t);
  } else {
    paintBody(ctx, def, cx, cy, R);
    paintTexture(ctx, def, cx, cy, R, t);
    if (tile.special === 'striped-h' || tile.special === 'striped-v') {
      const vert = tile.special === 'striped-v';
      ctx.save();
      shapePath(ctx, def.shape, cx, cy, R); ctx.clip();
      const pulse = 0.78 + 0.22 * Math.sin(t / 190);
      ctx.globalAlpha = pulse;
      const bw = R * 0.30, gap = R * 0.56;
      for (const k of [-1, 0, 1]) {
        ctx.fillStyle = '#ffffff';
        if (vert) ctx.fillRect(cx + k * gap - bw / 2, cy - R * 1.2, bw, R * 2.4);
        else      ctx.fillRect(cx - R * 1.2, cy + k * gap - bw / 2, R * 2.4, bw);
      }
      ctx.globalAlpha = pulse * 0.5;
      ctx.fillStyle = def.dark;
      for (const k of [-1, 0, 1]) {
        if (vert) { ctx.fillRect(cx + k*gap - bw/2, cy - R*1.2, R*0.05, R*2.4); ctx.fillRect(cx + k*gap + bw/2 - R*0.05, cy - R*1.2, R*0.05, R*2.4); }
        else      { ctx.fillRect(cx - R*1.2, cy + k*gap - bw/2, R*2.4, R*0.05); ctx.fillRect(cx - R*1.2, cy + k*gap + bw/2 - R*0.05, R*2.4, R*0.05); }
      }
      ctx.restore();
    }
    paintGloss(ctx, def, cx, cy, R);
  }

  if (tile.locked)    art.drawLock(ctx, cx, cy, S);
  if (tile.marmalade) art.drawMarmalade(ctx, cx, cy, S);
};

/* --- permen bungkus --- */
art.drawWrapped = function (ctx, def, cx, cy, S, t) {
  const R = S * 0.40;
  const wob = Math.sin(t / 420) * 0.07;
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(wob); ctx.translate(-cx, -cy);

  // kerucut puntiran kiri & kanan
  for (const sgn of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + sgn * R * 0.82, cy);
    ctx.scale(sgn, 1);
    ctx.beginPath();
    ctx.moveTo(-R * 0.18, -R * 0.10);
    ctx.lineTo(R * 0.52, -R * 0.52);
    ctx.lineTo(R * 0.38, -R * 0.16);
    ctx.lineTo(R * 0.58, 0);
    ctx.lineTo(R * 0.38, R * 0.16);
    ctx.lineTo(R * 0.52, R * 0.52);
    ctx.lineTo(-R * 0.18, R * 0.10);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -R * 0.5, 0, R * 0.5);
    g.addColorStop(0, def.light); g.addColorStop(1, def.dark);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = def.dark; ctx.lineWidth = Math.max(1, R * 0.07); ctx.stroke();
    ctx.restore();
  }

  // badan bungkus
  const fr = R * 0.92;
  roundRect(ctx, cx - fr, cy - fr, fr * 2, fr * 2, fr * 0.36);
  const g2 = ctx.createLinearGradient(cx - fr, cy - fr, cx + fr, cy + fr);
  g2.addColorStop(0, def.light); g2.addColorStop(0.5, def.base); g2.addColorStop(1, def.dark);
  ctx.fillStyle = g2; ctx.fill();
  ctx.strokeStyle = def.dark; ctx.lineWidth = Math.max(1.4, R * 0.10); ctx.stroke();

  // kerut foil
  ctx.save();
  roundRect(ctx, cx - fr, cy - fr, fr * 2, fr * 2, fr * 0.36); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(1, R * 0.06);
  for (const k of [-0.5, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(cx - fr, cy + k * fr * 0.9);
    ctx.quadraticCurveTo(cx, cy + k * fr * 0.3, cx + fr, cy + k * fr * 0.9);
    ctx.stroke();
  }
  ctx.restore();

  // permen di dalam
  const r2 = R * 0.46;
  shapePath(ctx, def.shape, cx, cy, r2);
  ctx.fillStyle = def.light; ctx.fill();
  ctx.strokeStyle = def.dark; ctx.lineWidth = Math.max(1, R * 0.07); ctx.stroke();

  // kilau foil
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  starPath(ctx, cx - fr * 0.42, cy - fr * 0.42, R * 0.26, R * 0.07, 4); ctx.fill();
  ctx.restore();
};

/* --- bom warna --- */
art.drawColorBomb = function (ctx, cx, cy, S, t) {
  const R = S * 0.42 * (1 + 0.035 * Math.sin(t / 320));
  // aura
  const ag = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.6);
  ag.addColorStop(0, 'rgba(255,255,255,0.22)');
  ag.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = ag;
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.6, 0, 7); ctx.fill();
  // bayangan
  ctx.fillStyle = 'rgba(40,16,60,0.28)';
  ctx.beginPath(); ctx.arc(cx, cy + R * 0.16, R, 0, 7); ctx.fill();
  // bola gelap
  const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
  g.addColorStop(0, '#5a5a6a'); g.addColorStop(0.55, '#20202b'); g.addColorStop(1, '#07070c');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
  // taburan
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.97, 0, 7); ctx.clip();
  const spin = t / 1400;
  for (let i = 0; i < 30; i++) {
    const a = spin + i * 2.399963;
    const rr = R * 0.92 * Math.sqrt((i + 0.5) / 30);
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.96;
    const c = CC.COLORS[i % 6];
    ctx.fillStyle = c.base;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(a);
    roundRect(ctx, -R * 0.11, -R * 0.045, R * 0.22, R * 0.09, R * 0.045);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  // kilau
  ctx.fillStyle = 'rgba(255,255,255,0.80)';
  ctx.beginPath(); ctx.ellipse(cx - R * 0.34, cy - R * 0.42, R * 0.24, R * 0.13, -0.5, 0, 7); ctx.fill();
};

/* --- bahan (ingredient) --- */
art.drawIngredient = function (ctx, kind, cx, cy, S, t) {
  const R = S * 0.42;
  ctx.save();
  ctx.fillStyle = 'rgba(40,16,60,0.26)';
  ctx.beginPath(); ctx.ellipse(cx, cy + R * 0.86, R * 0.70, R * 0.22, 0, 0, 7); ctx.fill();

  if (kind === 'cherry') {
    // tangkai
    ctx.strokeStyle = '#4e8a2f'; ctx.lineWidth = Math.max(2, R * 0.13); ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.34, cy + R * 0.08);
    ctx.quadraticCurveTo(cx - R * 0.10, cy - R * 0.95, cx + R * 0.16, cy - R * 0.82);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + R * 0.38, cy + R * 0.14);
    ctx.quadraticCurveTo(cx + R * 0.40, cy - R * 0.70, cx + R * 0.16, cy - R * 0.82);
    ctx.stroke();
    // daun
    ctx.fillStyle = '#5cb036';
    ctx.beginPath();
    ctx.ellipse(cx + R * 0.52, cy - R * 0.84, R * 0.30, R * 0.14, -0.5, 0, 7); ctx.fill();
    // dua buah ceri
    for (const o of [[-0.36, 0.40, 0.46], [0.38, 0.46, 0.50]]) {
      const x = cx + o[0] * R, y = cy + o[1] * R, r = o[2] * R;
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, '#ff6f82'); g.addColorStop(0.5, '#d8233f'); g.addColorStop(1, '#8e0d23');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.38, r * 0.22, r * 0.13, -0.5, 0, 7); ctx.fill();
    }
  } else {
    // hazelnut
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    g.addColorStop(0, '#e2a35e'); g.addColorStop(0.55, '#b9752f'); g.addColorStop(1, '#6d3f12');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx, cy - R * 0.92);
    ctx.bezierCurveTo(cx + R * 0.92, cy - R * 0.70, cx + R * 0.86, cy + R * 0.62, cx, cy + R * 0.90);
    ctx.bezierCurveTo(cx - R * 0.86, cy + R * 0.62, cx - R * 0.92, cy - R * 0.70, cx, cy - R * 0.92);
    ctx.closePath(); ctx.fill();
    // tudung
    ctx.fillStyle = '#7a4a18';
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.72, cy - R * 0.42);
    ctx.quadraticCurveTo(cx, cy - R * 1.22, cx + R * 0.72, cy - R * 0.42);
    ctx.quadraticCurveTo(cx, cy - R * 0.20, cx - R * 0.72, cy - R * 0.42);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = Math.max(1, R * 0.07);
    ctx.beginPath(); ctx.moveTo(cx - R * 0.22, cy - R * 0.05); ctx.lineTo(cx - R * 0.10, cy + R * 0.55); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.ellipse(cx - R * 0.34, cy + R * 0.10, R * 0.16, R * 0.09, -0.5, 0, 7); ctx.fill();
  }
  ctx.restore();
};

/* ============================================================
   BLOCKER
   ============================================================ */
art.drawIcing = function (ctx, layers, x, y, S) {
  const pad = S * 0.02;
  const shades = [null, '#eaf6ff', '#cfe8fb', '#aed6f4', '#8dbfe6', '#6ea6d4'];
  ctx.save();
  roundRect(ctx, x + pad, y + pad, S - pad * 2, S - pad * 2, S * 0.14);
  const g = ctx.createLinearGradient(x, y, x, y + S);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, shades[Math.min(5, layers)] || '#6ea6d4');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(120,170,205,0.95)'; ctx.lineWidth = Math.max(1.5, S * 0.035); ctx.stroke();
  // kristal es
  ctx.save();
  roundRect(ctx, x + pad, y + pad, S - pad * 2, S - pad * 2, S * 0.14); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = Math.max(1, S * 0.03);
  for (let i = 0; i < 3; i++) {
    const px = x + S * (0.25 + 0.25 * i), py = y + S * (0.30 + 0.2 * ((i * 7) % 3));
    for (let k = 0; k < 3; k++) {
      const a = k * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(px - Math.cos(a) * S * 0.11, py - Math.sin(a) * S * 0.11);
      ctx.lineTo(px + Math.cos(a) * S * 0.11, py + Math.sin(a) * S * 0.11);
      ctx.stroke();
    }
  }
  ctx.restore();
  // jumlah lapisan
  if (layers > 1) {
    ctx.fillStyle = 'rgba(30,70,110,0.9)';
    ctx.font = `800 ${Math.round(S * 0.34)}px ${CC.FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(layers, x + S / 2, y + S * 0.56);
  }
  ctx.restore();
};

art.drawChocolate = function (ctx, x, y, S, t) {
  const pad = S * 0.03;
  ctx.save();
  roundRect(ctx, x + pad, y + pad, S - pad * 2, S - pad * 2, S * 0.12);
  const g = ctx.createLinearGradient(x, y, x + S, y + S);
  g.addColorStop(0, '#8a5a30'); g.addColorStop(0.5, '#5e3615'); g.addColorStop(1, '#3a1f08');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#2a1505'; ctx.lineWidth = Math.max(1.5, S * 0.035); ctx.stroke();
  ctx.save();
  roundRect(ctx, x + pad, y + pad, S - pad * 2, S - pad * 2, S * 0.12); ctx.clip();
  // kotak-kotak cokelat
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(1, S * 0.035);
  ctx.beginPath(); ctx.moveTo(x + S / 2, y); ctx.lineTo(x + S / 2, y + S); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + S / 2); ctx.lineTo(x + S, y + S / 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,215,170,0.22)'; ctx.lineWidth = Math.max(1, S * 0.025);
  ctx.beginPath(); ctx.moveTo(x + S * 0.06, y + S * 0.08); ctx.lineTo(x + S * 0.44, y + S * 0.08); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + S * 0.56, y + S * 0.08); ctx.lineTo(x + S * 0.94, y + S * 0.08); ctx.stroke();
  ctx.restore();
  ctx.restore();
};

art.drawLiquorice = function (ctx, x, y, S, t) {
  const cx = x + S / 2, cy = y + S / 2, R = S * 0.40;
  ctx.save();
  ctx.fillStyle = 'rgba(40,16,60,0.28)';
  ctx.beginPath(); ctx.arc(cx, cy + R * 0.14, R, 0, 7); ctx.fill();
  const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
  g.addColorStop(0, '#5b5b66'); g.addColorStop(0.6, '#26262e'); g.addColorStop(1, '#0d0d12');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
  // pusaran putih
  ctx.strokeStyle = 'rgba(245,245,250,0.9)';
  ctx.lineWidth = Math.max(1.5, R * 0.17);
  ctx.beginPath();
  for (let i = 0; i <= 44; i++) {
    const a = i / 44 * Math.PI * 3.2;
    const rr = R * 0.12 + (i / 44) * R * 0.76;
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.ellipse(cx - R * 0.34, cy - R * 0.42, R * 0.22, R * 0.12, -0.5, 0, 7); ctx.fill();
  ctx.restore();
};

art.drawLock = function (ctx, cx, cy, S) {
  const R = S * 0.46;
  ctx.save();
  ctx.strokeStyle = '#20202a'; ctx.lineWidth = Math.max(2.5, S * 0.075);
  roundRect(ctx, cx - R, cy - R, R * 2, R * 2, S * 0.16); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, S * 0.025);
  roundRect(ctx, cx - R + S * 0.03, cy - R + S * 0.03, R * 2 - S * 0.06, R * 2 - S * 0.06, S * 0.14); ctx.stroke();
  // gembok
  ctx.fillStyle = '#d8c23a'; ctx.strokeStyle = '#7a650d'; ctx.lineWidth = Math.max(1, S * 0.02);
  roundRect(ctx, cx - S * 0.09, cy + R - S * 0.09, S * 0.18, S * 0.18, S * 0.04);
  ctx.fill(); ctx.stroke();
  ctx.restore();
};

art.drawMarmalade = function (ctx, cx, cy, S) {
  const R = S * 0.46;
  ctx.save();
  roundRect(ctx, cx - R, cy - R, R * 2, R * 2, S * 0.18);
  const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  g.addColorStop(0, 'rgba(255,196,80,0.55)');
  g.addColorStop(1, 'rgba(226,130,20,0.55)');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(255,230,160,0.9)'; ctx.lineWidth = Math.max(1.5, S * 0.04); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.ellipse(cx - R * 0.42, cy - R * 0.46, R * 0.26, R * 0.13, -0.5, 0, 7); ctx.fill();
  ctx.restore();
};

/* --- jelly di bawah petak --- */
art.drawJelly = function (ctx, layers, x, y, S, t) {
  const pad = S * 0.035, w = S - pad * 2;
  ctx.save();
  roundRect(ctx, x + pad, y + pad, w, w, S * 0.12);
  if (layers >= 2) {
    const g = ctx.createLinearGradient(x, y, x, y + S);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(214,226,255,0.88)');
    ctx.fillStyle = g;
  } else {
    const g = ctx.createLinearGradient(x, y, x, y + S);
    g.addColorStop(0, 'rgba(255,255,255,0.46)');
    g.addColorStop(1, 'rgba(190,215,255,0.40)');
    ctx.fillStyle = g;
  }
  ctx.fill();
  ctx.strokeStyle = layers >= 2 ? 'rgba(150,180,235,0.85)' : 'rgba(255,255,255,0.55)';
  ctx.lineWidth = Math.max(1, S * 0.03);
  ctx.stroke();
  // kilau jelly bergerak pelan
  ctx.save();
  roundRect(ctx, x + pad, y + pad, w, w, S * 0.12); ctx.clip();
  const sh = (Math.sin(t / 900 + (x + y) * 0.01) * 0.5 + 0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.beginPath();
  ctx.ellipse(x + S * (0.2 + 0.6 * sh), y + S * 0.25, S * 0.22, S * 0.10, -0.5, 0, 7);
  ctx.fill();
  ctx.restore();
  ctx.restore();
};

/* --- panah keluar bahan --- */
art.drawExit = function (ctx, x, y, S, t) {
  const cx = x + S / 2, cy = y + S / 2;
  const bob = Math.sin(t / 260) * S * 0.06;
  ctx.save();
  ctx.translate(0, bob);
  ctx.fillStyle = '#39c457'; ctx.strokeStyle = '#1b7a31';
  ctx.lineWidth = Math.max(1.5, S * 0.04);
  ctx.beginPath();
  ctx.moveTo(cx, cy + S * 0.30);
  ctx.lineTo(cx - S * 0.28, cy - S * 0.02);
  ctx.lineTo(cx - S * 0.12, cy - S * 0.02);
  ctx.lineTo(cx - S * 0.12, cy - S * 0.30);
  ctx.lineTo(cx + S * 0.12, cy - S * 0.30);
  ctx.lineTo(cx + S * 0.12, cy - S * 0.02);
  ctx.lineTo(cx + S * 0.28, cy - S * 0.02);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
};

/* ============================================================
   LATAR  —  gaya papercraft datar
   ============================================================ */
art.paintBackground = function (ctx, W, H) {
  // langit
  let g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#7ED4F2'); g.addColorStop(0.55, '#AEE8FA'); g.addColorStop(1, '#C9F0FF');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // matahari lembut
  const sg = ctx.createRadialGradient(W * 0.80, H * 0.10, 10, W * 0.80, H * 0.10, W * 0.42);
  sg.addColorStop(0, 'rgba(255,245,190,0.85)'); sg.addColorStop(1, 'rgba(255,245,190,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);

  // bukit jauh
  const hill = (yBase, amp, fill, line) => {
    ctx.beginPath();
    ctx.moveTo(-10, H);
    ctx.lineTo(-10, yBase);
    for (let x = -10; x <= W + 10; x += 12) {
      const y = yBase + Math.sin(x / (W / 3.1) * Math.PI) * -amp + Math.sin(x / 90) * amp * 0.12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W + 10, H); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = line; ctx.lineWidth = 3; ctx.stroke();
  };
  hill(H * 0.52, H * 0.10, '#F7B8D4', '#D2749F');
  hill(H * 0.63, H * 0.07, '#E890B8', '#B85A8C');

  // pohon lollipop
  const tree = (x, y, r, c1, c2) => {
    ctx.strokeStyle = '#F2E6D0'; ctx.lineWidth = r * 0.30; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + r * 2.4); ctx.stroke();
    ctx.strokeStyle = '#C9B38F'; ctx.lineWidth = r * 0.06;
    ctx.beginPath(); ctx.moveTo(x - r * 0.07, y + r * 0.3); ctx.lineTo(x - r * 0.07, y + r * 2.2); ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
    ctx.fillStyle = c1; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = c2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 0; k <= 10; k++) {
        const a = i * Math.PI / 3 + k / 10 * Math.PI / 3 + k * 0.10;
        ctx.lineTo(x + Math.cos(a) * r * (k / 10) * 1.6, y + Math.sin(a) * r * (k / 10) * 1.6);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = '#C04A7C'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  };
  tree(W * 0.10, H * 0.56, Math.min(34, W * 0.075), '#FFFFFF', '#FF6FA5');
  tree(W * 0.90, H * 0.60, Math.min(28, W * 0.062), '#FFFFFF', '#6FC7FF');
  tree(W * 0.26, H * 0.66, Math.min(22, W * 0.05), '#FFFFFF', '#FFD21C');

  // lapisan frosting bawah
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H * 0.80);
  for (let x = 0; x <= W; x += 10) ctx.lineTo(x, H * 0.80 + Math.sin(x / 70) * 12);
  ctx.lineTo(W, H); ctx.closePath();
  ctx.fillStyle = '#FFFFFF'; ctx.fill();
  ctx.strokeStyle = '#E0D4F0'; ctx.lineWidth = 3; ctx.stroke();
  // tetesan
  for (let i = 0; i < 9; i++) {
    const x = (i + 0.5) * W / 9, r = 9 + (i % 3) * 5;
    ctx.beginPath(); ctx.arc(x, H * 0.80 + Math.sin(x / 70) * 12 + r * 0.6, r, 0, 7);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.strokeStyle = '#E0D4F0'; ctx.lineWidth = 3; ctx.stroke();
  }

  // butiran kertas
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = i % 2 ? '#000' : '#fff';
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;
};

/* ============================================================
   IKON BOOSTER
   ============================================================ */

/* Palu lolipop: gagang kayu + kepala lolipop bergaris pusar */
art.drawHammerIcon = function (ctx, S) {
  const cx = S*0.50, cy = S*0.50;
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(-0.42); ctx.translate(-cx, -cy);

  // gagang
  const hx = cx + S*0.03;
  const g = ctx.createLinearGradient(hx - S*0.07, 0, hx + S*0.07, 0);
  g.addColorStop(0, '#fff4df'); g.addColorStop(.5, '#f0dfc0'); g.addColorStop(1, '#c9ac82');
  ctx.fillStyle = g;
  roundRect(ctx, hx - S*0.065, cy - S*0.05, S*0.13, S*0.46, S*0.06);
  ctx.fill();
  ctx.strokeStyle = '#a4875d'; ctx.lineWidth = Math.max(1, S*0.022); ctx.stroke();

  // kepala palu
  const hy = cy - S*0.16, R = S*0.30;
  ctx.fillStyle = 'rgba(40,16,60,0.28)';
  ctx.beginPath(); ctx.arc(cx, hy + S*0.035, R, 0, 7); ctx.fill();
  const hg = ctx.createRadialGradient(cx - R*0.35, hy - R*0.4, R*0.1, cx, hy, R);
  hg.addColorStop(0, '#ff8ca0'); hg.addColorStop(.55, '#e8344e'); hg.addColorStop(1, '#8e0f2a');
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(cx, hy, R, 0, 7); ctx.fill();

  // pusaran putih
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, hy, R*0.97, 0, 7); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(1.6, R*0.26);
  ctx.beginPath();
  for (let i=0;i<=40;i++){
    const a = i/40 * Math.PI * 2.9, rr = R*0.10 + (i/40)*R*0.88;
    const x = cx + Math.cos(a)*rr, y = hy + Math.sin(a)*rr;
    i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#8e0f2a'; ctx.lineWidth = Math.max(1.2, S*0.025);
  ctx.beginPath(); ctx.arc(cx, hy, R, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.ellipse(cx - R*0.34, hy - R*0.44, R*0.24, R*0.13, -0.5, 0, 7); ctx.fill();
  ctx.restore();
};

/* Tukar bebas: dua permen dengan panah melingkar */
art.drawSwitchIcon = function (ctx, S) {
  const r = S*0.19;
  const put = (x, y, def) => {
    ctx.save();
    ctx.fillStyle = 'rgba(40,16,60,0.26)';
    ctx.beginPath(); ctx.arc(x, y + r*0.2, r, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(x - r*0.35, y - r*0.4, r*0.1, x, y, r);
    g.addColorStop(0, def[0]); g.addColorStop(.55, def[1]); g.addColorStop(1, def[2]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = def[2]; ctx.lineWidth = Math.max(1, S*0.022); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.ellipse(x - r*0.33, y - r*0.4, r*0.26, r*0.14, -0.5, 0, 7); ctx.fill();
    ctx.restore();
  };
  put(S*0.30, S*0.68, ['#8ad0ff','#2E9BE8','#0E5496']);
  put(S*0.70, S*0.32, ['#ffb0bd','#E8344E','#8E0F2A']);

  // dua panah melengkung
  ctx.save();
  ctx.strokeStyle = '#FFD21C'; ctx.lineWidth = Math.max(2, S*0.075);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const arrow = (x1,y1,x2,y2,cxp,cyp,ax,ay,a1,a2) => {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(cxp,cyp,x2,y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2,y2);
    ctx.lineTo(x2 + Math.cos(a1)*ax, y2 + Math.sin(a1)*ay);
    ctx.moveTo(x2,y2);
    ctx.lineTo(x2 + Math.cos(a2)*ax, y2 + Math.sin(a2)*ay);
    ctx.stroke();
  };
  const t = S*0.13;
  arrow(S*0.26, S*0.44, S*0.60, S*0.18, S*0.26, S*0.18, t, t, 2.5, 4.1);
  arrow(S*0.74, S*0.56, S*0.40, S*0.82, S*0.74, S*0.82, t, t, -0.6, 0.95);
  ctx.restore();
};

CC.FONT = '"Baloo 2",ui-rounded,"SF Pro Rounded","Segoe UI",system-ui,sans-serif';

})(window.CC = window.CC || {});
