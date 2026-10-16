/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TestBenchEntry, ColorStyle } from '../types/camera';
import { computeTestBenchSummary } from '../utils/cameraLogic';
import {
  X,
  Play,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Download,
  Activity,
  FileSpreadsheet,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface TestBenchModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: TestBenchEntry[];
  onRunBatchTest: () => Promise<void>;
  isRunningBatch: boolean;
  onResetTestBench: () => void;
}

export const TestBenchModal: React.FC<TestBenchModalProps> = ({
  isOpen,
  onClose,
  entries,
  onRunBatchTest,
  isRunningBatch,
  onResetTestBench,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'Terang' | 'Rendah'>('ALL');

  if (!isOpen) return null;

  const summary = computeTestBenchSummary(entries);

  const filteredEntries = entries.filter((e) => {
    if (filter === 'ALL') return true;
    return e.lighting === filter;
  });

  const exportToJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            title: 'AquaTone Camera PRD 30-Shot Test Bench Report',
            deviceTarget: 'Sharp AQUOS R7s (Android 10+ CameraX)',
            date: new Date().toISOString(),
            summary,
            entries,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `AquaTone_TestBench_30Shots_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportToCsv = () => {
    const headers =
      'ID,Timestamp,Pencahayaan,Gaya Warna,Status,Waktu Simpan (ms),Ukuran (KB),Ketajaman,Crash\n';
    const rows = entries
      .map(
        (e) =>
          `${e.id},"${new Date(e.timestamp).toISOString()}","${e.lighting}","${e.style}","${
            e.status
          }",${e.saveDurationMs},${e.fileSizeKb},${e.sharpnessScore},${e.crashRecorded ? 1 : 0}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AquaTone_Benchmark_Matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="testbench-title"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/80">
        <div className="flex items-center space-x-2.5">
          <Activity className="w-5 h-5 text-amber-400" />
          <div>
            <h2 id="testbench-title" className="text-sm font-semibold text-white tracking-wide">
              Matriks Pengujian 30 Foto (Kriteria PRD)
            </h2>
            <p className="text-[11px] text-zinc-400">
              Validasi stabilitas cahaya terang/rendah, waktu simpan, ketajaman & ukuran file
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Pengujian"
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full space-y-4">
        {/* Compliance Card */}
        <div
          className={`p-4 rounded-2xl border ${
            summary.meets30ShotCriteria
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              {summary.meets30ShotCriteria ? (
                <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
              )}
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  {summary.meets30ShotCriteria
                    ? 'Kriteria Penerimaan PRD Terpenuhi (30/30 Foto Lolos)'
                    : `Progres Uji: ${summary.completed}/30 Foto Tercatat`}
                </h3>
                <p className="text-xs opacity-80">
                  {summary.meets30ShotCriteria
                    ? 'Aplikasi stabil tanpa crash, seluruh gaya warna (Natural/Hangat/Mono) dan variasi pencahayaan telah divalidasi.'
                    : 'Jalankan pengujian batch otomatis untuk melengkapi 30 rekaman pengujian real-time.'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onRunBatchTest}
                disabled={isRunningBatch}
                className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all"
              >
                {isRunningBatch ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Menjalankan Uji ({summary.completed}/30)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-black" />
                    <span>Jalankan Uji 30 Foto Otomatis</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onResetTestBench}
                disabled={isRunningBatch}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700"
                title="Reset Matriks Uji"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10 text-xs font-mono">
            <div className="bg-black/40 p-2 rounded-xl">
              <span className="text-zinc-400 text-[10px] block">Rata-rata Simpan</span>
              <span className="text-amber-400 font-bold text-sm">
                {summary.avgSaveDurationMs} ms
              </span>
            </div>
            <div className="bg-black/40 p-2 rounded-xl">
              <span className="text-zinc-400 text-[10px] block">Ukuran Rata-rata</span>
              <span className="text-sky-400 font-bold text-sm">{summary.avgFileSizeKb} KB</span>
            </div>
            <div className="bg-black/40 p-2 rounded-xl">
              <span className="text-zinc-400 text-[10px] block">Skor Ketajaman</span>
              <span className="text-emerald-400 font-bold text-sm">
                {summary.avgSharpness}/100
              </span>
            </div>
            <div className="bg-black/40 p-2 rounded-xl">
              <span className="text-zinc-400 text-[10px] block">Crash Tercatat</span>
              <span
                className={`font-bold text-sm ${
                  summary.crashCount === 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {summary.crashCount} (Nol Crash)
              </span>
            </div>
          </div>
        </div>

        {/* Filters and Export buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
            {(['ALL', 'Terang', 'Rendah'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilter(mode)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filter === mode
                    ? 'bg-zinc-700 text-white font-medium'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {mode === 'ALL' ? 'Semua (30)' : `Cahaya ${mode}`}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={exportToJson}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-xl flex items-center space-x-1.5 border border-zinc-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor JSON</span>
            </button>
            <button
              type="button"
              onClick={exportToCsv}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-xl flex items-center space-x-1.5 border border-zinc-700 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto max-h-[50vh]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900/90 text-zinc-400 text-[11px] sticky top-0 border-b border-zinc-800">
                <tr>
                  <th className="p-2.5">No.</th>
                  <th className="p-2.5">Pencahayaan</th>
                  <th className="p-2.5">Gaya Warna</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Waktu Simpan</th>
                  <th className="p-2.5">Ukuran</th>
                  <th className="p-2.5">Ketajaman</th>
                  <th className="p-2.5">Crash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {filteredEntries.map((e) => (
                  <tr
                    key={e.id}
                    className={`hover:bg-zinc-900/40 transition-colors ${
                      e.status === 'PASS' ? 'bg-emerald-950/10' : ''
                    }`}
                  >
                    <td className="p-2.5 font-bold text-zinc-500">#{e.id}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                          e.lighting === 'Terang'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {e.lighting}
                      </span>
                    </td>
                    <td className="p-2.5 font-medium">{e.style}</td>
                    <td className="p-2.5">
                      <span
                        className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] ${
                          e.status === 'PASS'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : e.status === 'FAIL'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {e.status === 'PASS' && <Check className="w-3 h-3" />}
                        <span>{e.status}</span>
                      </span>
                    </td>
                    <td className="p-2.5">
                      {e.status === 'PENDING' ? '-' : `${e.saveDurationMs} ms`}
                    </td>
                    <td className="p-2.5">{e.status === 'PENDING' ? '-' : `${e.fileSizeKb} KB`}</td>
                    <td className="p-2.5">
                      {e.status === 'PENDING' ? '-' : `${e.sharpnessScore}/100`}
                    </td>
                    <td className="p-2.5 font-sans">
                      {e.crashRecorded ? (
                        <span className="text-rose-400 font-bold">CRASH</span>
                      ) : (
                        <span className="text-emerald-400 text-[11px]">Nihil (Aman)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
