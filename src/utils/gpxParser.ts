import type { GPXFile, GPXTrack, GPXTrackSegment, GPXTrackPoint } from '../types/gpx';

export const parseGPXFile = async (file: File): Promise<GPXFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const xmlString = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        // Check for parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
          throw new Error('Invalid GPX file format');
        }

        const gpxElement = xmlDoc.querySelector('gpx');
        if (!gpxElement) {
          throw new Error('No GPX element found');
        }

        const tracks: GPXTrack[] = [];
        const trackElements = xmlDoc.querySelectorAll('trk');

        trackElements.forEach((trkElement) => {
          const trackName = trkElement.querySelector('name')?.textContent || undefined;
          const segments: GPXTrackSegment[] = [];

          const segmentElements = trkElement.querySelectorAll('trkseg');
          segmentElements.forEach((segElement) => {
            const points: GPXTrackPoint[] = [];

            const pointElements = segElement.querySelectorAll('trkpt');
            pointElements.forEach((ptElement) => {
              const lat = parseFloat(ptElement.getAttribute('lat') || '0');
              const lon = parseFloat(ptElement.getAttribute('lon') || '0');
              const eleElement = ptElement.querySelector('ele');
              const timeElement = ptElement.querySelector('time');

              const point: GPXTrackPoint = {
                lat,
                lon,
                ele: eleElement ? parseFloat(eleElement.textContent || '0') : undefined,
                time: timeElement ? new Date(timeElement.textContent || '') : undefined,
              };

              points.push(point);
            });

            if (points.length > 0) {
              segments.push({ points });
            }
          });

          if (segments.length > 0) {
            tracks.push({ name: trackName, segments });
          }
        });

        // Extract the earliest time from all track points for file sorting
        let earliestTime: Date | undefined;
        tracks.forEach(track => {
          track.segments.forEach(segment => {
            segment.points.forEach(point => {
              if (point.time && (!earliestTime || point.time < earliestTime)) {
                earliestTime = point.time;
              }
            });
          });
        });

        const gpxFile: GPXFile = {
          name: file.name,
          tracks,
          createdAt: earliestTime,
        };

        resolve(gpxFile);
      } catch (error) {
        reject(new Error(`Failed to parse GPX file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

export const sortGPXFilesByDate = (files: GPXFile[]): GPXFile[] => {
  return [...files].sort((a, b) => {
    // Files without dates go to the end
    if (!a.createdAt && !b.createdAt) return 0;
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;

    return a.createdAt.getTime() - b.createdAt.getTime();
  });
};

export const getTotalTrackCount = (files: GPXFile[]): number => {
  return files.reduce((total, file) => total + file.tracks.length, 0);
};
