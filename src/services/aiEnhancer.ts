/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ColorStyle } from '../types/camera';
import {
  ColorGradingParams,
  AiEnhancementResult,
  buildAiGradingLut,
  computeAdaptiveAiParams,
} from '../utils/aiGrading';
import { computeHistogram } from '../utils/histogram';

export interface EnhancedPhotoResult {
  enhancedDataUrl: string;
  enhancedBlob: Blob;
  aiPresetName: string;
  sceneClassification: string;
  exposureAssessment: string;
  critiqueNotes: string;
  suggestedEvAdjustment: number;
  colorGrading: ColorGradingParams;
  isAiServerPowered: boolean;
}

/**
 * Enhances an input photo (from dataUrl or Image) using Gemini AI
 * with fallback to local Adaptive Neural Color Engine
 */
export async function enhancePhotoWithAi(
  sourceDataUrl: string,
  style: ColorStyle | 'AIMaster',
  evCompensation: number = 0,
  userNotes?: string
): Promise<EnhancedPhotoResult> {
  let aiData: AiEnhancementResult | null = null;
  let isAiServerPowered = false;

  // 1. Prepare compact analysis payload (< 640px) for high-speed network transmission
  let analysisPayload = sourceDataUrl;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Image load failed'));
      i.src = sourceDataUrl;
    });

    const maxDim = 640;
    if (img.width > maxDim || img.height > maxDim) {
      const scale = maxDim / Math.max(img.width, img.height);
      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = Math.round(img.width * scale);
      smallCanvas.height = Math.round(img.height * scale);
      const sCtx = smallCanvas.getContext('2d');
      if (sCtx) {
        sCtx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
        analysisPayload = smallCanvas.toDataURL('image/jpeg', 0.85);
      }
    }
  } catch {
    // Keep sourceDataUrl if downscale fails
  }

  // 2. Attempt server-side Gemini enhancement with 3500ms timeout
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('/api/ai/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        imageBase64: analysisPayload,
        style,
        evCompensation,
        prompt: userNotes,
      }),
    });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        aiData = json.data;
        isAiServerPowered = true;
      }
    }
  } catch (err) {
    console.warn('Server Gemini API unreachable/timeout, using local AI tone engine:', err);
  }

  // Load image to apply grading pixels
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Gagal memuat citra untuk pemrosesan AI'));
    i.src = sourceDataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas context gagal diinisialisasi');
  }

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imgData.data;

  // 2. If Gemini API was not available, compute adaptive AI parameters locally
  if (!aiData) {
    const hist = computeHistogram(pixels, 4);
    const grading = computeAdaptiveAiParams(
      hist.meanLuminance,
      hist.shadowClippingPercent,
      hist.highlightClippingPercent,
      style === 'AIMaster' ? 'Natural' : style
    );

    aiData = {
      sceneClassification:
        hist.meanLuminance > 160
          ? 'Pemandangan Terang (High Key)'
          : hist.meanLuminance < 90
          ? 'Pemandangan Rendah Cahaya (Low Key)'
          : 'Pemandangan Kontras Seimbang',
      exposureAssessment: hist.exposureRecommendation,
      suggestedEvAdjustment: hist.exposureState === 'Under' ? 0.5 : hist.exposureState === 'Over' ? -0.5 : 0.0,
      critiqueNotes:
        'Tonalitas gambar ditingkatkan dengan kurva kompensasi bayangan cerdas dan saturasi terlindung.',
      aiPresetName:
        style === 'Hangat'
          ? 'AquaTone AI Golden Hour'
          : style === 'Mono'
          ? 'AquaTone AI Noir Film'
          : 'AquaTone AI Master Grade',
      colorGrading: grading,
    };
  }

  // 3. Apply AI Color Grading Lookup Tables to the image
  const targetStyle = style === 'AIMaster' ? 'Natural' : style;
  const { lutR, lutG, lutB } = buildAiGradingLut(aiData.colorGrading, targetStyle);

  const isMono = targetStyle === 'Mono';

  for (let i = 0; i < pixels.length; i += 4) {
    if (isMono) {
      const lum = (pixels[i] * 54 + pixels[i + 1] * 183 + pixels[i + 2] * 19) >> 8;
      const graded = lutR[lum];
      pixels[i] = graded;
      pixels[i + 1] = graded;
      pixels[i + 2] = graded;
    } else {
      pixels[i] = lutR[pixels[i]];
      pixels[i + 1] = lutG[pixels[i + 1]];
      pixels[i + 2] = lutB[pixels[i + 2]];
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const enhancedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Gagal mengekspor JPEG'))),
      'image/jpeg',
      0.96
    );
  });

  const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.96);

  return {
    enhancedDataUrl,
    enhancedBlob,
    aiPresetName: aiData.aiPresetName,
    sceneClassification: aiData.sceneClassification,
    exposureAssessment: aiData.exposureAssessment,
    critiqueNotes: aiData.critiqueNotes,
    suggestedEvAdjustment: aiData.suggestedEvAdjustment,
    colorGrading: aiData.colorGrading,
    isAiServerPowered,
  };
}
