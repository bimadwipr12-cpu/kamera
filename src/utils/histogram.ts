/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HistogramData {
  luminance: number[]; // 256 bins
  red: number[];       // 256 bins
  green: number[];     // 256 bins
  blue: number[];      // 256 bins
  meanLuminance: number;
  shadowClippingPercent: number;    // % pixels <= 5
  highlightClippingPercent: number; // % pixels >= 250
  exposureState: 'Under' | 'Optimal' | 'Over' | 'HighContrast';
  exposureRecommendation: string;
}

/**
 * Computes 256-bin luminance & RGB histogram from ImageData pixel buffer
 * SampleStep speeds up processing while maintaining high statistical precision
 */
export function computeHistogram(
  data: Uint8ClampedArray,
  sampleStep: number = 4
): HistogramData {
  const lum = new Array<number>(256).fill(0);
  const rArr = new Array<number>(256).fill(0);
  const gArr = new Array<number>(256).fill(0);
  const bArr = new Array<number>(256).fill(0);

  let totalSampled = 0;
  let totalLumSum = 0;
  let shadowClipped = 0;
  let highlightClipped = 0;

  const step = Math.max(1, sampleStep);
  const len = data.length;

  for (let i = 0; i < len; i += step * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Rec. 709 luminance weights
    const y = Math.min(255, Math.max(0, Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)));

    lum[y]++;
    rArr[r]++;
    gArr[g]++;
    bArr[b]++;

    totalSampled++;
    totalLumSum += y;

    if (y <= 5) shadowClipped++;
    else if (y >= 250) highlightClipped++;
  }

  const meanLuminance = totalSampled > 0 ? Math.round(totalLumSum / totalSampled) : 128;
  const shadowClippingPercent = totalSampled > 0 ? (shadowClipped / totalSampled) * 100 : 0;
  const highlightClippingPercent = totalSampled > 0 ? (highlightClipped / totalSampled) * 100 : 0;

  // Determine exposure recommendation
  let exposureState: 'Under' | 'Optimal' | 'Over' | 'HighContrast' = 'Optimal';
  let exposureRecommendation = 'Eksposur Seimbang (Optimal)';

  if (shadowClippingPercent > 12 && highlightClippingPercent > 12) {
    exposureState = 'HighContrast';
    exposureRecommendation = 'Kontras Tinggi: Dinamika Lebar';
  } else if (meanLuminance < 85 || shadowClippingPercent > 15) {
    exposureState = 'Under';
    exposureRecommendation = 'Cenderung Gelap: Naikkan EV (+0.5)';
  } else if (meanLuminance > 175 || highlightClippingPercent > 15) {
    exposureState = 'Over';
    exposureRecommendation = 'Cenderung Terang: Turunkan EV (-0.5)';
  }

  return {
    luminance: lum,
    red: rArr,
    green: gArr,
    blue: bArr,
    meanLuminance,
    shadowClippingPercent: Math.round(shadowClippingPercent * 10) / 10,
    highlightClippingPercent: Math.round(highlightClippingPercent * 10) / 10,
    exposureState,
    exposureRecommendation,
  };
}

/**
 * Downsamples 256 bins to a displayable number of buckets (e.g. 32 or 48)
 * for smooth real-time SVG / canvas rendering
 */
export function downsampleHistogram(bins: number[], targetBins: number = 32): number[] {
  if (bins.length === targetBins) return bins;
  const result: number[] = new Array(targetBins).fill(0);
  const factor = bins.length / targetBins;

  for (let i = 0; i < targetBins; i++) {
    const start = Math.floor(i * factor);
    const end = Math.floor((i + 1) * factor);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += bins[j] || 0;
    }
    result[i] = sum / (end - start);
  }

  // Normalize 0-1
  const max = Math.max(1, ...result);
  return result.map((v) => v / max);
}
