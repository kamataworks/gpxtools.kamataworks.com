export interface GPXTrack {
  name?: string;
  segments: GPXTrackSegment[];
}

export interface GPXTrackSegment {
  points: GPXTrackPoint[];
}

export interface GPXTrackPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: Date;
}

export interface GPXFile {
  name: string;
  tracks: GPXTrack[];
  waypoints?: GPXWaypoint[];
  routes?: GPXRoute[];
  metadata?: GPXMetadata;
  createdAt?: Date;
}

export interface GPXWaypoint {
  lat: number;
  lon: number;
  name?: string;
  desc?: string;
  ele?: number;
  time?: Date;
}

export interface GPXRoute {
  name?: string;
  points: GPXRoutePoint[];
}

export interface GPXRoutePoint {
  lat: number;
  lon: number;
  name?: string;
  desc?: string;
  ele?: number;
}

export interface GPXMetadata {
  name?: string;
  desc?: string;
  author?: string;
  time?: Date;
}

export interface GPXFileSummary {
  totalFiles: number;
  totalTracks: number;
  files: GPXFile[];
}
