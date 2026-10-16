/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateAquaToneFilename,
  evToBrightnessMultiplier,
  validateZoomSupport,
  applyColorProfileToRgb,
  computeSharpnessScore,
  computeTestBenchSummary,
} from './cameraLogic.ts';
import type { TestBenchEntry } from '../types/camera.ts';

test('generateAquaToneFilename creates valid PRD compliant naming pattern', () => {
  const testDate = new Date(2026, 9, 15, 14, 30, 45); // Oct 15, 2026 14:30:45
  const naturalName = generateAquaToneFilename(testDate, 'Natural');
  const hangatName = generateAquaToneFilename(testDate, 'Hangat');
  const monoName = generateAquaToneFilename(testDate, 'Mono');

  assert.equal(naturalName, 'IMG_20261015_143045_AquaTone_Natural.jpg');
  assert.equal(hangatName, 'IMG_20261015_143045_AquaTone_Hangat.jpg');
  assert.equal(monoName, 'IMG_20261015_143045_AquaTone_Mono.jpg');
});

test('evToBrightnessMultiplier clamps correctly and outputs valid scale', () => {
  assert.equal(evToBrightnessMultiplier(0), 1);
  const positiveEV = evToBrightnessMultiplier(1.0);
  const negativeEV = evToBrightnessMultiplier(-1.0);

  assert.ok(positiveEV > 1, 'Positive EV should brighten preview');
  assert.ok(negativeEV < 1, 'Negative EV should darken preview');

  // Verify clamping at -2 and +2
  assert.equal(evToBrightnessMultiplier(5.0), evToBrightnessMultiplier(2.0));
  assert.equal(evToBrightnessMultiplier(-5.0), evToBrightnessMultiplier(-2.0));
});

test('validateZoomSupport verifies zoom bounds accurately', () => {
  assert.equal(validateZoomSupport(1.0, 6.0, 2.0), true);
  assert.equal(validateZoomSupport(1.0, 1.5, 2.0), false);
  assert.equal(validateZoomSupport(1.0, 1.0, 1.0), false); // Min equal max invalid
});

test('applyColorProfileToRgb renders distinct profiles for Natural, Hangat, and Mono', () => {
  const [r, g, b] = [120, 100, 80];

  const [mr, mg, mb] = applyColorProfileToRgb(r, g, b, 'Mono');
  assert.equal(mr, mg, 'Mono should produce identical greyscale R & G');
  assert.equal(mg, mb, 'Mono should produce identical greyscale G & B');

  const [hr, hg, hb] = applyColorProfileToRgb(r, g, b, 'Hangat');
  assert.ok(hr > r, 'Hangat should warm/boost red component');
  assert.ok(hb <= b, 'Hangat should keep blue lower for amber warmth');

  const [nr, ng, nb] = applyColorProfileToRgb(r, g, b, 'Natural');
  assert.ok(nr >= r);
});

test('computeSharpnessScore produces bounded score', () => {
  const samples = [10, 20, 50, 80, 110, 150, 200];
  const score = computeSharpnessScore(samples);
  assert.ok(score >= 0 && score <= 100);
});

test('computeTestBenchSummary accurately audits 30-shot test matrix', () => {
  const dummyEntries: TestBenchEntry[] = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    timestamp: Date.now() + i * 1000,
    lighting: i % 2 === 0 ? 'Terang' : 'Rendah',
    style: i % 3 === 0 ? 'Natural' : i % 3 === 1 ? 'Hangat' : 'Mono',
    status: 'PASS',
    saveDurationMs: 120 + (i % 5) * 10,
    fileSizeKb: 1400 + (i % 7) * 20,
    sharpnessScore: 75 + (i % 10),
    crashRecorded: false,
    notes: 'OK',
  }));

  const summary = computeTestBenchSummary(dummyEntries);
  assert.equal(summary.completed, 30);
  assert.equal(summary.passCount, 30);
  assert.equal(summary.crashCount, 0);
  assert.equal(summary.allStylesTested, true);
  assert.equal(summary.bothLightingConditionsTested, true);
  assert.equal(summary.meets30ShotCriteria, true);
});
