import type { GPXFile } from '../types/gpx';
import type { FeatureCollection, LineString } from 'geojson';

const GPX_STORAGE_KEY = 'gpx-tools-data';
const GEOJSON_STORAGE_KEY = 'gpx-tools-geojson-data';

export interface StoredGPXData {
  files: GPXFile[];
  lastModified: number;
}

export interface StoredGeoJSONData {
  data: FeatureCollection<LineString>;
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

export const saveGeoJSONData = (geoJson: FeatureCollection<LineString>): void => {
  const data: StoredGeoJSONData = {
    data: geoJson,
    lastModified: Date.now()
  };
  localStorage.setItem(GEOJSON_STORAGE_KEY, JSON.stringify(data));
};

export const loadGeoJSONData = (): FeatureCollection<LineString> | null => {
  const stored = localStorage.getItem(GEOJSON_STORAGE_KEY);
  if (!stored) return null;

  try {
    const data: StoredGeoJSONData = JSON.parse(stored);
    return data.data;
  } catch {
    return null;
  }
};

export const clearGeoJSONData = (): void => {
  localStorage.removeItem(GEOJSON_STORAGE_KEY);
};
