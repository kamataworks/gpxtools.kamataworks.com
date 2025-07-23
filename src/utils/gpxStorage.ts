import type { GPXFile } from '../types/gpx';

const GPX_STORAGE_KEY = 'gpx-tools-data';

export interface StoredGPXData {
  files: GPXFile[];
  lastModified: number;
}

export const saveGPXData = (files: GPXFile[]): void => {
  const data: StoredGPXData = {
    files,
    lastModified: Date.now()
  };
  localStorage.setItem(GPX_STORAGE_KEY, JSON.stringify(data));
};

export const loadGPXData = (): GPXFile[] | null => {
  const stored = localStorage.getItem(GPX_STORAGE_KEY);
  if (!stored) return null;

  try {
    const data: StoredGPXData = JSON.parse(stored);
    return data.files;
  } catch {
    return null;
  }
};

export const clearGPXData = (): void => {
  localStorage.removeItem(GPX_STORAGE_KEY);
};
