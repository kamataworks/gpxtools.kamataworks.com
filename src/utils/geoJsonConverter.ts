import type { GPXFile } from '../types/gpx';
import type { FeatureCollection, Feature, LineString } from 'geojson';

export interface TimeOverlapResult {
  hasOverlap: boolean;
  overlappingTracks: Array<{
    file1: string;
    track1: string;
    file2: string;
    track2: string;
    overlapStart: Date;
    overlapEnd: Date;
  }>;
}

export const convertGPXToGeoJSON = (gpxFiles: GPXFile[]): FeatureCollection<LineString, { fileName: string, mode: 'linestring', trackName: string, fileIndex: number, trackIndex: number, segmentIndex: number, timeStamps: (string | null)[], pointIds: string[] }> => {
  const features: Feature<LineString, { fileName: string, mode: 'linestring', trackName: string, fileIndex: number, trackIndex: number, segmentIndex: number, timeStamps: (string | null)[], pointIds: string[] }>[] = [];

  gpxFiles.forEach((file, fileIndex) => {
    file.tracks.forEach((track, trackIndex) => {
      track.segments.forEach((segment, segmentIndex) => {
        if (segment.points.length > 1) {
          const coordinates: [number, number][] = segment.points.map(point => [
            parseFloat(point.lon.toFixed(9)),
            parseFloat(point.lat.toFixed(9)),
          ]);

          const timeStamps: (string | null)[] = segment.points.map(point =>
            point.time ? point.time.toISOString() : null
          );

          // 各点に一意のIDを付与
          const pointIds: string[] = segment.points.map((_, pointIndex) =>
            `${fileIndex}-${trackIndex}-${segmentIndex}-${pointIndex}`
          );

          features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates
            },
            properties: {
              fileName: file.name,
              mode: 'linestring',
              trackName: track.name || `Track ${trackIndex + 1}`,
              fileIndex,
              trackIndex,
              segmentIndex,
              timeStamps,
              pointIds
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

export const convertGeoJSONToGPX = (geoJson: FeatureCollection<LineString, { fileName: string, timeStamps?: (string | null)[] }>, includeTime: boolean = true): string => {
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX Tools" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Edited GPX</name>
    <time>${new Date().toISOString()}</time>
  </metadata>`;

  const gpxFooter = '</gpx>';

  let tracks = '';
  const tracksByFile = new Map<string, Feature<LineString, { fileName: string, timeStamps?: (string | null)[] }>[]>();

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

      feature.geometry.coordinates.forEach(([lon, lat], index) => {
        const timeStamps = feature.properties.timeStamps;
        const timeStamp = timeStamps && timeStamps[index] ? timeStamps[index] : null;

        tracks += `
      <trkpt lat="${lat}" lon="${lon}">`;

        if (includeTime && timeStamp) {
          tracks += `
        <time>${timeStamp}</time>`;
        }

        tracks += `
      </trkpt>`;
      });

      tracks += `
    </trkseg>`;
    });

    tracks += `
  </trk>`;
  });

  return gpxHeader + tracks + gpxFooter;
};

export const checkTimeRangeOverlaps = (gpxFiles: GPXFile[]): TimeOverlapResult => {
  const trackTimeRanges: Array<{
    fileName: string;
    trackName: string;
    startTime: Date;
    endTime: Date;
  }> = [];

  // Extract time ranges for each track
  gpxFiles.forEach(file => {
    file.tracks.forEach((track, trackIndex) => {
      const allPoints = track.segments.flatMap(segment => segment.points);
      const pointsWithTime = allPoints.filter(point => point.time);

      if (pointsWithTime.length > 0) {
        // @ts-expect-error - point.time is filtered to be non-null above
        const times = pointsWithTime.map(point => new Date(point.time));
        const startTime = new Date(Math.min(...times.map(t => t.getTime())));
        const endTime = new Date(Math.max(...times.map(t => t.getTime())));

        trackTimeRanges.push({
          fileName: file.name,
          trackName: track.name || `Track ${trackIndex + 1}`,
          startTime,
          endTime
        });
      }
    });
  });

  // Check for overlaps
  const overlappingTracks: TimeOverlapResult['overlappingTracks'] = [];

  for (let i = 0; i < trackTimeRanges.length; i++) {
    for (let j = i + 1; j < trackTimeRanges.length; j++) {
      const track1 = trackTimeRanges[i];
      const track2 = trackTimeRanges[j];

      // Check if time ranges overlap: (start1 <= end2) && (start2 <= end1)
      if (track1.startTime <= track2.endTime && track2.startTime <= track1.endTime) {
        const overlapStart = new Date(Math.max(track1.startTime.getTime(), track2.startTime.getTime()));
        const overlapEnd = new Date(Math.min(track1.endTime.getTime(), track2.endTime.getTime()));

        overlappingTracks.push({
          file1: track1.fileName,
          track1: track1.trackName,
          file2: track2.fileName,
          track2: track2.trackName,
          overlapStart,
          overlapEnd
        });
      }
    }
  }

  return {
    hasOverlap: overlappingTracks.length > 0,
    overlappingTracks
  };
};

export const convertGPXToMergedGeoJSON = (gpxFiles: GPXFile[]): FeatureCollection<LineString, { fileName: string, mode: 'linestring' }> => {
  // Collect all points with their timestamps
  const allPointsWithTime: Array<{
    point: { lat: number; lon: number };
    time: Date | null;
    fileName: string;
  }> = [];

  gpxFiles.forEach(file => {
    file.tracks.forEach(track => {
      track.segments.forEach(segment => {
        segment.points.forEach(point => {
          allPointsWithTime.push({
            point: { lat: point.lat, lon: point.lon },
            time: point.time || null,
            fileName: file.name
          });
        });
      });
    });
  });

  // Sort by time if available, otherwise maintain original order
  allPointsWithTime.sort((a, b) => {
    if (a.time && b.time) {
      return new Date(a.time).getTime() - new Date(b.time).getTime();
    }
    // If either doesn't have time, maintain original order
    return 0;
  });

  // Create coordinates array
  const coordinates: [number, number][] = allPointsWithTime.map(item => [
    parseFloat(item.point.lon.toFixed(9)),
    parseFloat(item.point.lat.toFixed(9))
  ]);

  // Create time stamps array
  const timeStamps: (string | null)[] = allPointsWithTime.map(item =>
    item.time ? item.time.toISOString() : null
  );

  // Get unique file names for the merged track name
  const fileNames = [...new Set(allPointsWithTime.map(item => item.fileName))];
  const mergedFileName = fileNames.join(' + ');

  const feature: Feature<LineString, { fileName: string, mode: 'linestring', timeStamps: (string | null)[] }> = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates
    },
    properties: {
      fileName: mergedFileName,
      mode: 'linestring',
      timeStamps
    }
  };

  return {
    type: 'FeatureCollection',
    features: [feature]
  };
};
