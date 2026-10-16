/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ColorStyle, TestBenchEntry } from '../types/camera.ts';

/**
 * Generates AquaTone dated filename compliant with PRD IMG-01:
 * Format: IMG_YYYYMMDD_HHMMSS_AquaTone_<STYLE>.jpg
 */
export function generateAquaToneFilename(date: Date, style: ColorStyle): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `IMG_${year}${month}${day}_${hours}${minutes}${seconds}_AquaTone_${style}.jpg`;
}

/**
 * Calculates exposure brightness multiplier from EV compensation (-2.0 to +2.0)
 * standard exposure equation: 2^(EV)
 */
export function evToBrightnessMultiplier(ev: number): number {
  const clampedEV = Math.max(-2, Math.min(2, ev));
  return Math.pow(2, clampedEV * 0.45); // Tuned for preview perceptual curve
}

/**
 * Validates if 2x zoom is supported given camera reported zoom range (CAM-05)
 */
export function validateZoomSupport(minZoom: number, maxZoom: number, targetZoom: number): boolean {
  if (minZoom >= maxZoom) return false;
  return targetZoom >= minZoom && targetZoom <= maxZoom;
}

/**
 * Pure color transformation for individual RGB pixel channels (0-255)
 * Styles:
 * - Natural: Balanced, true-to-life contrast, neutral skin tones
 * - Hangat (Warm): Golden-amber warmth, boosted reds/yellows, soft highlights
 * - Mono: High-tonality monochrome, deep shadows, luminance-weighted greyscale
 */
export function applyColorProfileToRgb(
  r: number,
  g: number,
  b: number,
  style: ColorStyle
): [number, number, number] {
  if (style === 'Mono') {
    // Rec. 709 luminance weights with a slight punchy contrast S-curve
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Enhanced contrast for pleasing monochrome
    const normalized = lum / 255;
    const contrastEnhanced = (normalized - 0.5) * 1.15 + 0.5;
    const finalVal = Math.min(255, Math.max(0, Math.round(contrastEnhanced * 255)));
    return [finalVal, finalVal, finalVal];
  }

  if (style === 'Hangat') {
    // Warm tone: Boost Red channel slightly (+12%), subtle Green boost (+3%), decrease Blue (-10%)
    const warmedR = Math.min(255, Math.round(r * 1.10 + 6));
    const warmedG = Math.min(255, Math.round(g * 1.02 + 2));
    const warmedB = Math.max(0, Math.round(b * 0.90 - 4));
    return [warmedR, warmedG, warmedB];
  }

  // Natural: subtle micro-contrast & neutral saturation preservation
  const nr = Math.min(255, Math.max(0, Math.round(r * 1.01)));
  const ng = Math.min(255, Math.max(0, Math.round(g * 1.01)));
  const nb = Math.min(255, Math.max(0, Math.round(b * 1.01)));
  return [nr, ng, nb];
}

/**
 * Computes sharpness score based on luminance edge variance approximation
 */
export function computeSharpnessScore(samples: number[]): number {
  if (!samples || samples.length === 0) return 0;
  const mean = samples.reduce((acc, val) => acc + val, 0) / samples.length;
  const variance =
    samples.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / samples.length;
  // Normalize into index 0 - 100
  return Math.min(100, Math.max(10, Math.round(Math.sqrt(variance) * 2)));
}

/**
 * Summarizes the 30-shot test bench statistics according to PRD acceptance criteria:
 * "Uji minimal 30 foto pada cahaya terang dan rendah mencatat crash, waktu simpan, ketajaman, warna, dan ukuran file."
 */
export function computeTestBenchSummary(entries: TestBenchEntry[]): {
  total: number;
  completed: number;
  passCount: number;
  failCount: number;
  crashCount: number;
  avgSaveDurationMs: number;
  avgFileSizeKb: number;
  avgSharpness: number;
  allStylesTested: boolean;
  bothLightingConditionsTested: boolean;
  meets30ShotCriteria: boolean;
} {
  const completedEntries = entries.filter((e) => e.status !== 'PENDING');
  const completed = completedEntries.length;
  const passCount = entries.filter((e) => e.status === 'PASS').length;
  const failCount = entries.filter((e) => e.status === 'FAIL').length;
  const crashCount = entries.filter((e) => e.crashRecorded).length;

  const totalSaveMs = completedEntries.reduce((sum, e) => sum + e.saveDurationMs, 0);
  const totalSizeKb = completedEntries.reduce((sum, e) => sum + e.fileSizeKb, 0);
  const totalSharpness = completedEntries.reduce((sum, e) => sum + e.sharpnessScore, 0);

  const stylesUsed = new Set(completedEntries.map((e) => e.style));
  const lightingsUsed = new Set(completedEntries.map((e) => e.lighting));

  const allStylesTested = ['Natural', 'Hangat', 'Mono'].every((s) =>
    stylesUsed.has(s as ColorStyle)
  );
  const bothLightingConditionsTested =
    lightingsUsed.has('Terang') && lightingsUsed.has('Rendah');

  return {
    total: entries.length,
    completed,
    passCount,
    failCount,
    crashCount,
    avgSaveDurationMs: completed > 0 ? Math.round(totalSaveMs / completed) : 0,
    avgFileSizeKb: completed > 0 ? Math.round((totalSizeKb / completed) * 10) / 10 : 0,
    avgSharpness: completed > 0 ? Math.round((totalSharpness / completed) * 10) / 10 : 0,
    allStylesTested,
    bothLightingConditionsTested,
    meets30ShotCriteria: completed >= 30 && crashCount === 0 && allStylesTested && bothLightingConditionsTested,
  };
}
