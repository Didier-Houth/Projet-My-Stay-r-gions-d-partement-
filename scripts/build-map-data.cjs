const fs = require('fs');
const d3 = require('d3');

// 1. Raw geojson files
const metro = JSON.parse(fs.readFileSync('./scripts/metro-raw.json', 'utf8'));
const drom = JSON.parse(fs.readFileSync('./scripts/drom-raw.json', 'utf8'));

// Metropolitan projection
// Standard Conic Conformal centered on France
// Map viewBox will be: width 920, height 880
const metroWidth = 880;
const metroHeight = 840;

const metroProjection = d3.geoConicConformal()
  .center([2.6, 46.2])
  .parallels([44, 49])
  .fitExtent([[30, 20], [900, 840]], metro);

const metroPath = d3.geoPath().projection(metroProjection);

function roundPath(d) {
  if (!d) return '';
  return d.replace(/([0-9]+\.[0-9]{1})[0-9]+/g, '$1');
}

// Simplification for DROM
function sqDist(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return dx * dx + dy * dy;
}
function simplifyPoints(points, tolerance) {
  if (points.length <= 2) return points;
  const tolSq = tolerance * tolerance;
  const res = [points[0]];
  let last = points[0];
  for (let i = 1; i < points.length - 1; i++) {
    if (sqDist(points[i], last) >= tolSq) {
      res.push(points[i]);
      last = points[i];
    }
  }
  res.push(points[points.length - 1]);
  return res;
}
function simplifyGeometry(geom, tol) {
  if (geom.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: geom.coordinates.map(ring => simplifyPoints(ring, tol))
    };
  } else if (geom.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geom.coordinates.map(poly => poly.map(ring => simplifyPoints(ring, tol)))
    };
  }
  return geom;
}

// Overseas department insets configuration
// We will place an elegant "France d'Outre-Mer" inset box in the Atlantic ocean area
// (west of Bordeaux / south of Brittany: e.g. x: 25, y: 550 to 850)
const dromBoxes = {
  '971': { x: 30, y: 645, w: 75, h: 75, title: 'Guadeloupe' },
  '972': { x: 115, y: 645, w: 75, h: 75, title: 'Martinique' },
  '973': { x: 200, y: 645, w: 90, h: 90, title: 'Guyane' },
  '974': { x: 115, y: 735, w: 75, h: 75, title: 'La Réunion' },
  '976': { x: 30, y: 735, w: 75, h: 75, title: 'Mayotte' }
};

// Compute paths for metro
const departmentsMap = {};

metro.features.forEach(f => {
  const code = f.properties.code;
  const rawPath = metroPath(f);
  const path = roundPath(rawPath);
  const centroid = metroPath.centroid(f);
  const bounds = metroPath.bounds(f);
  
  departmentsMap[code] = {
    code,
    name: f.properties.nom,
    svgPath: path,
    centroid: [Math.round(centroid[0] * 10) / 10, Math.round(centroid[1] * 10) / 10],
    bounds: [
      [Math.round(bounds[0][0]), Math.round(bounds[0][1])],
      [Math.round(bounds[1][0]), Math.round(bounds[1][1])]
    ],
    isOverseas: false
  };
});

// Compute paths for DROM
drom.forEach(f => {
  const code = f.properties.code;
  const box = dromBoxes[code];
  const simplified = simplifyGeometry(f.geometry, code === '973' ? 0.04 : 0.007);
  
  const pad = 6;
  const proj = d3.geoMercator().fitExtent(
    [[box.x + pad, box.y + pad], [box.x + box.w - pad, box.y + box.h - pad]],
    simplified
  );
  const pathGen = d3.geoPath().projection(proj);
  const rawPath = pathGen(simplified);
  const path = roundPath(rawPath);
  const centroid = pathGen.centroid(simplified);
  
  departmentsMap[code] = {
    code,
    name: f.properties.nom,
    svgPath: path,
    centroid: [Math.round(centroid[0] * 10) / 10, Math.round(centroid[1] * 10) / 10],
    isOverseas: true,
    insetBox: box
  };
});

console.log('Total departments compiled in map:', Object.keys(departmentsMap).length);
fs.writeFileSync('./scripts/dept-paths.json', JSON.stringify(departmentsMap));
