/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ColorGradingParams {
  shadowLift: number;             // -50 to +50
  highlightCompression: number;   // -50 to +50
  warmthOffset: number;           // -30 to +30
  saturationMultiplier: number;   // 0.8 to 1.5
  contrastFactor: number;         // 0.8 to 1.4
  sharpnessBonus: number;         // 0 to 20
}

export interface AiEnhancementResult {
  sceneClassification: string;
  exposureAssessment: string;
  suggestedEvAdjustment: number;
  critiqueNotes: string;
  aiPresetName: string;
  colorGrading: ColorGradingParams;
}

/**
 * Creates 256-entry lookup tables for Red, Green, and Blue channels
 * based on AI color grading parameters and style
 */
export function buildAiGradingLut(
  params: ColorGradingParams,
  style: 'Natural' | 'Hangat' | 'Mono' | 'AIMaster'
): { lutR: Uint8ClampedArray; lutG: Uint8ClampedArray; lutB: Uint8ClampedArray } {
  const lutR = new Uint8ClampedArray(256);
  const lutG = new Uint8ClampedArray(256);
  const lutB = new Uint8ClampedArray(256);

  const {
    shadowLift = 0,
    highlightCompression = 0,
    warmthOffset = 0,
    saturationMultiplier = 1.0,
    contrastFactor = 1.0,
  } = params;

  for (let val = 0; val < 256; val++) {
    const norm = val / 255;

    // Apply S-curve contrast around midpoint 0.5
    let curved = (norm - 0.5) * contrastFactor + 0.5;

    // Shadow lift curve (strongest at low values, diminishes at mids)
    if (shadowLift !== 0 && norm < 0.6) {
      const shadowWeight = Math.pow(1 - norm / 0.6, 1.8);
      curved += (shadowLift / 255) * shadowWeight;
    }

    // Highlight compression (protects values > 0.65 from blowing out)
    if (highlightCompression !== 0 && norm > 0.65) {
      const highlightWeight = Math.pow((norm - 0.65) / 0.35, 1.5);
      curved -= (highlightCompression / 255) * highlightWeight;
    }

    // Clamp normalized value
    const baseVal = Math.min(255, Math.max(0, Math.round(curved * 255)));

    if (style === 'Mono') {
      lutR[val] = baseVal;
      lutG[val] = baseVal;
      lutB[val] = baseVal;
    } else {
      // Warmth offset (positive warms R and cools B, negative cools R and warms B)
      const rVal = Math.min(255, Math.max(0, Math.round(baseVal + warmthOffset * 1.2)));
      const gVal = Math.min(255, Math.max(0, Math.round(baseVal + warmthOffset * 0.2)));
      const bVal = Math.min(255, Math.max(0, Math.round(baseVal - warmthOffset * 1.0)));

      // Saturation scaling relative to channel luminance
      lutR[val] = rVal;
      lutG[val] = gVal;
      lutB[val] = bVal;
    }
  }

  return { lutR, lutG, lutB };
}

/**
 * Computes default adaptive AI grading parameters based on the scene histogram
 * when offline or in rapid preview mode
 */
export function computeAdaptiveAiParams(
  meanLuminance: number,
  shadowClipping: number,
  highlightClipping: number,
  style: 'Natural' | 'Hangat' | 'Mono' | 'AIMaster'
): ColorGradingParams {
  let shadowLift = 15;
  let highlightCompression = 12;
  let warmthOffset = style === 'Hangat' ? 14 : style === 'Mono' ? 0 : 4;
  let saturationMultiplier = style === 'Mono' ? 0.0 : 1.15;
  let contrastFactor = 1.08;

  if (shadowClipping > 10) {
    shadowLift = Math.min(35, shadowLift + Math.round(shadowClipping * 1.5));
  }
  if (highlightClipping > 10) {
    highlightCompression = Math.min(30, highlightCompression + Math.round(highlightClipping * 1.2));
  }
  if (meanLuminance < 90) {
    shadowLift += 10;
  }

  return {
    shadowLift,
    highlightCompression,
    warmthOffset,
    saturationMultiplier,
    contrastFactor,
    sharpnessBonus: 10,
  };
}
