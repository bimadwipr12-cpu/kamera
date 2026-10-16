/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ColorStyle = 'Natural' | 'Hangat' | 'Mono';

export type AspectRatioType = '4:3' | '16:9' | '1:1';

export interface AquaTonePhoto {
  id: string;
  filename: string; // IMG_YYYYMMDD_HHMMSS_AquaTone_<style>.jpg
  dataUrl: string;
  blob?: Blob;
  style: ColorStyle;
  timestamp: number;
  width: number;
  height: number;
  fileSizeBytes: number;
  saveDurationMs: number;
  evCompensation: number;
  zoomFactor: number;
  lightingCondition: 'Terang' | 'Rendah';
  sharpnessScore: number;
  isAiEnhanced?: boolean;
  aiPresetName?: string;
  aiCritique?: string;
  metadata: {
    device: string;
    sensor: string;
    aperture: string;
    focalLength: string;
    iso: number;
    shutterSpeed: string;
    whiteBalance: string;
    storagePath: string; // 'Pictures/AquaTone'
    aiProcessing?: string;
  };
}

export interface CameraCapabilities {
  minEV: number;
  maxEV: number;
  stepEV: number;
  currentEV: number;
  minZoom: number;
  maxZoom: number;
  currentZoom: number;
  is2xSupported: boolean;
  facingMode: 'environment' | 'user';
  hasFlash: boolean;
  isRealHardware: boolean;
  camera2Level: 'LIMITED' | 'FULL' | 'LEVEL_3';
  deviceModel: string;
  resolution: { width: number; height: number };
}

export interface TestBenchEntry {
  id: number;
  timestamp: number;
  lighting: 'Terang' | 'Rendah';
  style: ColorStyle;
  status: 'PENDING' | 'PASS' | 'FAIL';
  saveDurationMs: number;
  fileSizeKb: number;
  sharpnessScore: number;
  crashRecorded: boolean;
  notes: string;
}
