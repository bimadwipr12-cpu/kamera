/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AquaTonePhoto } from '../types/camera';
import { downloadPhotoToDevice, savePhotoToStorage } from '../services/storage';
import { enhancePhotoWithAi } from '../services/aiEnhancer';
import {
  X,
  Download,
  Trash2,
  FolderOpen,
  Info,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Clock,
  HardDrive,
  Cpu,
  Layers,
  Wand2,
} from 'lucide-react';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: AquaTonePhoto[];
  onDeletePhoto: (id: string) => void;
  onClearAll: () => void;
  onUpdatePhoto?: (updated: AquaTonePhoto) => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  photos,
  onDeletePhoto,
  onClearAll,
  onUpdatePhoto,
}) => {
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);

  const selectedPhoto =
    (selectedPhotoId ? photos.find((p) => p.id === selectedPhotoId) : null) ||
    (photos.length > 0 ? photos[0] : null);

  const handleEnhanceWithAi = async () => {
    if (!selectedPhoto || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await enhancePhotoWithAi(
        selectedPhoto.dataUrl,
        selectedPhoto.style,
        selectedPhoto.evCompensation
      );
      const updated: AquaTonePhoto = {
        ...selectedPhoto,
        dataUrl: res.enhancedDataUrl,
        isAiEnhanced: true,
        aiPresetName: res.aiPresetName,
        aiCritique: res.critiqueNotes,
        metadata: {
          ...selectedPhoto.metadata,
          aiProcessing: `${res.aiPresetName} (${res.isAiServerPowered ? 'Gemini AI Cloud' : 'Neural Adaptive Engine'})`,
        },
      };
      await savePhotoToStorage(updated);
      if (onUpdatePhoto) {
        onUpdatePhoto(updated);
      }
    } catch (err: any) {
      console.error('AI Enhance error:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-title"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/80">
        <div className="flex items-center space-x-2.5">
          <FolderOpen className="w-5 h-5 text-amber-400" />
          <div>
            <h2 id="gallery-title" className="text-sm font-semibold text-white tracking-wide">
              Pictures/AquaTone
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono">
              {photos.length} Foto Tersimpan
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {photos.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Hapus semua foto dari Pictures/AquaTone?')) {
                  onClearAll();
                  setSelectedPhotoId(null);
                }
              }}
              className="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/20"
            >
              Bersihkan Semua
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Galeri"
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
          <Layers className="w-12 h-12 text-zinc-600 mb-3" />
          <h3 className="text-base font-semibold text-zinc-200 mb-1">
            Belum Ada Foto di Pictures/AquaTone
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mb-4">
            Tekan tombol rana untuk mengambil foto dengan gaya warna Natural, Hangat, atau Mono.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-xl transition-colors"
          >
            Kembali ke Kamera
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Photo Viewer Lightbox */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 relative bg-zinc-950 overflow-hidden">
            {selectedPhoto && (
              <div className="relative max-w-full max-h-[60vh] md:max-h-[75vh] flex items-center justify-center">
                <img
                  src={selectedPhoto.dataUrl}
                  alt={selectedPhoto.filename}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-zinc-800"
                />

                {/* Floating Style Badge */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-xs font-mono flex items-center space-x-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedPhoto.style === 'Natural'
                        ? 'bg-sky-400'
                        : selectedPhoto.style === 'Hangat'
                        ? 'bg-amber-400'
                        : 'bg-zinc-200'
                    }`}
                  />
                  <span className="text-white font-semibold">{selectedPhoto.style}</span>
                  <span className="text-zinc-400 text-[10px]">
                    {selectedPhoto.zoomFactor.toFixed(1)}×
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Actions for Selected Photo */}
            {selectedPhoto && (
              <div className="mt-3 flex items-center space-x-2.5 z-10 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => downloadPhotoToDevice(selectedPhoto)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh JPEG</span>
                </button>

                <button
                  type="button"
                  onClick={handleEnhanceWithAi}
                  disabled={isEnhancing}
                  className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                  title="Tingkatkan warna, kontras, dan detail bayangan dengan AI"
                >
                  {isEnhancing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Grading AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>{selectedPhoto.isAiEnhanced ? 'Re-Grading AI' : 'Tingkatkan AI'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onDeletePhoto(selectedPhoto.id);
                    const remaining = photos.filter((p) => p.id !== selectedPhoto.id);
                    setSelectedPhotoId(remaining.length > 0 ? remaining[0].id : null);
                  }}
                  className="px-3 py-2 bg-zinc-800 hover:bg-rose-900/40 text-zinc-300 hover:text-rose-300 border border-zinc-700 hover:border-rose-700/50 text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus</span>
                </button>
              </div>
            )}
          </div>

          {/* Sidebar / Bottom Thumbnails & EXIF Metadata Details */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-900/60 p-4 flex flex-col overflow-y-auto">
            {/* Horizontal / Grid Thumbnails */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
                Daftar Foto
              </h3>
              <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 bg-black/40 rounded-xl border border-zinc-800">
                {photos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPhotoId(p.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPhoto?.id === p.id
                        ? 'border-amber-400 scale-95 shadow-md'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={p.dataUrl} alt={p.filename} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] font-mono text-center text-zinc-200 py-0.5 truncate">
                      {p.style[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* EXIF & Technical Metadata Inspector */}
            {selectedPhoto && (
              <div className="flex-1 bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800 space-y-3 text-xs">
                <div className="flex items-center space-x-2 border-b border-zinc-800 pb-2">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white">Metadata & EXIF</span>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Nama Berkas</span>
                    <span className="text-zinc-200 break-all select-all font-semibold">
                      {selectedPhoto.filename}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Gaya Warna</span>
                      <span className="text-amber-400 font-semibold">{selectedPhoto.style}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Resolusi</span>
                      <span className="text-zinc-200">
                        {selectedPhoto.width} × {selectedPhoto.height}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Ukuran Berkas</span>
                      <span className="text-zinc-200">
                        {(selectedPhoto.fileSizeBytes / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Waktu Simpan</span>
                      <span className="text-emerald-400">{selectedPhoto.saveDurationMs} ms</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Kompensasi EV</span>
                      <span className="text-zinc-200">
                        {selectedPhoto.evCompensation > 0
                          ? `+${selectedPhoto.evCompensation.toFixed(1)}`
                          : selectedPhoto.evCompensation.toFixed(1)}{' '}
                        EV
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Skor Ketajaman</span>
                      <span className="text-zinc-200">{selectedPhoto.sharpnessScore}/100</span>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800/80 pt-2 space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Perangkat:</span>
                      <span className="text-zinc-200">{selectedPhoto.metadata.device}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Sensor:</span>
                      <span className="text-zinc-200">{selectedPhoto.metadata.sensor}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Lensa:</span>
                      <span className="text-zinc-200">
                        {selectedPhoto.metadata.focalLength} {selectedPhoto.metadata.aperture}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Folder Simpan:</span>
                      <span className="text-amber-400">{selectedPhoto.metadata.storagePath}</span>
                    </div>
                  </div>

                  {selectedPhoto.isAiEnhanced && (
                    <div className="border-t border-purple-500/30 pt-2 space-y-1 bg-purple-950/20 p-2 rounded-xl border border-purple-500/20">
                      <div className="flex items-center space-x-1.5 text-purple-300 font-bold text-[10px]">
                        <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>Peningkatan AI Aktif</span>
                      </div>
                      <div className="text-amber-300 text-[10px] font-semibold">
                        {selectedPhoto.metadata.aiProcessing || selectedPhoto.aiPresetName}
                      </div>
                      {selectedPhoto.aiCritique && (
                        <p className="text-zinc-300 text-[9px] italic leading-tight pt-0.5">
                          "{selectedPhoto.aiCritique}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
