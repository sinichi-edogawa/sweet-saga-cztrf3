# Sweet Saga — cara memainkannya di iPhone

## ✅ Sudah online di sini

**https://sinichi-edogawa.github.io/sweet-saga-cztrf3/**

Buka alamat itu di **Safari** di iPhone → tombol **Bagikan** → **Add to Home Screen**.
Jadi ikon aplikasi, layar penuh, dan **jalan tanpa internet** setelah dibuka sekali.
PC tidak perlu menyala.

Untuk memperbarui setelah kodenya diubah:

```
git add -A
git commit -m "pesan perubahan"
git push
```

Tunggu ±1 menit, lalu di iPhone tutup aplikasinya dari app switcher dan buka lagi.

---

Cara-cara lain di bawah ini sudah tidak diperlukan, tapi dibiarkan sebagai cadangan.

---

## 1. Lewat Wi-Fi rumah (PC harus nyala) — paling cepat dicoba

1. Dobel-klik **`Server untuk iPhone.cmd`** di folder ini.
   Jendela hitam akan muncul dan menampilkan alamat, misalnya:

   ```
   http://192.168.68.56:8080
   ```

2. Pastikan iPhone tersambung ke **Wi-Fi yang sama** dengan PC.
3. Buka **Safari** di iPhone, ketik alamat tadi.
4. Tekan tombol **Bagikan** (kotak dengan panah ke atas) →
   **Add to Home Screen** / **Tambah ke Layar Utama**.

Sekarang ada ikon permen di layar utama iPhone, dibuka tanpa address bar Safari
(layar penuh seperti aplikasi beneran).

Untuk menghentikan server: tekan `Ctrl + C` di jendela hitam, atau tutup saja.

> Catatan: cara ini butuh PC menyala. Kalau PC dimatikan, ikonnya masih ada
> tapi permainannya tidak bisa dibuka.

---

## 2. Diunggah ke internet — bisa dimainkan kapan saja, juga offline

Supaya tidak bergantung pada PC, unggah folder ini ke hosting statis gratis.
Setelah online, **service worker** akan menyimpan permainan di iPhone, jadi
sesudah dibuka sekali permainan tetap jalan walau tanpa sinyal.

Pilihan termudah:

**GitHub Pages**
1. Buat akun di github.com, lalu buat repository baru (centang *Public*).
2. Unggah semua isi folder ini (`index.html`, `css/`, `js/`, `icons/`,
   `manifest.webmanifest`, `sw.js`).
3. Masuk **Settings → Pages**, bagian *Source* pilih branch `main`, folder `/ (root)`.
4. Tunggu ±1 menit, akan muncul alamat seperti
   `https://namakamu.github.io/sweet-saga/`
5. Buka alamat itu di Safari iPhone → **Add to Home Screen**.

**Cloudflare Pages** (alternatif, bisa seret-lepas folder tanpa Git)
- Masuk ke `pages.cloudflare.com` → *Create a project* → *Direct Upload* →
  seret folder ini. Hasilnya alamat `https://...pages.dev`.

Keduanya gratis dan pakai `https`, yang memang disyaratkan iPhone supaya
mode offline aktif.

---

## 3. Satu berkas, dikirim langsung ke iPhone

Berkas **`SweetSaga.html`** (±166 KB) sudah berisi semuanya — gambar, suara,
semua level — tanpa perlu berkas lain.

Cara mengirim, pilih salah satu:
- **iCloud Drive** → taruh berkasnya di iCloud dari PC, buka lewat app *Files* di iPhone.
- **Email ke diri sendiri** → buka lampirannya di iPhone.
- **WhatsApp / Telegram ke diri sendiri** → ketuk berkasnya.

Lalu di app *Files*: ketuk berkasnya → ketuk **Bagikan** → **Safari**
(atau tahan lalu pilih *Quick Look* → *Buka di Safari*).

> Kekurangan cara ini: tidak bisa dipasang sebagai ikon di layar utama,
> dan harus dibuka ulang lewat app Files setiap kali mau main.

---

## Kalau iPhone tidak bisa membuka alamatnya (cara 1)

- Pastikan keduanya benar-benar di Wi-Fi yang sama (bukan salah satunya pakai data seluler).
- Matikan **Private Wi-Fi Address** di iPhone untuk jaringan itu
  (Settings → Wi-Fi → ketuk ⓘ di sebelah nama jaringan).
- Beberapa Wi-Fi publik/kos memblokir perangkat saling terhubung — coba pakai
  hotspot dari iPhone, lalu sambungkan PC ke hotspot itu, dan pakai alamat baru
  yang muncul di jendela hitam.
- Kalau Windows menampilkan kotak **Windows Defender Firewall**, pilih
  **Allow access** / **Izinkan akses**.

---

## Menyusun ulang berkas setelah ada perubahan kode

```
node tools\icons.js     # bikin ulang ikon aplikasi
node tools\build.js     # bikin ulang SweetSaga.html (versi satu berkas)

node _test\rules.js     # uji aturan permainan (24 uji)
node _test\gen.js       # periksa struktur seluruh 10.000 level
node _test\harness.js   # mainkan 20 level buatan tangan sampai tuntas
node _test\diag.js 4158 # bedah satu level: papan + jejak bahan per langkah

:: mainkan level tertentu dengan bot penguji
set LEVELS=500,2500,7777 && node _test\harness.js
```

## Booster

Dua tombol di bawah papan:

- **Palu lolipop** — ketuk tombolnya, lalu ketuk satu petak untuk dihancurkan.
  Memicu permen spesial, mengupas icing/cokelat/licorice, membuka gembok, dan
  memecah jelly di bawahnya. Tidak memakai langkah. Bahan tidak bisa dipalu.
- **Tukar bebas** — ketuk tombolnya, lalu ketuk dua permen bersebelahan untuk
  ditukar walau tidak membentuk match. Tidak memakai langkah. Sesuai aslinya,
  permen spesial **tidak** ikut meledak lewat cara ini.

Ketuk tombol booster lagi untuk membatalkan.

Mulai dengan 5 buah masing-masing. Tiap kali menamatkan level baru dapat tambahan
satu, dan tiga bintang pertama di sebuah level memberi sepasang bonus.

## Tentang 10.000 levelnya

Level 1–20 dibuat tangan sebagai perkenalan. Level 21 ke atas **dibuat otomatis**:
tiap nomor level jadi benih acak, jadi level 7.432 selalu menghasilkan papan yang
sama persis tiap kali dibuka — tanpa menyimpan 10.000 definisi.

Kesulitannya naik bertahap sampai sekitar level 900 lalu mendatar, dengan selingan
level "istirahat" tiap kelipatan 10 dan level sulit tiap kelipatan 25.
