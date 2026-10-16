/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CameraCapabilities } from '../types/camera';
import {
  X,
  Cpu,
  Shield,
  Layers,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Eye,
  Info,
} from 'lucide-react';

interface DeviceInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  capabilities: CameraCapabilities;
}

export const DeviceInspectorModal: React.FC<DeviceInspectorModalProps> = ({
  isOpen,
  onClose,
  capabilities,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-inspector-title"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/80">
        <div className="flex items-center space-x-2.5">
          <Smartphone className="w-5 h-5 text-amber-400" />
          <div>
            <h2 id="device-inspector-title" className="text-sm font-semibold text-white tracking-wide">
              Spesifikasi Hardware & Audit Camera2
            </h2>
            <p className="text-[11px] text-zinc-400">
              Profil teknis target Sharp AQUOS R7s & API CameraX
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Inspektor"
          className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-4">
        {/* Anti-Infringement & Transparency Notice */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 space-y-1">
          <div className="flex items-center space-x-2 font-bold text-amber-400">
            <Shield className="w-4 h-4" />
            <span>Kepatuhan Batasan & Non-Tujuan PRD</span>
          </div>
          <p className="opacity-90 leading-relaxed text-[11px]">
            AquaTone Camera adalah aplikasi pihak ketiga independen. Aplikasi ini tidak meniru merek,
            tidak mengklaim menyamai GCam atau Leica, dan tidak mengakses ISP proprietary yang
            terkunci. Seluruh kontrol dibangun di atas API CameraX / Camera2 standar Android.
          </p>
        </div>

        {/* Hardware Status Grid */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Spesifikasi Sensor & Lensa (Sharp AQUOS R7s)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-500 text-[10px] block">Model Target</span>
              <span className="text-white font-semibold">Sharp AQUOS R7s (SH-52C)</span>
            </div>

            <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-500 text-[10px] block">Sensor Utama</span>
              <span className="text-white font-semibold">1.0-inch Type (47.2 MP Sensor)</span>
            </div>

            <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-500 text-[10px] block">Output Default (Binning 4-in-1)</span>
              <span className="text-emerald-400 font-semibold">12 MP (4032 × 3024) JPEG</span>
            </div>

            <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-500 text-[10px] block">Bukaan & Jarak Fokus</span>
              <span className="text-white font-semibold">19mm eq. f/1.9 Fixed Aperture</span>
            </div>

            <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-500 text-[10px] block">Hardware Level Camera2</span>
              <span className="text-amber-400 font-semibold">
                {capabilities.camera2Level} (Dukungan Manual Penuh)
              </span>
            </div>

            <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-500 text-[10px] block">Format Tangkapan</span>
              <span className="text-white font-semibold">JPEG (ImageCapture.QUALITY_PRIORITY)</span>
            </div>
          </div>
        </div>

        {/* CameraX Control Range Verification */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3 text-xs font-mono">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 font-sans">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Rentang Kontrol yang Diekspos (CAM-04 & CAM-05)</span>
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between items-center py-1.5 border-b border-zinc-800">
              <span className="text-zinc-400">Rentang Kompensasi Eksposur:</span>
              <span className="text-amber-400 font-bold">
                {capabilities.minEV} EV hingga +{capabilities.maxEV} EV (Langkah {capabilities.stepEV} EV)
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-zinc-800">
              <span className="text-zinc-400">Rentang Zoom Perangkat:</span>
              <span className="text-zinc-200">
                {capabilities.minZoom.toFixed(1)}× hingga {capabilities.maxZoom.toFixed(1)}×
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-zinc-800">
              <span className="text-zinc-400">Dukungan Zoom 2× Sensor Crop:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Didukung (Aman)</span>
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-zinc-800">
              <span className="text-zinc-400">Lampu Kilat / Torch:</span>
              <span className="text-zinc-200">Tersedia melalui FlashMode CameraX</span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="text-zinc-400">Direktori Penyimpanan:</span>
              <span className="text-amber-400 font-bold">Pictures/AquaTone</span>
            </div>
          </div>
        </div>

        {/* Verification guide for real device testing */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex items-center space-x-2 font-semibold text-zinc-300">
            <Info className="w-4 h-4 text-sky-400" />
            <span>Petunjuk Verifikasi di AQUOS R7s Nyata</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px] leading-relaxed">
            <li>Pastikan izin kamera dan penyimpanan (Scoped Storage Pictures) aktif.</li>
            <li>Buka AquaTone Camera dan amati apakah pratinjau kamera belakang 19mm terbuka lancar.</li>
            <li>Coba atur dial EV -2.0 hingga +2.0 untuk memastikan exposure tidak crash.</li>
            <li>Uji toggle 1× dan 2× untuk memeriksa ketajaman crop sensor 1 inci.</li>
            <li>Buka galeri Pictures/AquaTone untuk memastikan JPEG tersimpan dengan tanggal valid.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
