import type { GPXFile } from '../types/gpx';

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  properties: {
    fileName: string;
    trackName: string;
    fileIndex: number;
    trackIndex: number;
    segmentIndex: number;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export const convertGPXToGeoJSON = (gpxFiles: GPXFile[]): GeoJSONFeatureCollection => {
  const features: GeoJSONFeature[] = [];

  gpxFiles.forEach((file, fileIndex) => {
    file.tracks.forEach((track, trackIndex) => {
      track.segments.forEach((segment, segmentIndex) => {
        if (segment.points.length > 1) {
          const coordinates: [number, number][] = segment.points.map(point => [
            point.lon,
            point.lat
          ]);

          features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates
            },
            properties: {
              fileName: file.name,
              trackName: track.name || `Track ${trackIndex + 1}`,
              fileIndex,
              trackIndex,
              segmentIndex
            }
          });
        }
      });
    });
  });

  return {
    type: 'FeatureCollection',
    features
  };
};

export const convertGeoJSONToGPX = (geoJson: GeoJSONFeatureCollection): string => {
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX Tools" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Edited GPX</name>
    <time>${new Date().toISOString()}</time>
  </metadata>`;

  const gpxFooter = '</gpx>';

  let tracks = '';
  const tracksByFile = new Map<string, GeoJSONFeature[]>();

  // Group features by file name
  geoJson.features.forEach(feature => {
    const fileName = feature.properties.fileName;
    if (!tracksByFile.has(fileName)) {
      tracksByFile.set(fileName, []);
    }
    tracksByFile.get(fileName)!.push(feature);
  });

  // Generate tracks for each file
  tracksByFile.forEach((features, fileName) => {
    tracks += `  <trk>
    <name>${fileName}</name>`;

    features.forEach(feature => {
      tracks += `
    <trkseg>`;

      feature.geometry.coordinates.forEach(([lon, lat]) => {
        tracks += `
      <trkpt lat="${lat}" lon="${lon}"></trkpt>`;
      });

      tracks += `
    </trkseg>`;
    });

    tracks += `
  </trk>`;
  });

  return gpxHeader + tracks + gpxFooter;
};
