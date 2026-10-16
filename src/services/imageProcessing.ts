/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ColorStyle } from '../types/camera';
import {
  applyColorProfileToRgb,
  computeSharpnessScore,
  evToBrightnessMultiplier,
} from '../utils/cameraLogic';

export interface ProcessedCaptureResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  fileSizeBytes: number;
  saveDurationMs: number;
  sharpnessScore: number;
}

/**
 * Processes an input video or image canvas into a finished JPEG photo
 * with EV compensation, 1x/2x zoom crop, and Natural/Hangat/Mono color profile.
 */
export async function processCameraCapture(
  source: HTMLVideoElement | HTMLCanvasElement,
  options: {
    style: ColorStyle;
    evCompensation: number;
    zoomFactor: number;
    targetWidth?: number;
    targetHeight?: number;
  }
): Promise<ProcessedCaptureResult> {
  const startTime = performance.now();

  const rawWidth = source instanceof HTMLVideoElement ? source.videoWidth || 1920 : source.width;
  const rawHeight = source instanceof HTMLVideoElement ? source.videoHeight || 1080 : source.height;

  // Sharp AQUOS R7s 1-inch sensor 12MP binning standard aspect ratio
  const outputWidth = options.targetWidth || (rawWidth > 0 ? rawWidth : 1920);
  const outputHeight = options.targetHeight || (rawHeight > 0 ? rawHeight : 1080);

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Gagal menginisialisasi context canvas pemrosesan gambar.');
  }

  // Handle zoom crop (CAM-05): zoomFactor = 1.0 or 2.0
  const zoom = Math.max(1.0, options.zoomFactor || 1.0);
  const cropWidth = rawWidth / zoom;
  const cropHeight = rawHeight / zoom;
  const cropX = (rawWidth - cropWidth) / 2;
  const cropY = (rawHeight - cropHeight) / 2;

  // Draw source cropped for digital zoom
  ctx.drawImage(source, cropX, cropY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);

  // Apply pixel-level color profile and EV compensation using fast Look-Up Tables (LUT)
  const imageData = ctx.getImageData(0, 0, outputWidth, outputHeight);
  const data = imageData.data;
  const evMult = evToBrightnessMultiplier(options.evCompensation);

  // Pre-compute 256-byte LUT for brightness and color transformation
  const lutR = new Uint8ClampedArray(256);
  const lutG = new Uint8ClampedArray(256);
  const lutB = new Uint8ClampedArray(256);

  for (let val = 0; val < 256; val++) {
    const adjusted = evMult === 1.0 ? val : Math.min(255, Math.max(0, Math.round(val * evMult)));
    const [finalR, finalG, finalB] = applyColorProfileToRgb(adjusted, adjusted, adjusted, options.style);
    lutR[val] = finalR;
    lutG[val] = finalG;
    lutB[val] = finalB;
  }

  const isMono = options.style === 'Mono';
  const edgeSamples: number[] = [];
  const sampleStride = Math.max(1, Math.floor(data.length / 4000));

  for (let i = 0; i < data.length; i += 4) {
    if (isMono) {
      // Fast integer luminance approximation (Rec. 709)
      const lum = (data[i] * 54 + data[i + 1] * 183 + data[i + 2] * 19) >> 8;
      const finalVal = lutR[lum];
      data[i] = finalVal;
      data[i + 1] = finalVal;
      data[i + 2] = finalVal;
      if (i % (sampleStride * 4) === 0) {
        edgeSamples.push(finalVal);
      }
    } else {
      const r = lutR[data[i]];
      const g = lutG[data[i + 1]];
      const b = lutB[data[i + 2]];
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      if (i % (sampleStride * 4) === 0) {
        edgeSamples.push((r * 54 + g * 183 + b * 19) >> 8);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Encode to JPEG high quality (CAM-03: prioritas kualitas JPEG CameraX)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Gagal mengekspor JPEG'));
      },
      'image/jpeg',
      0.95
    );
  });

  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const endTime = performance.now();
  const saveDurationMs = Math.round(endTime - startTime);
  const sharpnessScore = computeSharpnessScore(edgeSamples);

  return {
    dataUrl,
    blob,
    width: outputWidth,
    height: outputHeight,
    fileSizeBytes: blob.size,
    saveDurationMs,
    sharpnessScore,
  };
}

/**
 * Generates an authentic simulated AQUOS R7s sensor scene onto a target canvas
 * for environments without physical camera (Headless/Playwright/Desktop testing)
 */
export function renderSimulatedSensorScene(
  canvas: HTMLCanvasElement,
  sceneType: 'daylight' | 'sunset' | 'night' | 'indoor',
  timestamp: number = Date.now()
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Background gradient based on scene
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (sceneType === 'daylight') {
    grad.addColorStop(0, '#3a7bd5');
    grad.addColorStop(0.5, '#73a5d8');
    grad.addColorStop(0.7, '#dceaf7');
    grad.addColorStop(1, '#8fa382');
  } else if (sceneType === 'sunset') {
    grad.addColorStop(0, '#2c3e50');
    grad.addColorStop(0.3, '#d35400');
    grad.addColorStop(0.6, '#f39c12');
    grad.addColorStop(1, '#2c3e50');
  } else if (sceneType === 'night') {
    grad.addColorStop(0, '#0a0e17');
    grad.addColorStop(0.6, '#16222f');
    grad.addColorStop(1, '#0b1118');
  } else {
    // Indoor warm
    grad.addColorStop(0, '#4a3728');
    grad.addColorStop(0.6, '#7d5e3f');
    grad.addColorStop(1, '#2c1e14');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Render architectural structures / street details to simulate real camera subject
  ctx.fillStyle = sceneType === 'night' ? '#111b24' : '#2d3748';
  // Buildings
  ctx.fillRect(w * 0.1, h * 0.45, w * 0.22, h * 0.55);
  ctx.fillRect(w * 0.35, h * 0.35, w * 0.28, h * 0.65);
  ctx.fillRect(w * 0.66, h * 0.5, w * 0.24, h * 0.5);

  // Windows with illumination
  ctx.fillStyle = sceneType === 'night' ? '#f6e05e' : '#edf2f7';
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 3; col++) {
      if ((row + col) % 2 === 0) {
        ctx.fillRect(w * 0.38 + col * (w * 0.07), h * 0.4 + row * (h * 0.08), w * 0.04, h * 0.05);
      }
    }
  }

  // Soft depth-of-field circle (simulating AQUOS R7s large 1-inch sensor f/1.9 natural bokeh)
  const bokehGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 10, w * 0.5, h * 0.45, w * 0.35);
  bokehGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
  bokehGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = bokehGrad;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.45, w * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Subtle clock/animation so preview is dynamic
  const wave = Math.sin(timestamp / 1000) * 10;
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(w * 0.5 + wave, h * 0.42, 6, 0, Math.PI * 2);
  ctx.fill();
}
