/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HistogramData, downsampleHistogram } from '../utils/histogram';
import { BarChart3, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface HistogramProps {
  data: HistogramData | null;
  className?: string;
  isSimulated?: boolean;
}

export const Histogram: React.FC<HistogramProps> = ({
  data,
  className = '',
  isSimulated = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [channelMode, setChannelMode] = useState<'luma' | 'rgb'>('luma');

  if (!data) return null;

  const targetBars = 32;
  const lumaBars = downsampleHistogram(data.luminance, targetBars);
  const rBars = downsampleHistogram(data.red, targetBars);
  const gBars = downsampleHistogram(data.green, targetBars);
  const bBars = downsampleHistogram(data.blue, targetBars);

  return (
    <div
      role="region"
      aria-label="Histogram Kecerahan Real-Time"
      className={`select-none pointer-events-auto transition-all duration-200 ${className}`}
    >
      <div className="bg-black/80 backdrop-blur-md border border-zinc-700/80 rounded-xl overflow-hidden shadow-2xl p-2 font-mono">
        {/* Header / Toggle Row */}
        <div className="flex items-center justify-between text-[10px] pb-1 border-b border-zinc-800">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center space-x-1.5 text-zinc-300 hover:text-white transition-colors"
            title="Sembunyikan/Tampilkan Histogram"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#D4001A]" />
            <span className="font-semibold tracking-wider">HISTOGRAM</span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3 text-zinc-500" />
            ) : (
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            )}
          </button>

          {isExpanded && (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setChannelMode('luma')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                  channelMode === 'luma'
                    ? 'bg-[#D4001A] text-white font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                LUMA
              </button>
              <button
                type="button"
                onClick={() => setChannelMode('rgb')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                  channelMode === 'rgb'
                    ? 'bg-zinc-700 text-white font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                RGB
              </button>
            </div>
          )}

          {!isExpanded && (
            <span
              className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                data.exposureState === 'Optimal'
                  ? 'text-emerald-400 bg-emerald-950/40'
                  : 'text-[#D4001A] bg-red-950/40'
              }`}
            >
              L:{data.meanLuminance}
            </span>
          )}
        </div>

        {/* Expanded Histogram Visuals */}
        {isExpanded && (
          <div className="pt-1.5 space-y-1">
            {/* Chart Area */}
            <div className="relative h-12 w-48 bg-zinc-950/90 rounded border border-zinc-800/80 overflow-hidden flex items-end px-0.5">
              {/* Grid zones: Shadows / Mids / Highlights */}
              <div className="absolute inset-0 grid grid-cols-3 pointer-events-none opacity-20">
                <div className="border-r border-zinc-600" />
                <div className="border-r border-zinc-600" />
                <div />
              </div>

              {/* Luma Mode Bars */}
              {channelMode === 'luma' && (
                <div className="w-full h-full flex items-end gap-[1px]">
                  {lumaBars.map((heightPercent, idx) => {
                    const barHeight = Math.max(3, Math.round(heightPercent * 44));
                    const isShadow = idx < 8;
                    const isHighlight = idx >= 24;

                    return (
                      <div
                        key={idx}
                        style={{ height: `${barHeight}px` }}
                        className={`flex-1 rounded-t-[1px] transition-all duration-75 ${
                          isShadow && data.shadowClippingPercent > 10 && idx === 0
                            ? 'bg-indigo-400 animate-pulse'
                            : isHighlight && data.highlightClippingPercent > 10 && idx === targetBars - 1
                            ? 'bg-rose-500 animate-pulse'
                            : 'bg-zinc-200/90'
                        }`}
                      />
                    );
                  })}
                </div>
              )}

              {/* RGB Channel Overlay Mode */}
              {channelMode === 'rgb' && (
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
                  {/* Red channel */}
                  <path
                    d={`M 0 50 ${rBars
                      .map((val, i) => `L ${(i / (targetBars - 1)) * 100} ${50 - val * 45}`)
                      .join(' ')} L 100 50 Z`}
                    fill="rgba(239, 68, 68, 0.25)"
                    stroke="rgba(239, 68, 68, 0.9)"
                    strokeWidth="1.2"
                  />
                  {/* Green channel */}
                  <path
                    d={`M 0 50 ${gBars
                      .map((val, i) => `L ${(i / (targetBars - 1)) * 100} ${50 - val * 45}`)
                      .join(' ')} L 100 50 Z`}
                    fill="rgba(34, 197, 94, 0.25)"
                    stroke="rgba(34, 197, 94, 0.9)"
                    strokeWidth="1.2"
                  />
                  {/* Blue channel */}
                  <path
                    d={`M 0 50 ${bBars
                      .map((val, i) => `L ${(i / (targetBars - 1)) * 100} ${50 - val * 45}`)
                      .join(' ')} L 100 50 Z`}
                    fill="rgba(59, 130, 246, 0.25)"
                    stroke="rgba(59, 130, 246, 0.9)"
                    strokeWidth="1.2"
                  />
                </svg>
              )}

              {/* Left Shadow Clipping Warning */}
              {data.shadowClippingPercent > 10 && (
                <div
                  title={`Bayangan Terpotong: ${data.shadowClippingPercent}%`}
                  className="absolute left-0.5 top-0.5 flex items-center space-x-0.5 bg-indigo-950/90 border border-indigo-500/50 px-1 py-0.2 rounded text-[8px] text-indigo-300"
                >
                  <AlertCircle className="w-2.5 h-2.5 text-indigo-400" />
                  <span>CRUSH</span>
                </div>
              )}

              {/* Right Highlight Clipping Warning */}
              {data.highlightClippingPercent > 10 && (
                <div
                  title={`Sorotan Terpotong: ${data.highlightClippingPercent}%`}
                  className="absolute right-0.5 top-0.5 flex items-center space-x-0.5 bg-rose-950/90 border border-rose-500/50 px-1 py-0.2 rounded text-[8px] text-rose-300"
                >
                  <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                  <span>BLOWN</span>
                </div>
              )}
            </div>

            {/* Bottom Status & Recommendation */}
            <div className="flex items-center justify-between text-[9px] pt-0.5 text-zinc-400">
              <div className="flex items-center space-x-1">
                <span>Rata2:</span>
                <span className="text-zinc-200 font-bold">{data.meanLuminance}</span>
                <span className="text-zinc-600">/255</span>
              </div>

              <div
                className={`truncate max-w-[120px] text-right font-medium ${
                  data.exposureState === 'Optimal'
                    ? 'text-emerald-400'
                    : data.exposureState === 'HighContrast'
                    ? 'text-sky-400'
                    : 'text-amber-400'
                }`}
                title={data.exposureRecommendation}
              >
                {data.exposureRecommendation}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
