export interface Region {
  code: string;
  name: string;
  capital: string;
  color: string;
  secondaryColor: string;
  departments: string[];
  population: number;
  areaKm2: number;
}

export interface InsetBox {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  code: string;
}

export interface Department {
  code: string;
  name: string;
  regionCode: string;
  regionName: string;
  prefecture: string;
  prefectureCoords: [number, number];
  prefecturePoint: [number, number];
  subPrefectures: string[];
  population: number;
  areaKm2: number;
  density: number;
  svgPath: string;
  centroid: [number, number];
  bounds: [[number, number], [number, number]];
  isOverseas: boolean;
  insetBox?: InsetBox;
}

export interface City {
  id: string;
  name: string;
  departmentCode: string;
  regionCode: string;
  regionName: string;
  population: number;
  type: 'capitale' | 'prefecture_region' | 'prefecture' | 'subprefecture' | 'city';
  lng: number;
  lat: number;
  x: number;
  y: number;
}

export interface FranceMapData {
  viewBox: string;
  width: number;
  height: number;
  regions: Region[];
  departments: Department[];
  cities: City[];
}

export type ColorMode = 'region' | 'density' | 'population';
export type CityVisibility = 'all' | 'major' | 'none';
export type DeptLabelMode = 'both' | 'name' | 'code' | 'none';
