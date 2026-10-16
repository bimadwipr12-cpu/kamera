/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ColorStyle, AspectRatioType } from '../types/camera';
import { evToBrightnessMultiplier } from '../utils/cameraLogic';
import { renderSimulatedSensorScene } from '../services/imageProcessing';
import { HistogramData, computeHistogram } from '../utils/histogram';
import { Histogram } from './Histogram';
import { AlertCircle, RefreshCw, Smartphone, Focus, Sparkles, BarChart2 } from 'lucide-react';

interface ViewfinderProps {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  colorStyle: ColorStyle;
  evCompensation: number;
  zoomFactor: number;
  aspectRatio: AspectRatioType;
  showGrid: boolean;
  isSimulated: boolean;
  isFlashing: boolean;
  cameraError: string | null;
  onRequestPermission: () => void;
  onSelectSimulatedScene: (scene: 'daylight' | 'sunset' | 'night' | 'indoor') => void;
  simulatedScene: 'daylight' | 'sunset' | 'night' | 'indoor';
  onEvChange?: (ev: number) => void;
  isAiEnhanced?: boolean;
  showHistogram?: boolean;
  onToggleHistogram?: () => void;
}

export const Viewfinder: React.FC<ViewfinderProps> = ({
  stream,
  videoRef,
  canvasRef,
  colorStyle,
  evCompensation,
  zoomFactor,
  aspectRatio,
  showGrid,
  isSimulated,
  isFlashing,
  cameraError,
  onRequestPermission,
  onSelectSimulatedScene,
  simulatedScene,
  onEvChange,
  isAiEnhanced = false,
  showHistogram = false,
  onToggleHistogram,
}) => {
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time histogram sampling loop (~8-10fps)
  useEffect(() => {
    let isCancelled = false;

    const sample = () => {
      if (isCancelled) return;

      const source =
        !isSimulated && videoRef.current && videoRef.current.readyState >= 2
          ? videoRef.current
          : canvasRef.current;

      if (source) {
        if (!sampleCanvasRef.current) {
          sampleCanvasRef.current = document.createElement('canvas');
          sampleCanvasRef.current.width = 120;
          sampleCanvasRef.current.height = 90;
        }

        const sampleCtx = sampleCanvasRef.current.getContext('2d', { willReadFrequently: true });
        if (sampleCtx) {
          sampleCtx.drawImage(source, 0, 0, 120, 90);
          const imgData = sampleCtx.getImageData(0, 0, 120, 90);
          const hist = computeHistogram(imgData.data, 2);
          setHistogramData(hist);
        }
      }
    };

    const interval = setInterval(sample, 120);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [isSimulated, videoRef, canvasRef, simulatedScene, evCompensation, colorStyle]);

  // Animate simulated sensor scene if webcam is not active
  useEffect(() => {
    if (!isSimulated || !canvasRef.current) return;
    let animId: number;

    const render = () => {
      if (canvasRef.current) {
        renderSimulatedSensorScene(canvasRef.current, simulatedScene);
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isSimulated, simulatedScene, canvasRef]);

  // Handle tap-to-focus
  const handleViewfinderTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setFocusPoint({ x, y });
    const timer = setTimeout(() => {
      setFocusPoint(null);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  // Compute CSS filter for live viewfinder preview
  const evMult = evToBrightnessMultiplier(evCompensation);
  const brightnessPercent = Math.round(evMult * 100);

  let filterStyle = `brightness(${brightnessPercent}%)`;
  if (colorStyle === 'Mono') {
    filterStyle += ' grayscale(100%) contrast(118%)';
  } else if (colorStyle === 'Hangat') {
    filterStyle += ' sepia(20%) saturate(118%) hue-rotate(-6deg) contrast(106%)';
  } else {
    filterStyle += ' contrast(105%) saturate(104%)';
  }

  // Expanded Aspect ratio styling for much larger immersive preview
  const aspectClass =
    aspectRatio === '4:3'
      ? 'aspect-[3/4] max-h-[66vh] sm:max-h-[70vh] md:max-h-[74vh] w-full'
      : aspectRatio === '1:1'
      ? 'aspect-square max-h-[58vh] sm:max-h-[62vh] w-full'
      : 'aspect-[9/16] max-h-[72vh] sm:max-h-[76vh] w-full';

  return (
    <div
      ref={containerRef}
      onClick={handleViewfinderTap}
      role="region"
      aria-label="Kamera Pratinjau Viewfinder Leica"
      className={`relative w-auto h-full ${aspectClass} bg-black overflow-hidden select-none cursor-crosshair rounded-xl shadow-2xl border border-zinc-800 transition-all duration-300 flex items-center justify-center`}
    >
      {/* Video Element for live webcam */}
      {!isSimulated && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            filter: filterStyle,
            transform: `scale(${zoomFactor})`,
            transformOrigin: 'center center',
          }}
          className="w-full h-full object-cover transition-transform duration-200 will-change-transform"
        />
      )}

      {/* Canvas Element for AQUOS R7s Sensor Simulation */}
      {isSimulated && (
        <canvas
          ref={canvasRef}
          width={1200}
          height={1600}
          style={{
            filter: filterStyle,
            transform: `scale(${zoomFactor})`,
            transformOrigin: 'center center',
          }}
          className="w-full h-full object-cover transition-transform duration-200 will-change-transform"
        />
      )}

      {/* Classic Leica Rangefinder Framelines (Corner brackets) */}
      <div className="absolute inset-3 pointer-events-none z-10">
        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-white/60" />
        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-white/60" />
        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-white/60" />
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-white/60" />
      </div>

      {/* Grid overlay (Rule of Thirds) */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10 opacity-35">
          <div className="border-r border-b border-white/40" />
          <div className="border-r border-b border-white/40" />
          <div className="border-b border-white/40" />
          <div className="border-r border-b border-white/40" />
          <div className="border-r border-b border-white/40" />
          <div className="border-b border-white/40" />
          <div className="border-r border-b border-white/40" />
          <div className="border-r border-b border-white/40" />
          <div />
        </div>
      )}

      {/* Center Leica Split Crosshair & Horizon Indicator */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
        <div className="w-12 h-[1px] bg-white/30" />
        <div className="w-2.5 h-2.5 rounded-full border border-[#D4001A]/80 mx-1 flex items-center justify-center">
          <div className="w-0.5 h-0.5 rounded-full bg-[#D4001A]" />
        </div>
        <div className="w-12 h-[1px] bg-white/30" />
      </div>

      {/* Focus & Metering Reticle */}
      {focusPoint && (
        <div
          style={{ left: focusPoint.x - 30, top: focusPoint.y - 30 }}
          className="absolute w-15 h-15 pointer-events-none z-20 transition-all duration-150 animate-pulse"
        >
          <div className="w-full h-full border-2 border-[#D4001A] rounded-lg flex items-center justify-center bg-[#D4001A]/10">
            <Focus className="w-4 h-4 text-[#D4001A]" />
          </div>
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono tracking-wider font-bold text-white bg-black/80 border border-[#D4001A]/50 px-1 rounded">
            LEICA AF
          </span>
        </div>
      )}

      {/* Top Leica Viewfinder HUD Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
        {/* Leica Red Dot Brand & Style Badge */}
        <div className="flex items-center space-x-1.5 bg-black/70 px-2.5 py-1 rounded-full border border-white/10 text-xs shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4001A] flex items-center justify-center text-[7px] text-white font-serif font-black">
            L
          </span>
          <span className="font-mono text-zinc-100 font-bold text-[11px] tracking-wider">
            {colorStyle === 'Hangat' ? 'LEICA VIVID' : colorStyle === 'Mono' ? 'LEICA MONO' : 'LEICA NATURAL'}
          </span>
          {isAiEnhanced && (
            <span className="flex items-center space-x-0.5 text-[9px] font-mono font-bold text-red-300 bg-red-950/70 px-1.5 py-0.2 rounded-full border border-red-500/40">
              <Sparkles className="w-2.5 h-2.5 fill-[#D4001A] text-[#D4001A]" />
              <span>AI</span>
            </span>
          )}
        </div>

        {/* EV, Zoom & Histogram Toggle */}
        <div className="flex items-center space-x-1.5">
          <div className="flex items-center space-x-1.5 bg-black/70 px-2.5 py-1 rounded-full border border-white/10 text-xs font-mono shadow-md">
            <span className={evCompensation !== 0 ? 'text-[#D4001A] font-bold' : 'text-zinc-200'}>
              {evCompensation > 0 ? `+${evCompensation.toFixed(1)}` : evCompensation.toFixed(1)} EV
            </span>
            <span className="text-zinc-500 text-[10px]">·</span>
            <span className={zoomFactor > 1 ? 'text-[#D4001A] font-bold' : 'text-zinc-200'}>
              {zoomFactor.toFixed(1)}×
            </span>
          </div>

          {onToggleHistogram && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleHistogram();
              }}
              className={`p-1.5 rounded-full pointer-events-auto border transition-colors shadow-md ${
                showHistogram
                  ? 'bg-[#D4001A] text-white border-red-400 font-bold'
                  : 'bg-black/70 text-zinc-300 border-white/10 hover:text-white'
              }`}
              title="Toggle Tampilan Histogram"
              aria-label="Toggle Tampilan Histogram"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Leica Lens Telemetry HUD inside Viewfinder */}
      <div className="absolute bottom-2.5 inset-x-3 pointer-events-none z-10 flex items-center justify-between text-[10px] font-mono tracking-wider text-white/70">
        <span className="bg-black/60 px-2 py-0.5 rounded-md border border-white/10 font-bold text-zinc-300">
          SUMMICRON 1:1.9 / 19 ASPH.
        </span>
        <span className="bg-black/60 px-2 py-0.5 rounded-md border border-white/10 text-zinc-300">
          1/125s · ISO 100 · 1.0"
        </span>
      </div>

      {/* Floating Real-Time Histogram HUD */}
      {showHistogram && histogramData && (
        <div className="absolute top-12 right-2.5 z-20 pointer-events-auto">
          <Histogram data={histogramData} isSimulated={isSimulated} />
        </div>
      )}

      {/* Simulated Scene Selector (When in Simulation Mode) */}
      {isSimulated && (
        <div className="absolute bottom-9 left-3 right-3 z-20 flex justify-center">
          <div className="bg-black/80 p-1 rounded-xl border border-zinc-700/60 flex items-center space-x-1 text-[11px]">
            <span className="text-zinc-400 px-1 font-mono text-[10px]">SCENE:</span>
            {(['daylight', 'sunset', 'night', 'indoor'] as const).map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSimulatedScene(sc);
                }}
                className={`px-2 py-0.5 rounded-lg font-mono text-[10px] transition-colors ${
                  simulatedScene === sc
                    ? 'bg-[#D4001A] text-white font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {sc === 'daylight'
                  ? 'DAY'
                  : sc === 'sunset'
                  ? 'SUNSET'
                  : sc === 'night'
                  ? 'NIGHT'
                  : 'INDOOR'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Flash Capture Animation */}
      {isFlashing && (
        <div className="absolute inset-0 bg-white z-30 pointer-events-none transition-opacity duration-150 animate-out fade-out" />
      )}

      {/* Camera Permission / Error Banner (CAM-02 compliant) */}
      {cameraError && !isSimulated && (
        <div className="absolute inset-0 bg-black/90 z-30 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-[#D4001A] mb-3" />
          <h3 className="text-base font-bold font-mono text-white mb-1">AKSES KAMERA BELUM AKTIF</h3>
          <p className="text-zinc-400 text-xs mb-4 max-w-xs">{cameraError}</p>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestPermission();
              }}
              className="w-full bg-[#D4001A] hover:bg-red-600 text-white font-mono font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Minta Izin Kamera</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSimulatedScene('daylight');
              }}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-mono py-2 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors border border-zinc-700"
            >
              <Smartphone className="w-4 h-4 text-[#D4001A]" />
              <span>Simulasi Sensor 1" AQUOS R7s</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
