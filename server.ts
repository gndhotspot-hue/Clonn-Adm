import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json());

  // Initialize the Gemini SDK Client with standard header and key
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API endpoint for generating Modul Ajar
  app.post('/api/generate-modul', async (req, res) => {
    try {
      const { subject, grade, topic, duration, targetAudience, teachingModel } = req.body;

      if (!subject || !grade || !topic) {
        return res.status(400).json({ error: 'Mata pelajaran, kelas, dan topik wajib diisi.' });
      }

      if (!apiKey) {
        return res.status(500).json({
          error: 'Kunci API Gemini (GEMINI_API_KEY) belum terpasang di sistem. Silakan hubungi Administrator untuk mendaftarkan API Key di panel Settings > Secrets.'
        });
      }

      // Generate content prompt
      const prompt = `
Generate a highly detailed, professional, and ready-to-use Teaching Module (Modul Ajar) in Indonesian Language for the "Kurikulum Merdeka" (Indonesian curriculum) matching the following details:

- Mata Pelajaran: ${subject}
- Kelas: ${grade}
- Topik / Materi Pembelajaran: ${topic}
- Alokasi Waktu: ${duration || '2 JP x 35 Menit'}
- Target Peserta Didik: ${targetAudience || 'Reguler / Umum'}
- Model Pembelajaran: ${teachingModel || 'Problem Based Learning (PBL)'}

Please format the module perfectly using Markdown syntax and include these exact sections:

# MODUL AJAR KURIKULUM MERDEKA

## 1. INFORMASI UMUM
- **Identitas Penulis**: Penyusun: Guru ${grade}, Sekolah: SD Negeri Cimandirasa, Tahun Ajaran 2026/2027
- **Kompetensi Awal**: Deskripsikan apa yang harus dipahami siswa sebelum materi ini.
- **Profil Pelajar Pancasila**: Sebutkan profil yang relevan (misal: Beriman & Bertakwa, Mandiri, Bernalar Kritis, Gotong Royong, Kreatif) dan bagaimana perwujudannya dalam KBM ini.
- **Sarana dan Prasarana**: Media pembelajaran, alat, bahan, dan sumber belajar yang relevan.
- **Target Peserta Didik**: ${targetAudience}
- **Model Pembelajaran**: ${teachingModel}

## 2. KOMPONEN INTI
- **Tujuan Pembelajaran (TP)**: Jabarkan tujuan pembelajaran yang spesifik, terukur, dan berorientasi pada murid.
- **Pemahaman Bermakna**: Manfaat praktis dari materi ini dalam kehidupan sehari-hari siswa.
- **Pertanyaan Pemantik**: Pertanyaan pematik yang merangsang rasa ingin tahu siswa di awal pelajaran.
- **Kegiatan Pembelajaran (Skenario Langkah-Langkah)**:
  - **Kegiatan Pendahuluan (10-15 menit)**: Berdoa, absensi, apersepsi, penyampaian tujuan & pertanyaan pemantik.
  - **Kegiatan Inti (Sesuai Sintaks model ${teachingModel})**: Langkah-langkah detail, pembagian kelompok, diskusi, presentasi, dan bimbingan guru.
  - **Kegiatan Penutup (10-15 menit)**: Kesimpulan bersama, evaluasi/refleksi, tindak lanjut, dan doa penutup.
- **Asesmen (Penilaian)**:
  - Asesmen Diagnostik (Sebelum pembelajaran)
  - Asesmen Formatif (Selama pembelajaran, misal: observasi, lembar kerja kelompok)
  - Asesmen Sumatif (Akhir pembelajaran, misal: tes tertulis/pilihan ganda/uraian)
- **Pengayaan & Remedial**: Program pengayaan untuk siswa berprestasi, dan program remedial untuk siswa lambat belajar.
- **Refleksi Guru & Peserta Didik**: Pertanyaan refleksi untuk mengukur efektivitas mengajar dan pemahaman murid.

## 3. LAMPIRAN
- **Lembar Kerja Peserta Didik (LKPD)**: Buat rancangan LKPD yang aplikatif (ada tugas kelompok/individu, petunjuk pengerjaan, dan tempat menuliskan hasil).
- **Bahan Bacaan Guru & Peserta Didik**: Ringkasan materi pendukung pelajaran yang informatif dan ringkas.
- **Glosarium**: Daftar istilah penting beserta penjelasannya.
- **Daftar Pustaka**: Referensi buku atau sumber belajar digital yang relevan.

Ensure the content is highly comprehensive, engaging, culturally and cognitively appropriate for Elementary School (SD) students, and written in a supportive, professional pedagogical tone. Do not truncate the response; write complete sections.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const generatedText = response.text;
      res.json({ result: generatedText });
    } catch (error: any) {
      console.error('Error generating teaching module:', error);
      res.status(500).json({ error: error.message || 'Gagal merancang modul ajar otomatis dari asisten AI.' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite dev middleware loaded.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static files server loaded from /dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express Full-stack server active at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start full-stack server:', err);
});
