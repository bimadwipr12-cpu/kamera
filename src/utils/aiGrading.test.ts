/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAiGradingLut, computeAdaptiveAiParams } from './aiGrading.ts';

test('buildAiGradingLut generates 256-byte LUT arrays within valid RGB bounds', () => {
  const params = {
    shadowLift: 20,
    highlightCompression: 15,
    warmthOffset: 10,
    saturationMultiplier: 1.1,
    contrastFactor: 1.05,
    sharpnessBonus: 5,
  };

  const { lutR, lutG, lutB } = buildAiGradingLut(params, 'Natural');

  assert.equal(lutR.length, 256);
  assert.equal(lutG.length, 256);
  assert.equal(lutB.length, 256);

  // Shadows lifted (input value 10 should be lifted higher than 10)
  assert.ok(lutR[10] >= 10, 'Shadow lift should brighten deep shadows');

  // Warmth offset: positive warmth should make Red higher than Blue
  assert.ok(lutR[128] >= lutB[128], 'Warmth offset should keep Red higher than Blue');
});

test('buildAiGradingLut in Mono produces identical R, G, B tone curve', () => {
  const params = {
    shadowLift: 10,
    highlightCompression: 10,
    warmthOffset: 0,
    saturationMultiplier: 0.0,
    contrastFactor: 1.15,
    sharpnessBonus: 0,
  };

  const { lutR, lutG, lutB } = buildAiGradingLut(params, 'Mono');
  for (let i = 0; i < 256; i += 16) {
    assert.equal(lutR[i], lutG[i]);
    assert.equal(lutG[i], lutB[i]);
  }
});

test('computeAdaptiveAiParams responds to clipping and dark scenes', () => {
  const darkScene = computeAdaptiveAiParams(70, 25, 2, 'Natural');
  const brightScene = computeAdaptiveAiParams(180, 2, 25, 'Natural');

  assert.ok(darkScene.shadowLift > brightScene.shadowLift, 'Dark scene should have stronger shadow lift');
  assert.ok(brightScene.highlightCompression > darkScene.highlightCompression, 'Bright scene should have stronger highlight compression');
});
