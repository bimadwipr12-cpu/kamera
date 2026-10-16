/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { computeHistogram, downsampleHistogram } from './histogram.ts';

test('computeHistogram computes accurate counts and mean luminance for neutral grey', () => {
  // 100 pixels of 128, 128, 128 grey
  const pixels = new Uint8ClampedArray(100 * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 128;
    pixels[i + 1] = 128;
    pixels[i + 2] = 128;
    pixels[i + 3] = 255;
  }

  const result = computeHistogram(pixels, 1);
  assert.equal(result.meanLuminance, 128);
  assert.equal(result.shadowClippingPercent, 0);
  assert.equal(result.highlightClippingPercent, 0);
  assert.equal(result.exposureState, 'Optimal');
});

test('computeHistogram detects underexposed shadow clipping', () => {
  // 100 dark pixels (black)
  const pixels = new Uint8ClampedArray(100 * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 2;
    pixels[i + 1] = 2;
    pixels[i + 2] = 2;
    pixels[i + 3] = 255;
  }

  const result = computeHistogram(pixels, 1);
  assert.ok(result.shadowClippingPercent > 50, 'Shadow clipping should exceed 50%');
  assert.equal(result.exposureState, 'Under');
  assert.ok(result.exposureRecommendation.includes('Naikkan EV'));
});

test('computeHistogram detects overexposed highlight clipping', () => {
  // 100 pure white blown pixels
  const pixels = new Uint8ClampedArray(100 * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 255;
    pixels[i + 1] = 255;
    pixels[i + 2] = 255;
    pixels[i + 3] = 255;
  }

  const result = computeHistogram(pixels, 1);
  assert.ok(result.highlightClippingPercent > 50, 'Highlight clipping should exceed 50%');
  assert.equal(result.exposureState, 'Over');
  assert.ok(result.exposureRecommendation.includes('Turunkan EV'));
});

test('downsampleHistogram scales 256 bins to target 32 normalized buckets', () => {
  const bins = new Array(256).fill(10);
  const downsampled = downsampleHistogram(bins, 32);

  assert.equal(downsampled.length, 32);
  assert.ok(downsampled.every((val) => val >= 0 && val <= 1.0));
  assert.equal(downsampled[0], 1.0); // uniform normalized to max
});
