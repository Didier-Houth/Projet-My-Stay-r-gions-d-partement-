import mapDataRaw from './franceMapData.json';
import { FranceMapData, Department, Region, City } from '../types';

export const franceData: FranceMapData = mapDataRaw as FranceMapData;

export const regionsMap = new Map<string, Region>(
  franceData.regions.map(r => [r.code, r])
);

export const departmentsMap = new Map<string, Department>(
  franceData.departments.map(d => [d.code, d])
);

export const departmentsList = franceData.departments;
export const regionsList = franceData.regions;
export const citiesList = franceData.cities;

// Helper to compute min/max for choropleths
export const maxDensity = Math.max(...franceData.departments.map(d => d.density));
export const minDensity = Math.min(...franceData.departments.map(d => d.density));
export const maxPopulation = Math.max(...franceData.departments.map(d => d.population));
export const minPopulation = Math.min(...franceData.departments.map(d => d.population));

// Density color scale (from soft amber/green up to vibrant crimson/purple)
export function getDensityColor(density: number): string {
  // logarithmic scale because Paris is ~20000 hab/km2 while Lozère is ~15 hab/km2
  const logMin = Math.log(15);
  const logMax = Math.log(1500); // saturate around dense urban
  const logVal = Math.max(logMin, Math.min(logMax, Math.log(density)));
  const ratio = (logVal - logMin) / (logMax - logMin);

  // interpolating: light yellow-green (0.0) -> amber (0.35) -> orange (0.6) -> deep red-violet (1.0)
  if (ratio < 0.25) return '#bbf7d0'; // emerald 200
  if (ratio < 0.45) return '#6ee7b7'; // emerald 300
  if (ratio < 0.65) return '#fde047'; // yellow 300
  if (ratio < 0.8) return '#fb923c'; // orange 400
  if (ratio < 0.92) return '#ef4444'; // red 500
  return '#9333ea'; // purple 600
}

// Population color scale
export function getPopulationColor(pop: number): string {
  const ratio = Math.min(1, Math.max(0, (pop - 100000) / (2000000 - 100000)));
  if (ratio < 0.15) return '#bae6fd'; // sky 200
  if (ratio < 0.35) return '#7dd3fc'; // sky 300
  if (ratio < 0.55) return '#38bdf8'; // sky 400
  if (ratio < 0.75) return '#0284c7'; // sky 600
  if (ratio < 0.9) return '#1d4ed8'; // blue 700
  return '#1e1b4b'; // indigo 950
}

export interface RegionCentroid {
  code: string;
  name: string;
  x: number;
  y: number;
  isOverseas: boolean;
}

export const regionCentroids: RegionCentroid[] = [
  // 13 Régions Métropolitaines
  { code: '11', name: 'Île-de-France', x: 434, y: 254, isOverseas: false },
  { code: '84', name: 'Auvergne-Rhône-Alpes', x: 573, y: 498, isOverseas: false },
  { code: '75', name: 'Nouvelle-Aquitaine', x: 325, y: 525, isOverseas: false },
  { code: '76', name: 'Occitanie', x: 431, y: 659, isOverseas: false },
  { code: '32', name: 'Hauts-de-France', x: 454, y: 134, isOverseas: false },
  { code: '44', name: 'Grand Est', x: 623, y: 234, isOverseas: false },
  { code: '93', name: "Provence-Alpes-Côte d'Azur", x: 666, y: 623, isOverseas: false },
  { code: '52', name: 'Pays de la Loire', x: 261, y: 340, isOverseas: false },
  { code: '53', name: 'Bretagne', x: 149, y: 283, isOverseas: false },
  { code: '28', name: 'Normandie', x: 311, y: 208, isOverseas: false },
  { code: '27', name: 'Bourgogne-Franche-Comté', x: 598, y: 351, isOverseas: false },
  { code: '24', name: 'Centre-Val de Loire', x: 399, y: 341, isOverseas: false },
  { code: '94', name: 'Corse', x: 867, y: 756, isOverseas: false },

  // 5 DROM (encart outre-mer)
  { code: '01', name: 'Guadeloupe', x: 70, y: 694, isOverseas: true },
  { code: '02', name: 'Martinique', x: 160, y: 694, isOverseas: true },
  { code: '03', name: 'Guyane', x: 253, y: 735, isOverseas: true },
  { code: '04', name: 'La Réunion', x: 160, y: 780, isOverseas: true },
  { code: '06', name: 'Mayotte', x: 70, y: 780, isOverseas: true },
];
