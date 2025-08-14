import type { GPXFile } from '../types/gpx';
import type { FeatureCollection, LineString } from 'geojson';

const GPX_STORAGE_KEY = 'gpx-tools-data';
const GEOJSON_STORAGE_KEY = 'gpx-tools-geojson-data';
const ORIGINAL_GEOJSON_STORAGE_KEY = 'gpx-tools-original-geojson-data';
const THINNING_OPTIONS_STORAGE_KEY = 'gpx-tools-thinning-options';

export interface ThinningOptions {
  type: 'none' | 'sequence' | 'time' | 'distance';
  value: number | null;
}

export interface CustomInputs {
  sequence: string;
  time: string;
  distance: string;
}

export interface StoredThinningData {
  options: ThinningOptions;
  customInputs: CustomInputs;
  lastModified: number;
}

export interface StoredGPXData {
  files: GPXFile[];
  lastModified: number;
}

export interface StoredGeoJSONData {
  data: FeatureCollection<LineString, any>;
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

export const saveGeoJSONData = (geoJson: FeatureCollection<LineString, any>): void => {
  const data: StoredGeoJSONData = {
    data: geoJson,
    lastModified: Date.now()
  };
  localStorage.setItem(GEOJSON_STORAGE_KEY, JSON.stringify(data));
};

export const loadGeoJSONData = (): FeatureCollection<LineString, any> | null => {
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

export const saveOriginalGeoJSONData = (geoJson: FeatureCollection<LineString>): void => {
  const data: StoredGeoJSONData = {
    data: geoJson,
    lastModified: Date.now()
  };
  localStorage.setItem(ORIGINAL_GEOJSON_STORAGE_KEY, JSON.stringify(data));
};

export const loadOriginalGeoJSONData = (): FeatureCollection<LineString> | null => {
  const stored = localStorage.getItem(ORIGINAL_GEOJSON_STORAGE_KEY);
  if (!stored) return null;

  try {
    const data: StoredGeoJSONData = JSON.parse(stored);
    return data.data;
  } catch {
    return null;
  }
};

export const clearOriginalGeoJSONData = (): void => {
  localStorage.removeItem(ORIGINAL_GEOJSON_STORAGE_KEY);
};

export const saveThinningOptions = (options: ThinningOptions, customInputs: CustomInputs): void => {
  const data: StoredThinningData = {
    options,
    customInputs,
    lastModified: Date.now()
  };
  localStorage.setItem(THINNING_OPTIONS_STORAGE_KEY, JSON.stringify(data));
};

export const loadThinningOptions = (): { options: ThinningOptions; customInputs: CustomInputs } | null => {
  const stored = localStorage.getItem(THINNING_OPTIONS_STORAGE_KEY);
  if (!stored) return null;

  try {
    const data: StoredThinningData = JSON.parse(stored);
    return {
      options: data.options,
      customInputs: data.customInputs
    };
  } catch {
    return null;
  }
};

export const clearThinningOptions = (): void => {
  localStorage.removeItem(THINNING_OPTIONS_STORAGE_KEY);
};
