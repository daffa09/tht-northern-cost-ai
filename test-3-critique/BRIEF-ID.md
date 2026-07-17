# Test 3 — Mengkritik sebuah RFC

Lo adalah seorang Senior AI Platform Engineer di Northern Coast Beverages. Seorang kandidat di peran lo sebelumnya menulis sebuah dokumen RFC (Request for Comments) tentang perubahan sistem *scoring* / kualifikasi lead kami (bernama Mary). RFC ini kebetulan udah disetujui (signed off) secara internal oleh Tech Lead-nya.

**Tugas lo:** baca RFC tersebut di `RFC-TO-CRITIQUE.md`, evaluasi isinya, dan tentukan apakah lo bakal menyetujui (approve) as-is, mengembalikan untuk direvisi (send back), atau ngeblokir/nolak (block). Pertahankan dan belain keputusan lo itu.

## Apa yang harus dikumpulkan

Satu file markdown di `submission/CRITIQUE.md`. File ini harus berisi kelima bagian di bawah ini.

### 1. Skor RFC-nya

Kasih nilai dari skala 5 (1-5) untuk dimensi-dimensi ini:
- **Problem framing (Pembingkaian masalah)** (1-5)
- **Evidence quality (Kualitas bukti)** (1-5)
- **Architectural fit (Kecocokan arsitektur)** (1-5)
- **Migration risk (Risiko migrasi)** (1-5)
- **Recommendation supportability (Dukungan pada rekomendasi)** (1-5)

Berikan 1 kalimat alasan singkat untuk setiap dimensi.

### 2. Load-bearing claims (Klaim-klaim penopang utama)

Identifikasi 3-5 klaim yang paling krusial di dalam RFC ini (yang kalau klaim ini salah, seluruh RFC-nya runtuh). Untuk setiap klaim, evaluasi apakah bukti yang dilampirkan benar-benar mendukung klaim tersebut. Kalau ternyata buktinya nggak mendukung, bilang dengan tegas.

### 3. Apa yang terlewatkan (What's missing)

Apa yang TIDAK dipertimbangkan oleh sang penulis? Sebutkan 2-3 pendekatan alternatif atau pertimbangan yang seharusnya mereka bahas. Jelaskan kenapa masing-masing hal tersebut penting.

### 4. Keputusan

Pilih salah satu dari: **approve / approve-with-revisions / block / send-back-to-author**. Jelaskan alasannya dalam ~200 kata.

Kalau lo nge-block atau send-back: apa hal spesifik yang harus diubah sebelum RFC ini bisa di-approve?

### 5. Pertanyaan Debrief

3-5 pertanyaan yang bakal lo tanyain ke si penulis di meeting *follow-up*. Pertanyaan-pertanyaan ini harus bisa ngungkapin apakah si penulis beneran engineer senior yang jago, atau cuma sekadar "ikut-ikutan nulis" (atau cuma *copy-paste* dari AI).

---

## Apa yang kami tes

Ini adalah tes **berpikir kritis (critical thinking)** — kemampuan lo buat membaca karya orang lain yang kedengarannya meyakinkan dan menemukan apa yang salah di dalamnya. Secara spesifik:
- Bisakah lo mengidentifikasi mana klaim yang krusial (load-bearing) dan mana yang cuma dekoratif?
- Bisakah lo sadar kalau bukti yang dikasih ternyata lebih lemah dari kesimpulan yang ditarik?
- Bisakah lo menyadari alternatif yang terlewatkan yang seharusnya dibahas oleh penulis?
- Bisakah lo *push back* (menolak/membantah) sebuah proposal yang kebetulan udah disetujui sama *leadership* (pimpinan)?

Kami TIDAK mengetes:
- Apakah lo setuju sama proposalnya (alasan approve yang berbobot sama kuatnya dengan alasan block yang berbobot)
- Apakah lo bisa nulis RFC yang lebih bagus (ini adalah tes kritik, bukan desain ulang)
- Apakah lo bisa menemukan *semua* kemungkinan masalah (kami lebih milih melihat 3 kritik tajam dan berbobot daripada 10 kritik yang ngambang/nggak jelas)

## Waktu

60-90 menit. Pake tools AI sebebasnya. Sinyalnya adalah apa yang lo suruh AI periksa, bukan apakah lo pake AI atau nggak.

## Catatan tentang konteks

Northern Coast adalah distributor minuman B2B fiktif. Insiden L009 yang direferensikan di dalam RFC adalah insiden betulan di sistem kami (sebuah "paus/whale yang terlewat" — sebuah lead yang awalnya diskor Warm di sentuhan pertama tapi ternyata *closing* jadi deal $500K). Anggap ini nyata untuk tujuan mengevaluasi logika dari RFC tersebut.
