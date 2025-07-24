import type { GPXFile } from '../types/gpx';
import type { FeatureCollection, Feature, LineString } from 'geojson';


export const convertGPXToGeoJSON = (gpxFiles: GPXFile[]): FeatureCollection => {
  const features: Feature[] = [];

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

export const convertGeoJSONToGPX = (geoJson: FeatureCollection<LineString, { fileName: string }>): string => {
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX Tools" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Edited GPX</name>
    <time>${new Date().toISOString()}</time>
  </metadata>`;

  const gpxFooter = '</gpx>';

  let tracks = '';
  const tracksByFile = new Map<string, Feature[]>();

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
