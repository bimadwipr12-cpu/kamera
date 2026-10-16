/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AquaTonePhoto } from '../types/camera';

const DB_NAME = 'AquaToneCameraDB';
const DB_VERSION = 1;
const STORE_NAME = 'Pictures_AquaTone';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung pada browser ini.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('style', 'style', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves photo to simulated storage directory: Pictures/AquaTone (PRD IMG-01)
 */
export async function savePhotoToStorage(photo: AquaTonePhoto): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(photo);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal menyimpan ke IndexedDB, menggunakan memori lokal:', err);
  }
}

/**
 * Retrieves all photos in Pictures/AquaTone sorted newest first
 */
export async function getPhotosFromStorage(): Promise<AquaTonePhoto[]> {
  try {
    const db = await openDatabase();
    return await new Promise<AquaTonePhoto[]>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as AquaTonePhoto[];
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal memuat galeri:', err);
    return [];
  }
}

/**
 * Deletes a single photo by id
 */
export async function deletePhotoFromStorage(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal menghapus foto:', err);
  }
}

/**
 * Clears all photos from Pictures/AquaTone
 */
export async function clearAllPhotosFromStorage(): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal membersihkan penyimpanan:', err);
  }
}

/**
 * Direct file download trigger for saving JPEG to device filesystem
 */
export function downloadPhotoToDevice(photo: AquaTonePhoto): void {
  const link = document.createElement('a');
  link.href = photo.dataUrl;
  link.download = photo.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
