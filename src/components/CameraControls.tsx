/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ColorStyle, AspectRatioType, AquaTonePhoto } from '../types/camera';
import {
  Grid,
  Zap,
  ZapOff,
  Sliders,
  RotateCcw,
  Sparkles,
  BarChart2,
  X,
  SlidersHorizontal,
  Activity,
  Layers,
  Sun,
  Eye,
  Check,
} from 'lucide-react';

interface CameraControlsProps {
  colorStyle: ColorStyle;
  onSelectColorStyle: (style: ColorStyle) => void;
  evCompensation: number;
  onEvChange: (ev: number) => void;
  zoomFactor: number;
  onZoomChange: (zoom: number) => void;
  is2xSupported?: boolean;
  aspectRatio: AspectRatioType;
  onAspectRatioChange: (ar: AspectRatioType) => void;
  flashMode: 'off' | 'on' | 'auto';
  onToggleFlash: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onTriggerShutter: () => void;
  isCapturing: boolean;
  onOpenGallery: () => void;
  onOpenDeviceInspector: () => void;
  onOpenTestBench: () => void;
  onToggleSimulatedCamera: () => void;
  isSimulated: boolean;
  latestPhoto?: AquaTonePhoto | null;
  totalPhotosCount: number;
  isAiEnhanced: boolean;
  onToggleAi: () => void;
  showHistogram: boolean;
  onToggleHistogram: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  colorStyle,
  onSelectColorStyle,
  evCompensation,
  onEvChange,
  zoomFactor,
  onZoomChange,
  aspectRatio,
  onAspectRatioChange,
  flashMode,
  onToggleFlash,
  showGrid,
  onToggleGrid,
  onTriggerShutter,
  isCapturing,
  onOpenGallery,
  onOpenDeviceInspector,
  onOpenTestBench,
  onToggleSimulatedCamera,
  isSimulated,
  latestPhoto,
  totalPhotosCount,
  isAiEnhanced,
  onToggleAi,
  showHistogram,
  onToggleHistogram,
}) => {
  // Active drawer menu: null when collapsed
  const [activeMenu, setActiveMenu] = useState<'style' | 'exposure' | 'ai' | 'tools' | null>(null);
  const evSteps = [-2.0, -1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5, 2.0];

  const handleToggleMenu = (menuName: 'style' | 'exposure' | 'ai' | 'tools') => {
    setActiveMenu((prev) => (prev === menuName ? null : menuName));
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col space-y-2 px-2 shrink-0 select-none relative">
      {/* 
        NO BLUR BACKDROP:
        Invisible click-catcher to dismiss menu with 1 tap anywhere outside,
        WITHOUT blurring or darkening the live camera viewfinder.
      */}
      {activeMenu && (
        <div
          role="presentation"
          aria-hidden="true"
          onClick={() => setActiveMenu(null)}
          className="fixed inset-0 z-30 bg-transparent cursor-default"
        />
      )}

      {/* DIV 1: Floating Leica HUD Drawer (Crisp, semi-transparent, NO background blur on viewfinder) */}
      <div
        role="region"
        aria-label="Panel Menu Fitur Kamera Leica"
        className={
          activeMenu
            ? 'absolute bottom-full mb-2 inset-x-2 z-40 bg-zinc-950/95 border border-zinc-700/80 rounded-2xl p-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-2'
            : 'hidden'
        }
      >
        {/* Drawer Header with Title and 1-Tap Close Button */}
        <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-1.5 px-1">
          <div className="flex items-center space-x-1.5">
            {activeMenu === 'style' && (
              <>
                <span className="w-2 h-2 rounded-full bg-[#D4001A]" />
                <span className="font-mono text-zinc-100 font-bold uppercase tracking-wider text-[11px]">
                  Leica Look (Gaya Warna)
                </span>
              </>
            )}
            {activeMenu === 'exposure' && (
              <>
                <Sun className="w-3.5 h-3.5 text-[#D4001A]" />
                <span className="font-mono text-zinc-100 font-bold uppercase tracking-wider text-[11px]">
                  Kompensasi Eksposur (EV) & Zoom
                </span>
              </>
            )}
            {activeMenu === 'ai' && (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#D4001A] fill-[#D4001A]" />
                <span className="font-mono text-zinc-100 font-bold uppercase tracking-wider text-[11px]">
                  Leica AI Engine & Histogram
                </span>
              </>
            )}
            {activeMenu === 'tools' && (
              <>
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-300" />
                <span className="font-mono text-zinc-100 font-bold uppercase tracking-wider text-[11px]">
                  Pengaturan Kamera AQUOS R7s
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveMenu(null)}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-mono"
            aria-label="Tutup Panel Kontrol"
          >
            <span>TUTUP</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. Leica Style Drawer Content (Live preview remains completely clear and unblurred!) */}
        {activeMenu === 'style' && (
          <div className="space-y-2 pt-0.5">
            <p className="text-[10px] text-zinc-400 px-1 font-mono">
              Pilih karakter profil warna Leica pada sensor 1-inci Sharp AQUOS R7s:
            </p>
            <div className="grid grid-cols-3 gap-2 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800">
              {[
                {
                  id: 'Natural' as ColorStyle,
                  label: 'LEICA NATURAL',
                  desc: 'Otentik & Akurat',
                  badgeColor: 'bg-zinc-200 text-black',
                },
                {
                  id: 'Hangat' as ColorStyle,
                  label: 'LEICA VIVID',
                  desc: 'Hangat & Karakter Khas',
                  badgeColor: 'bg-[#D4001A] text-white',
                },
                {
                  id: 'Mono' as ColorStyle,
                  label: 'LEICA MONO',
                  desc: 'Hitam-Putih Murni',
                  badgeColor: 'bg-zinc-900 text-white border border-zinc-500',
                },
              ].map((item) => {
                const isActive = colorStyle === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectColorStyle(item.id);
                    }}
                    className={`py-2 px-1.5 rounded-xl text-xs transition-all flex flex-col items-center justify-center space-y-1 relative border ${
                      isActive
                        ? 'bg-zinc-800 text-white border-[#D4001A] shadow-md shadow-red-950/30 font-bold ring-1 ring-[#D4001A]'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 border-zinc-800'
                    }`}
                    aria-pressed={isActive}
                  >
                    {isActive && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#D4001A]" />
                    )}
                    <span className="font-mono text-[10px] tracking-wider font-bold">
                      {item.label}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-sans leading-tight text-center">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Exposure & Zoom Drawer Content */}
        {activeMenu === 'exposure' && (
          <div className="space-y-2 pt-0.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300 px-1">
              <span>NILAI EV:</span>
              <span
                className={`font-bold px-1.5 py-0.2 rounded ${
                  evCompensation === 0
                    ? 'text-zinc-300 bg-zinc-800'
                    : 'text-[#D4001A] bg-red-950/50 border border-red-800/40'
                }`}
              >
                {evCompensation > 0 ? `+${evCompensation.toFixed(1)}` : evCompensation.toFixed(1)} EV
              </span>
            </div>

            {/* Horizontal Knurled Leica Exposure Dial Scale */}
            <div className="flex items-center space-x-1 overflow-x-auto py-1 px-1 bg-zinc-900/90 rounded-xl border border-zinc-800 scrollbar-none">
              {evSteps.map((ev) => {
                const isSelected = Math.abs(evCompensation - ev) < 0.05;
                return (
                  <button
                    key={ev}
                    type="button"
                    onClick={() => onEvChange(ev)}
                    className={`flex-1 min-w-[34px] py-1.5 rounded-lg text-[10px] font-mono font-medium transition-all flex flex-col items-center ${
                      isSelected
                        ? 'bg-[#D4001A] text-white font-bold shadow'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                    aria-label={`EV ${ev > 0 ? `+${ev}` : ev}`}
                  >
                    <span className={`w-0.5 h-1.5 mb-0.5 ${isSelected ? 'bg-white' : 'bg-zinc-600'}`} />
                    <span>{ev === 0 ? '0' : ev > 0 ? `+${ev}` : `${ev}`}</span>
                  </button>
                );
              })}
            </div>

            {/* Zoom Selector */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[11px] font-mono px-1">
              <span className="text-zinc-400">LEICA LENS CROP:</span>
              <div className="flex items-center space-x-1.5">
                {[1.0, 2.0].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => onZoomChange(z)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      zoomFactor === z
                        ? 'bg-[#D4001A] text-white shadow'
                        : 'bg-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {z === 1.0 ? '19mm (1×)' : '38mm (2×)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. AI & Histogram Drawer Content */}
        {activeMenu === 'ai' && (
          <div className="space-y-2 pt-0.5">
            <div className="grid grid-cols-2 gap-2">
              {/* AI Processing Toggle */}
              <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4001A] fill-[#D4001A]" />
                    <span className="text-xs font-mono font-bold text-zinc-200">LEICA AI</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                      isAiEnhanced
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {isAiEnhanced ? 'AKTIF' : 'OFF'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Optimalisasi warna sensor 1" dengan Gemini neural color enhancement.
                </p>
                <button
                  type="button"
                  onClick={onToggleAi}
                  className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                    isAiEnhanced
                      ? 'bg-[#D4001A] text-white shadow'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  {isAiEnhanced ? 'Matikan AI' : 'Aktifkan AI'}
                </button>
              </div>

              {/* Histogram Toggle */}
              <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <BarChart2 className="w-3.5 h-3.5 text-zinc-300" />
                    <span className="text-xs font-mono font-bold text-zinc-200">HISTOGRAM</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                      showHistogram
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {showHistogram ? 'TAMPIL' : 'SEMBUNYI'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Grafik sebaran kecerahan real-time untuk akurasi pencahayaan.
                </p>
                <button
                  type="button"
                  onClick={onToggleHistogram}
                  className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                    showHistogram
                      ? 'bg-zinc-200 text-black shadow'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  {showHistogram ? 'Tutup Histo' : 'Buka Histo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Tools & Diagnostics Drawer Content */}
        {activeMenu === 'tools' && (
          <div className="flex items-center justify-between gap-1.5 pt-0.5 overflow-x-auto text-zinc-300">
            <button
              type="button"
              onClick={onToggleFlash}
              title="Mode Lampu Kilat"
              className="flex-1 py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center space-x-1 text-xs transition-colors"
              aria-label={`Lampu Kilat: ${flashMode}`}
            >
              {flashMode === 'off' ? (
                <ZapOff className="w-3.5 h-3.5 text-zinc-400" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-[#D4001A] fill-[#D4001A]" />
              )}
              <span className="text-[10px] font-mono font-medium">KILAT ({flashMode.toUpperCase()})</span>
            </button>

            <button
              type="button"
              onClick={onToggleGrid}
              title="Garis Kisi (Rule of Thirds)"
              className={`flex-1 py-1.5 px-2 rounded-xl border flex items-center justify-center space-x-1 text-xs transition-colors ${
                showGrid
                  ? 'bg-zinc-800 border-[#D4001A]/60 text-white font-bold'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400'
              }`}
              aria-label="Toggle Garis Kisi"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono font-medium">FRAMING</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextAR: Record<AspectRatioType, AspectRatioType> = {
                  '4:3': '16:9',
                  '16:9': '1:1',
                  '1:1': '4:3',
                };
                onAspectRatioChange(nextAR[aspectRatio]);
              }}
              title="Rasio Aspek Sensor"
              className="flex-1 py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono font-bold text-zinc-200 transition-colors text-center"
              aria-label={`Rasio Aspek: ${aspectRatio}`}
            >
              {aspectRatio}
            </button>

            <button
              type="button"
              onClick={onOpenDeviceInspector}
              title="Spesifikasi Hardware AQUOS R7s"
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              aria-label="Inspeksi Hardware AQUOS R7s"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onOpenTestBench}
              title="Benchmarking 30-Foto"
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#D4001A]/10 hover:bg-[#D4001A]/20 text-red-300 rounded-xl border border-[#D4001A]/30 text-[10px] font-mono font-bold transition-colors"
              aria-label="Buka Matriks Uji 30 Foto"
            >
              <Activity className="w-3 h-3 text-[#D4001A]" />
              <span>TEST 30</span>
            </button>
          </div>
        )}
      </div>

      {/* DIV 2: Leica Quick Bar (Takes < 34px, 1-Tap access, NO blur on viewfinder) */}
      <div className="flex items-center justify-between gap-1.5 px-2 py-1 bg-zinc-950/80 rounded-2xl border border-zinc-800/90 text-xs shadow-lg">
        {/* Button 1: Leica Style / Look Selector */}
        <button
          type="button"
          onClick={() => handleToggleMenu('style')}
          className={`flex-1 py-1 px-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all text-[11px] font-mono uppercase tracking-wider border ${
            activeMenu === 'style'
              ? 'bg-[#D4001A] text-white border-red-500 shadow-md font-bold'
              : 'text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800'
          }`}
          aria-label="Menu Gaya Warna Leica"
          aria-expanded={activeMenu === 'style'}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              activeMenu === 'style'
                ? 'bg-white'
                : colorStyle === 'Hangat'
                ? 'bg-[#D4001A]'
                : colorStyle === 'Mono'
                ? 'bg-zinc-400'
                : 'bg-sky-400'
            }`}
          />
          <span className="truncate font-bold">
            {colorStyle === 'Hangat' ? 'VIVID' : colorStyle === 'Mono' ? 'MONO' : 'NATURAL'}
          </span>
        </button>

        {/* Button 2: Exposure & Zoom */}
        <button
          type="button"
          onClick={() => handleToggleMenu('exposure')}
          className={`flex-1 py-1 px-2 rounded-xl flex items-center justify-center space-x-1 transition-all text-[11px] font-mono border ${
            activeMenu === 'exposure'
              ? 'bg-[#D4001A] text-white border-red-500 shadow-md font-bold'
              : 'text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800'
          }`}
          aria-label="Menu Eksposur dan Zoom"
          aria-expanded={activeMenu === 'exposure'}
        >
          <Sun className={`w-3 h-3 shrink-0 ${activeMenu === 'exposure' ? 'text-white' : 'text-[#D4001A]'}`} />
          <span className="truncate font-medium">
            {evCompensation > 0 ? `+${evCompensation.toFixed(1)}` : evCompensation.toFixed(1)} EV
          </span>
          <span className="text-zinc-500 text-[10px]">·</span>
          <span className="text-zinc-400 text-[10px]">{zoomFactor}×</span>
        </button>

        {/* Button 3: AI & Histogram */}
        <button
          type="button"
          onClick={() => handleToggleMenu('ai')}
          className={`flex-1 py-1 px-2 rounded-xl flex items-center justify-center space-x-1 transition-all text-[11px] font-mono border ${
            activeMenu === 'ai'
              ? 'bg-[#D4001A] text-white border-red-500 shadow-md font-bold'
              : isAiEnhanced || showHistogram
              ? 'bg-red-950/40 text-red-200 border-red-800/40 hover:bg-red-950/60'
              : 'text-zinc-400 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800'
          }`}
          aria-label="Menu Fitur AI dan Histogram"
          aria-expanded={activeMenu === 'ai'}
        >
          <Sparkles
            className={`w-3 h-3 shrink-0 ${
              activeMenu === 'ai'
                ? 'text-white'
                : isAiEnhanced
                ? 'text-[#D4001A] fill-[#D4001A]'
                : 'text-zinc-400'
            }`}
          />
          <span className="truncate font-bold">AI / HISTO</span>
          {(isAiEnhanced || showHistogram) && (
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                activeMenu === 'ai' ? 'bg-white' : 'bg-[#D4001A]'
              }`}
            />
          )}
        </button>

        {/* Button 4: Leica Menu / Tools */}
        <button
          type="button"
          onClick={() => handleToggleMenu('tools')}
          className={`py-1 px-2.5 rounded-xl flex items-center justify-center space-x-1 transition-all text-[11px] font-mono border ${
            activeMenu === 'tools'
              ? 'bg-[#D4001A] text-white border-red-500 font-bold shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800'
          }`}
          aria-label="Buka Menu Pengaturan dan Alat"
          aria-expanded={activeMenu === 'tools'}
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span className="font-bold">MENU</span>
        </button>
      </div>

      {/* DIV 3: Bottom Main Action Bar (Leica Shutter Release, Gallery, Source Switch) */}
      <div className="flex items-center justify-between px-6 py-2 bg-zinc-950/90 rounded-3xl border border-zinc-800/80 shadow-xl">
        {/* Gallery Preview Thumbnail */}
        <button
          type="button"
          onClick={onOpenGallery}
          className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center group hover:border-[#D4001A] transition-all shrink-0"
          aria-label="Buka Galeri Pictures/AquaTone"
        >
          {latestPhoto ? (
            <img
              src={latestPhoto.dataUrl}
              alt="Foto terakhir"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <Layers className="w-5 h-5 text-zinc-500" />
          )}
          {totalPhotosCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#D4001A] text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border border-black shadow">
              {totalPhotosCount}
            </span>
          )}
        </button>

        {/* Authentic Leica Mechanical Shutter Button (Dual-ring knurled bezel) */}
        <button
          type="button"
          onClick={onTriggerShutter}
          disabled={isCapturing}
          aria-label="Ambil Foto Rana Leica"
          className="relative w-18 h-18 rounded-full border-4 border-zinc-500/80 p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 shadow-2xl bg-zinc-900"
        >
          {/* Outer Knurled Ring Effect */}
          <div className="w-full h-full rounded-full p-1 bg-gradient-to-b from-zinc-400 via-zinc-600 to-zinc-800 flex items-center justify-center shadow-inner">
            {/* Inner Shutter Face with Leica Red Dot center */}
            <div
              className={`w-full h-full rounded-full transition-all flex items-center justify-center shadow-md relative ${
                colorStyle === 'Hangat'
                  ? 'bg-gradient-to-tr from-zinc-100 to-zinc-300'
                  : colorStyle === 'Mono'
                  ? 'bg-gradient-to-tr from-zinc-200 to-zinc-400'
                  : 'bg-white'
              }`}
            >
              {/* Leica signature red center dot on shutter button */}
              {!isCapturing && (
                <div className="w-3.5 h-3.5 rounded-full bg-[#D4001A] shadow-inner flex items-center justify-center" />
              )}
              {isCapturing && (
                <span className="w-5 h-5 border-2 border-[#D4001A] border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>
        </button>

        {/* Camera Source Switcher with Leica aesthetic */}
        <button
          type="button"
          onClick={onToggleSimulatedCamera}
          title={isSimulated ? 'Beralih ke Kamera Fisik' : 'Beralih ke Simulasi Sensor 1" AQUOS R7s'}
          className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 transition-colors shrink-0"
          aria-label="Beralih Sumber Kamera"
        >
          <RotateCcw className="w-4 h-4 text-zinc-300 mb-0.5" />
          <span className="text-[9px] font-mono font-bold text-zinc-300">
            {isSimulated ? 'SIM 1"' : 'CAM'}
          </span>
        </button>
      </div>
    </div>
  );
};
