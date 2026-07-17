# WhatsApp at Scale — Rekomendasi Arsitektur

## 1. Rekomendasi

Migrasikan nomor BSD Utama ke **WhatsApp Business Platform (Cloud API)** via **[360dialog](https://www.360dialog.com/)** sebagai BSP (Business Solution Provider). Untuk keempat nomor KAM, aktifkan fitur **WhatsApp Coexistence** — ini adalah fitur resmi yang didukung Meta yang memungkinkan sebuah nomor berjalan secara bersamaan di aplikasi native WhatsApp Business App (WAB) di HP dan juga terhubung ke Cloud API. Dengan ini, para KAM tetap menggunakan HP mereka persis seperti biasa. Semua data percakapan dari ke-5 nomor tersebut akan mengalir lewat *webhooks* langsung masuk ke CDP milik kita sendiri. Tidak ada inbox SaaS, tidak butuh tool desktop agent, dan tidak ada paksaan yang membuat KAM harus ninggalin HP mereka.

---

## 2. Load-Bearing Constraints (Batasan Utama)

Ini adalah batasan-batasan nyata yang mengeleminasi opsi-opsi lain (bukan sekadar preferensi).

| Constraint (Batasan) | Menseleminasi (Opsi yang Ditolak) |
|---|---|
| KAM harus tetap pakai aplikasi WAB di HP mereka | Semua arsitektur "shared-inbox" yang mewajibkan agen buka desktop (e.g. Zendesk, Trengo, respond.io, Front) |
| Kita harus memiliki data percakapan seutuhnya | Layanan SaaS Inbox tertutup yang menyimpan percakapan di database/UI mereka sendiri (Wati, AiSensy) |
| Skalabilitas hingga 10K outbound/hari | Aplikasi mobile WhatsApp Business biasa (karena nggak punya API) |
| Dilarang pakai tools unofficial/scraping | Baileys, whatsapp-web.js — karena melanggar TOS Meta, ada risiko nomor diblokir permanen |

Constraint (batasan) soal KAM ini adalah batasan yang paling krusial. Ini langsung menggugurkan jawaban standar *enterprise* — "satu nomor + shared inbox + routing agen" — karena opsi itu bakal maksa KAM pakai *workflow* di desktop. **Coexistence** adalah satu-satunya cara bersih buat mempertahankan gaya kerja KAM di HP sambil tetap dapet akses API di nomor yang sama.

---

## 3. Jalur Vendor & Arsitektur

**BSP:** [360dialog](https://www.360dialog.com/) — Ini BSP resmi Meta, memberikan akses *raw webhook*, gak maksa kita langganan produk inbox mereka, dan yang paling penting: mendukung Coexistence.
**Harga:** Langganan sekitar €49–€299/bulan (tergantung tier kecepatan/throughput) + biaya per-pesan Meta diteruskan tanpa markup/biaya tambahan. Referensi: [Harga 360dialog](https://www.360dialog.com/pricing).

**Arsitektur (Total 5 nomor):**

```text
[Nomor BSD Utama] — Murni Cloud API via 360dialog
    ↓ 10K blast outbound/hari
    ↓ Triage AI untuk inbound
    ↓ Kalau kualifikasi masuk → kirim link wa.me/NOMOR_KAM ke lead
    
[Nomor KAM 1–4] — WhatsApp Coexistence via 360dialog
    ↓ KAM tetep pakai aplikasi native WAB di iPhone mereka, gak berubah
    ↓ Setiap pesan yang mereka kirim/terima men-trigger webhook Message Echo
    ↓ Webhook → masuk ke CDP Kita (data dimiliki, bisa di-query, bukan disewa)
```

**Fakta-fakta kunci yang diverifikasi dari dokumen 360dialog ([docs.360dialog.com](https://docs.360dialog.com)):**
- Coexistence bekerja pakai fitur "message echoes" — pesan di aplikasi WAB di-mirror (dipantulkan) ke webhook API secara real time.
- Butuh pendaftaran lewat proses Embedded Signup di portal 360dialog + harus pake versi aplikasi WAB terbaru (minimal 2.24.17+).
- ⚠️ **Keterbatasan Penting:** Akun dengan status OBA (Official Business Account / Centang Biru) **TIDAK DIDUKUNG** untuk menggunakan nomor Coexistence. Nomor KAM yang punya status OBA harus mendaftar program *Meta Verified for Business* sebagai gantinya.

---

## 4. Rencana Pilot Defensif (Defensive Pilot Plan)

**Tujuan:** Membuktikan bahwa fitur Coexistence beneran jalan sebelum kita mengotak-atik nomor asli milik KAM.
**Batas Budget:** Sekitar ~€500 (biaya SIM card nomor tes + langganan 360dialog Regular + pesan API untuk 2 minggu)
**Timeline:** 14 hari

| Hari | Aksi | Sinyal Keberhasilan |
|---|---|---|
| 1–3 | Siapin satu nomor tes baru. Instal aplikasi WAB di HP cadangan. | Aplikasi jalan, nomor aktif. |
| 4–7 | Jalankan Embedded Signup di 360dialog untuk mengaktifkan Coexistence di nomor tes tersebut. | Webhook nerima *message echo* pas kita ngirim pesan dari HP fisik tersebut. |
| 8–10 | Set up WABA Nomor BSD Utama. Tes 100-pesan outbound batch. Verifikasi delivery rate. | Delivery ≥95%, kualitas rating tetep bagus (nggak ke-flag). |
| 11–14 | End-to-end test: BSD bot terima lead → kirim link wa.me → lead klik dan buka chat sama KAM → KAM balas dari HP → webhook nangkep pesan balasan tersebut di CDP tes. | Alur (loop) penuh berjalan lancar tanpa memaksa KAM lepas dari HP. |

**Kriteria Batal (Kill criteria):** Kalau *message echoes* gagal nangkap >5% payload pesan, atau kalau aplikasi WAB di HP ter-logout paksa saat proses signup Coexistence — batalkan jalur ini dan pindah ke opsi fallback (shared inbox yang di-host BSP), dengan konsekuensi kita harus memaksa KAM buat adaptasi *workflow*.

---

## 5. Phase 1 — 30 Hari Pertama Pasca-Pilot

| Minggu | Apa yang Dirilis (Ships) | Apa yang Tetap Manual |
|---|---|---|
| 1 | Pipa webhook 360dialog → ke CDP production. Skema database: `contact`, `message`, `kam_assignment` | Logika routing KAM (assignment masih manual). |
| 2 | Nomor BSD Utama migrasi dari ManyChat → 360dialog WABA. Bot triage AI live untuk nangani inbound. | Handoff ke KAM masih pake link `wa.me` manual sementara waktu. |
| 3 | Aktivasi Coexistence untuk KAM 1 + KAM 2. Data mulai masuk ke CDP. | KAM 3 + 4 masih pakai setup lama (belum migrasi). |
| 4 | Aktivasi KAM 3 + 4. Volume outbound mulai digenjot: 2K → 5K → 10K/hari. | Template bervolume tinggi masih nunggu disetujui Meta. |

**Kriteria Penerimaan (Acceptance criteria) di akhir Phase 1:** Ke-4 nomor KAM udah keliatan di CDP dengan webhook latency <5 detik. Outbound berhasil menyentuh 10K/hari dengan rating kualitas tetep "Green" (Bagus).

---

## 6. Apa yang Bakal Gue Verifikasi Sebelum Teken Kontrak

Tiga hal yang nggak bisa dipastiin dalam riset 1 jam dan butuh konfirmasi nyata dari 360dialog:

1. **Ketersediaan regional Coexistence** — Apakah fitur ini tersedia di semua 60+ negara asal leads kita, atau cuma di pasar-pasar tertentu? Butuh konfirmasi hitam di atas putih, bukan janji sales.
2. **SLA Latency Message Echo** — Apakah ada garansi seberapa cepat pesan dari aplikasi WAB nyampe ke webhook? Kalau sistemnya "batched" (misal, cuma dikirim per 30 detik), maka impian pakai AI buat bikin draft balasan secara real-time ke KAM bakal gak praktis.
3. **Dampak OBA pada nomor KAM** — Kalau ada nomor KAM yang saat ini udah punya status OBA / centang biru, bagaimana jalur migrasinya untuk tetap mempertahankan kredibilitas bisnis tanpa centang biru tersebut?

---

## 7. Opsi yang Dipertimbangkan dan Ditolak

**Jalur A: Gabungkan ke satu nomor WABA + Shared Inbox (misal: respond.io mobile app, Trengo)**
- Opsi standar yang paling direkomendasikan. Bagus kalau para agennya fleksibel.
- *Kenapa ditolak:* Para KAM kita TIDAK AKAN MAU pakai aplikasi desktop/pihak ketiga. Constraint (batasan) ini gak bisa ditawar. Jalur ini bakal langsung gagal total sebelum dimulai.

**Jalur B: Scraping otomatisasi WhatsApp Web (Baileys / whatsapp-web.js) di HP KAM**
- Secara teknis bisa nangkap data tanpa ngubah pengalaman pengguna (KAM).
- *Kenapa ditolak:* Secara terang-terangan melanggar TOS Meta. Pada volume yang kita targetkan, risiko nomor kena ban permanen sangat tinggi. Kehilangan nomor WA milik seorang KAM di tengah nego deal bisa membunuh kontrak senilai $100K. Profil risikonya tidak dapat diterima.

---

## 8. Di Mana Gue Percaya AI vs Kapan Gue Membantahnya (Override)

**Di mana AI salah (dan pede banget pas jawab):** Saat di-prompt, baik Claude maupun Gemini langsung menyarankan buat memusatkan semuanya ke satu nomor WABA dengan shared inbox, dan mereka bilang bahwa "Aplikasi WhatsApp Business dan Cloud API TIDAK BISA digunakan di nomor yang sama secara bersamaan." Pernyataan ini sudah kuno — ini bener di masa lalu, tapi salah sejak Meta ngerilis fitur Coexistence.

**Di mana gue override:** Gue membantah klaim AI tersebut, mencari dokumentasi Meta dan BSP terbaru, dan menemukan bahwa Coexistence sekarang adalah fitur resmi dan *production-ready* yang di-*support* oleh 360dialog. Seluruh arsitektur yang gue saranin di atas dibangun berdasarkan koreksi (override) ini.

**Di mana gue percaya AI:** Untuk struktur umum mengenai *messaging tiers* WhatsApp (Tier 1 = 1K/hari, Tier 2 = 10K/hari), syarat Verifikasi Bisnis Meta, dan struktur payload webhook—semuanya konsisten dengan dokumentasi resmi Meta sehingga gue nggak nge-override bagian-bagian itu.
