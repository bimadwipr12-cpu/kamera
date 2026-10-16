/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware for parsing JSON payloads (supporting base64 images up to 25MB)
app.use(express.json({ limit: '25mb' }));

// Shared Gemini Client on server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health & AI status check
app.get('/api/ai/status', (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  res.json({
    status: 'ok',
    aiAvailable: hasKey,
    model: 'gemini-3.8-flash',
  });
});

// AI Photographic Image Analysis & Studio Color Grading endpoint
app.post('/api/ai/enhance', async (req: Request, res: Response) => {
  try {
    const { imageBase64, style = 'Natural', evCompensation = 0, prompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 parameter diperlukan.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di server.',
        fallbackAvailable: true,
      });
    }

    // Extract raw base64 string
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const systemInstruction = `Anda adalah kepala colorist & insinyur fotografi digital untuk sensor 1 inci Sharp AQUOS R7s.
Tugas Anda adalah menganalisis tangkapan foto, mengevaluasi distribusi histogram, kontras, saturasi, dan menghasilkan instruksi color grading studio presisi untuk mempercantik kualitas gambar.
Gaya yang dipilih: ${style}. Kompensasi EV pengguna: ${evCompensation} EV.
Berikan respons dalam format JSON terstruktur.`;

    const userPrompt = `Analisis foto ini dan hasilkan parameter grading warna studio AI untuk memaksimalkan tonalitas warna, detail bayangan, dan retensi highlight. ${
      prompt ? `Catatan pengguna: ${prompt}` : ''
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
          { text: userPrompt },
        ],
      },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sceneClassification: {
              type: Type.STRING,
              description: 'Klasifikasi adegan, misal: Lanskap Senja, Potret Wajah, Arsitektur Kontras',
            },
            exposureAssessment: {
              type: Type.STRING,
              description: 'Evaluasi eksposur dan kecerahan berdasarkan histogram visual',
            },
            suggestedEvAdjustment: {
              type: Type.NUMBER,
              description: 'Rekomendasi penyesuaian EV (-1.0 hingga +1.0)',
            },
            critiqueNotes: {
              type: Type.STRING,
              description: 'Saran singkat untuk fotografer dalam Bahasa Indonesia',
            },
            aiPresetName: {
              type: Type.STRING,
              description: 'Nama preset AI khusus yang dihasilkan, misal: AquaTone Master Glow',
            },
            colorGrading: {
              type: Type.OBJECT,
              properties: {
                shadowLift: {
                  type: Type.NUMBER,
                  description: 'Peningkatan detail bayangan (-50 hingga +50)',
                },
                highlightCompression: {
                  type: Type.NUMBER,
                  description: 'Kompresi sorotan agar tidak pecah/blown (-50 hingga +50)',
                },
                warmthOffset: {
                  type: Type.NUMBER,
                  description: 'Penyesuaian suhu warna hangat/dingin (-30 hingga +30)',
                },
                saturationMultiplier: {
                  type: Type.NUMBER,
                  description: 'Pengali vibrance saturasi warna (0.8 hingga 1.5)',
                },
                contrastFactor: {
                  type: Type.NUMBER,
                  description: 'Faktor kurva kontras S-curve (0.8 hingga 1.4)',
                },
                sharpnessBonus: {
                  type: Type.NUMBER,
                  description: 'Tingkat ketajaman mikro (0 hingga 20)',
                },
              },
              required: [
                'shadowLift',
                'highlightCompression',
                'warmthOffset',
                'saturationMultiplier',
                'contrastFactor',
                'sharpnessBonus',
              ],
            },
          },
          required: [
            'sceneClassification',
            'exposureAssessment',
            'suggestedEvAdjustment',
            'critiqueNotes',
            'aiPresetName',
            'colorGrading',
          ],
        },
      },
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Server AI Enhancement Error:', error);
    return res.status(500).json({
      error: error.message || 'Gagal memproses peningkatan AI.',
      fallbackAvailable: true,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AquaTone Camera Full-Stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
