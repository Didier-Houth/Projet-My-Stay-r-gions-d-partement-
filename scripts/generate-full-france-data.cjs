const fs = require('fs');
const d3 = require('d3');

const metro = JSON.parse(fs.readFileSync('./scripts/metro-raw.json', 'utf8'));
const drom = JSON.parse(fs.readFileSync('./scripts/drom-raw.json', 'utf8'));

// Setup projections
const metroProjection = d3.geoConicConformal()
  .center([2.6, 46.2])
  .parallels([44, 49])
  .fitExtent([[25, 20], [895, 840]], metro);

const metroPath = d3.geoPath().projection(metroProjection);

function roundPath(d) {
  if (!d) return '';
  return d.replace(/([0-9]+\.[0-9]{1})[0-9]+/g, '$1');
}

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

// Inset boxes for DROM located in the Atlantic zone (bottom-left)
const dromBoxes = {
  '971': { x: 30, y: 640, w: 80, h: 80, title: 'Guadeloupe', code: '971' },
  '972': { x: 120, y: 640, w: 80, h: 80, title: 'Martinique', code: '972' },
  '973': { x: 210, y: 640, w: 90, h: 90, title: 'Guyane', code: '973' },
  '974': { x: 120, y: 730, w: 80, h: 80, title: 'La Réunion', code: '974' },
  '976': { x: 30, y: 730, w: 80, h: 80, title: 'Mayotte', code: '976' }
};

const dromProjections = {};
drom.forEach(f => {
  const code = f.properties.code;
  const box = dromBoxes[code];
  const simplified = simplifyGeometry(f.geometry, code === '973' ? 0.04 : 0.007);
  const pad = 8;
  const proj = d3.geoMercator().fitExtent(
    [[box.x + pad, box.y + pad], [box.x + box.w - pad, box.y + box.h - pad]],
    simplified
  );
  dromProjections[code] = { proj, simplified };
});

// Regions definitions with harmonious distinct colors
const regions = [
  {
    code: '11',
    name: 'Île-de-France',
    capital: 'Paris',
    color: '#0284c7', // Sky blue
    secondaryColor: '#38bdf8',
    departments: ['75', '77', '78', '91', '92', '93', '94', '95'],
    population: 12419961,
    areaKm2: 12012
  },
  {
    code: '84',
    name: 'Auvergne-Rhône-Alpes',
    capital: 'Lyon',
    color: '#059669', // Emerald
    secondaryColor: '#34d399',
    departments: ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
    population: 8160075,
    areaKm2: 69711
  },
  {
    code: '75',
    name: 'Nouvelle-Aquitaine',
    capital: 'Bordeaux',
    color: '#ea580c', // Orange
    secondaryColor: '#fb923c',
    departments: ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
    population: 6094760,
    areaKm2: 84061
  },
  {
    code: '76',
    name: 'Occitanie',
    capital: 'Toulouse',
    color: '#dc2626', // Red
    secondaryColor: '#f87171',
    departments: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
    population: 6071490,
    areaKm2: 72724
  },
  {
    code: '32',
    name: 'Hauts-de-France',
    capital: 'Lille',
    color: '#4f46e5', // Indigo
    secondaryColor: '#818cf8',
    departments: ['02', '59', '60', '62', '80'],
    population: 6006093,
    areaKm2: 31813
  },
  {
    code: '44',
    name: 'Grand Est',
    capital: 'Strasbourg',
    color: '#7c3aed', // Violet
    secondaryColor: '#a78bfa',
    departments: ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
    population: 5562651,
    areaKm2: 57433
  },
  {
    code: '93',
    name: "Provence-Alpes-Côte d'Azur",
    capital: 'Marseille',
    color: '#d97706', // Amber
    secondaryColor: '#fbbf24',
    departments: ['04', '05', '06', '13', '83', '84'],
    population: 5127840,
    areaKm2: 31400
  },
  {
    code: '52',
    name: 'Pays de la Loire',
    capital: 'Nantes',
    color: '#0891b2', // Cyan
    secondaryColor: '#22d3ee',
    departments: ['44', '49', '53', '72', '85'],
    population: 3873099,
    areaKm2: 32082
  },
  {
    code: '53',
    name: 'Bretagne',
    capital: 'Rennes',
    color: '#2563eb', // Blue
    secondaryColor: '#60a5fa',
    departments: ['22', '29', '35', '56'],
    population: 3426027,
    areaKm2: 27208
  },
  {
    code: '28',
    name: 'Normandie',
    capital: 'Rouen',
    color: '#16a34a', // Green
    secondaryColor: '#4ade80',
    departments: ['14', '27', '50', '61', '76'],
    population: 3327077,
    areaKm2: 29906
  },
  {
    code: '27',
    name: 'Bourgogne-Franche-Comté',
    capital: 'Dijon',
    color: '#c026d3', // Fuchsia
    secondaryColor: '#e879f9',
    departments: ['21', '25', '39', '58', '70', '71', '89', '90'],
    population: 2795646,
    areaKm2: 47783
  },
  {
    code: '24',
    name: 'Centre-Val de Loire',
    capital: 'Orléans',
    color: '#e11d48', // Rose
    secondaryColor: '#fb7185',
    departments: ['18', '28', '36', '37', '41', '45'],
    population: 2577435,
    areaKm2: 39151
  },
  {
    code: '94',
    name: 'Corse',
    capital: 'Ajaccio',
    color: '#ca8a04', // Yellow ochre
    secondaryColor: '#facc15',
    departments: ['2A', '2B'],
    population: 351252,
    areaKm2: 8680
  },
  // DROM
  {
    code: '01',
    name: 'Guadeloupe',
    capital: 'Basse-Terre',
    color: '#0d9488', // Teal
    secondaryColor: '#2dd4bf',
    departments: ['971'],
    population: 384315,
    areaKm2: 1628
  },
  {
    code: '02',
    name: 'Martinique',
    capital: 'Fort-de-France',
    color: '#4338ca', // Indigo dusk
    secondaryColor: '#6366f1',
    departments: ['972'],
    population: 360749,
    areaKm2: 1128
  },
  {
    code: '03',
    name: 'Guyane',
    capital: 'Cayenne',
    color: '#15803d', // Forest
    secondaryColor: '#22c55e',
    departments: ['973'],
    population: 294071,
    areaKm2: 83534
  },
  {
    code: '04',
    name: 'La Réunion',
    capital: 'Saint-Denis',
    color: '#b91c1c', // Ruby
    secondaryColor: '#ef4444',
    departments: ['974'],
    population: 871157,
    areaKm2: 2504
  },
  {
    code: '06',
    name: 'Mayotte',
    capital: 'Mamoudzou',
    color: '#9333ea', // Purple
    secondaryColor: '#c084fc',
    departments: ['976'],
    population: 320901,
    areaKm2: 376
  }
];

// Full verified departments data (101 departments)
// Codes, names, regions, prefectures, subprefectures, population, area km², coordinates [lng, lat]
const departmentsRaw = [
  { code: '01', name: 'Ain', reg: '84', pref: 'Bourg-en-Bresse', sub: ['Belley', 'Gex', 'Nantua'], pop: 663202, area: 5762, lng: 5.228, lat: 46.205 },
  { code: '02', name: 'Aisne', reg: '32', pref: 'Laon', sub: ['Château-Thierry', 'Saint-Quentin', 'Soissons', 'Vervins'], pop: 527589, area: 7369, lng: 3.624, lat: 49.564 },
  { code: '03', name: 'Allier', reg: '84', pref: 'Moulins', sub: ['Montluçon', 'Vichy'], pop: 334872, area: 7340, lng: 3.332, lat: 46.568 },
  { code: '04', name: 'Alpes-de-Haute-Provence', reg: '93', pref: 'Digne-les-Bains', sub: ['Barcelonnette', 'Castellane', 'Forcalquier'], pop: 166077, area: 6925, lng: 6.236, lat: 44.092 },
  { code: '05', name: 'Hautes-Alpes', reg: '93', pref: 'Gap', sub: ['Briançon'], pop: 140976, area: 5549, lng: 6.079, lat: 44.559 },
  { code: '06', name: 'Alpes-Maritimes', reg: '93', pref: 'Nice', sub: ['Grasse'], pop: 1097410, area: 4299, lng: 7.262, lat: 43.710 },
  { code: '07', name: 'Ardèche', reg: '84', pref: 'Privas', sub: ['Largentière', 'Tournon-sur-Rhône'], pop: 330306, area: 5529, lng: 4.598, lat: 44.735 },
  { code: '08', name: 'Ardennes', reg: '44', pref: 'Charleville-Mézières', sub: ['Rethel', 'Sedan', 'Vouziers'], pop: 268859, area: 5229, lng: 4.718, lat: 49.771 },
  { code: '09', name: 'Ariège', reg: '76', pref: 'Foix', sub: ['Pamiers', 'Saint-Girons'], pop: 154596, area: 4890, lng: 1.605, lat: 42.966 },
  { code: '10', name: 'Aube', reg: '44', pref: 'Troyes', sub: ['Bar-sur-Aube', 'Nogent-sur-Seine'], pop: 311329, area: 6004, lng: 4.074, lat: 48.297 },
  { code: '11', name: 'Aude', reg: '76', pref: 'Carcassonne', sub: ['Limoux', 'Narbonne'], pop: 376028, area: 6139, lng: 2.353, lat: 43.213 },
  { code: '12', name: 'Aveyron', reg: '76', pref: 'Rodez', sub: ['Millau', 'Villefranche-de-Rouergue'], pop: 279595, area: 8735, lng: 2.573, lat: 44.351 },
  { code: '13', name: 'Bouches-du-Rhône', reg: '93', pref: 'Marseille', sub: ['Aix-en-Provence', 'Arles', 'Istres'], pop: 2056943, area: 5087, lng: 5.370, lat: 43.296 },
  { code: '14', name: 'Calvados', reg: '28', pref: 'Caen', sub: ['Bayeux', 'Lisieux', 'Vire Normandie'], pop: 700633, area: 5548, lng: -0.370, lat: 49.182 },
  { code: '15', name: 'Cantal', reg: '84', pref: 'Aurillac', sub: ['Mauriac', 'Saint-Flour'], pop: 144226, area: 5726, lng: 2.443, lat: 44.926 },
  { code: '16', name: 'Charente', reg: '75', pref: 'Angoulême', sub: ['Cognac', 'Confolens'], pop: 350867, area: 5956, lng: 0.156, lat: 45.648 },
  { code: '17', name: 'Charente-Maritime', reg: '75', pref: 'La Rochelle', sub: ['Jonzac', 'Rochefort', 'Saintes', 'Saint-Jean-d\'Angély'], pop: 661404, area: 6864, lng: -1.151, lat: 46.160 },
  { code: '18', name: 'Cher', reg: '24', pref: 'Bourges', sub: ['Saint-Amand-Montrond', 'Vierzon'], pop: 299573, area: 7235, lng: 2.398, lat: 47.081 },
  { code: '19', name: 'Corrèze', reg: '75', pref: 'Tulle', sub: ['Brive-la-Gaillarde', 'Ussel'], pop: 239784, area: 5860, lng: 1.771, lat: 45.267 },
  { code: '2A', name: 'Corse-du-Sud', reg: '94', pref: 'Ajaccio', sub: ['Sartène'], pop: 162942, area: 4014, lng: 8.738, lat: 41.926 },
  { code: '2B', name: 'Haute-Corse', reg: '94', pref: 'Bastia', sub: ['Calvi', 'Corte'], pop: 188310, area: 4666, lng: 9.450, lat: 42.702 },
  { code: '21', name: 'Côte-d\'Or', reg: '27', pref: 'Dijon', sub: ['Beaune', 'Montbard'], pop: 535503, area: 8763, lng: 5.041, lat: 47.322 },
  { code: '22', name: 'Côtes-d\'Armor', reg: '53', pref: 'Saint-Brieuc', sub: ['Dinan', 'Guingamp', 'Lannion'], pop: 605917, area: 6878, lng: -2.765, lat: 48.514 },
  { code: '23', name: 'Creuse', reg: '75', pref: 'Guéret', sub: ['Aubusson'], pop: 115702, area: 5565, lng: 1.872, lat: 46.171 },
  { code: '24', name: 'Dordogne', reg: '75', pref: 'Périgueux', sub: ['Bergerac', 'Nontron', 'Sarlat-la-Canéda'], pop: 413730, area: 9060, lng: 0.721, lat: 45.183 },
  { code: '25', name: 'Doubs', reg: '27', pref: 'Besançon', sub: ['Montbéliard', 'Pontarlier'], pop: 547096, area: 5234, lng: 6.024, lat: 47.237 },
  { code: '26', name: 'Drôme', reg: '84', pref: 'Valence', sub: ['Die', 'Nyons'], pop: 519458, area: 6530, lng: 4.892, lat: 44.933 },
  { code: '27', name: 'Eure', reg: '28', pref: 'Évreux', sub: ['Les Andelys', 'Bernay'], pop: 599507, area: 6040, lng: 1.150, lat: 49.024 },
  { code: '28', name: 'Eure-et-Loir', reg: '24', pref: 'Chartres', sub: ['Châteaudun', 'Dreux', 'Nogent-le-Rotrou'], pop: 431575, area: 5880, lng: 1.489, lat: 48.443 },
  { code: '29', name: 'Finistère', reg: '53', pref: 'Quimper', sub: ['Brest', 'Châteaulin', 'Morlaix'], pop: 921905, area: 6733, lng: -4.103, lat: 47.996 },
  { code: '30', name: 'Gard', reg: '76', pref: 'Nîmes', sub: ['Alès', 'Le Vigan'], pop: 756543, area: 5853, lng: 4.360, lat: 43.836 },
  { code: '31', name: 'Haute-Garonne', reg: '76', pref: 'Toulouse', sub: ['Muret', 'Saint-Gaudens'], pop: 1434367, area: 6309, lng: 1.444, lat: 43.604 },
  { code: '32', name: 'Gers', reg: '76', pref: 'Auch', sub: ['Condom', 'Mirande'], pop: 192454, area: 6257, lng: 0.586, lat: 43.646 },
  { code: '33', name: 'Gironde', reg: '75', pref: 'Bordeaux', sub: ['Arcachon', 'Blaye', 'Langon', 'Lesparre-Médoc', 'Libourne'], pop: 1656974, area: 10725, lng: -0.579, lat: 44.837 },
  { code: '34', name: 'Hérault', reg: '76', pref: 'Montpellier', sub: ['Béziers', 'Lodève'], pop: 1201883, area: 6101, lng: 3.876, lat: 43.610 },
  { code: '35', name: 'Ille-et-Vilaine', reg: '53', pref: 'Rennes', sub: ['Fougères', 'Redon', 'Saint-Malo'], pop: 1098325, area: 6775, lng: -1.677, lat: 48.117 },
  { code: '36', name: 'Indre', reg: '24', pref: 'Châteauroux', sub: ['Le Blanc', 'La Châtre', 'Issoudun'], pop: 217228, area: 6791, lng: 1.691, lat: 46.811 },
  { code: '37', name: 'Indre-et-Loire', reg: '24', pref: 'Tours', sub: ['Chinon', 'Loches'], pop: 612160, area: 6127, lng: 0.684, lat: 47.394 },
  { code: '38', name: 'Isère', reg: '84', pref: 'Grenoble', sub: ['La Tour-du-Pin', 'Vienne'], pop: 1284948, area: 7431, lng: 5.724, lat: 45.188 },
  { code: '39', name: 'Jura', reg: '27', pref: 'Lons-le-Saunier', sub: ['Dole', 'Saint-Claude'], pop: 258555, area: 4999, lng: 5.554, lat: 46.675 },
  { code: '40', name: 'Landes', reg: '75', pref: 'Mont-de-Marsan', sub: ['Dax'], pop: 422976, area: 9243, lng: -0.499, lat: 43.891 },
  { code: '41', name: 'Loir-et-Cher', reg: '24', pref: 'Blois', sub: ['Romorantin-Lanthenay', 'Vendôme'], pop: 328504, area: 6343, lng: 1.332, lat: 47.586 },
  { code: '42', name: 'Loire', reg: '84', pref: 'Saint-Étienne', sub: ['Montbrison', 'Roanne'], pop: 769305, area: 4781, lng: 4.390, lat: 45.439 },
  { code: '43', name: 'Haute-Loire', reg: '84', pref: 'Le Puy-en-Velay', sub: ['Brioude', 'Yssingeaux'], pop: 227284, area: 4977, lng: 3.884, lat: 45.042 },
  { code: '44', name: 'Loire-Atlantique', reg: '52', pref: 'Nantes', sub: ['Châteaubriant', 'Saint-Nazaire'], pop: 1457806, area: 6815, lng: -1.553, lat: 47.218 },
  { code: '45', name: 'Loiret', reg: '24', pref: 'Orléans', sub: ['Montargis', 'Pithiviers'], pop: 684561, area: 6775, lng: 1.909, lat: 47.902 },
  { code: '46', name: 'Lot', reg: '76', pref: 'Cahors', sub: ['Figeac', 'Gourdon'], pop: 174094, area: 5217, lng: 1.442, lat: 44.447 },
  { code: '47', name: 'Lot-et-Garonne', reg: '75', pref: 'Agen', sub: ['Marmande', 'Nérac', 'Villeneuve-sur-Lot'], pop: 331229, area: 5361, lng: 0.615, lat: 44.203 },
  { code: '48', name: 'Lozère', reg: '76', pref: 'Mende', sub: ['Florac Trois Rivières'], pop: 76519, area: 5167, lng: 3.498, lat: 44.518 },
  { code: '49', name: 'Maine-et-Loire', reg: '52', pref: 'Angers', sub: ['Cholet', 'Saumur', 'Segré-en-Anjou Bleu'], pop: 824743, area: 7166, lng: -0.552, lat: 47.478 },
  { code: '50', name: 'Manche', reg: '28', pref: 'Saint-Lô', sub: ['Avranches', 'Cherbourg-en-Cotentin', 'Coutances'], pop: 495508, area: 5938, lng: -1.090, lat: 49.115 },
  { code: '51', name: 'Marne', reg: '44', pref: 'Châlons-en-Champagne', sub: ['Épernay', 'Reims', 'Vitry-le-François'], pop: 565292, area: 8162, lng: 4.364, lat: 48.956 },
  { code: '52', name: 'Haute-Marne', reg: '44', pref: 'Chaumont', sub: ['Langres', 'Saint-Dizier'], pop: 171798, area: 6211, lng: 5.140, lat: 48.110 },
  { code: '53', name: 'Mayenne', reg: '52', pref: 'Laval', sub: ['Château-Gontier-sur-Mayenne', 'Mayenne'], pop: 305955, area: 5175, lng: -0.771, lat: 48.070 },
  { code: '54', name: 'Meurthe-et-Moselle', reg: '44', pref: 'Nancy', sub: ['Briey', 'Lunéville', 'Toul'], pop: 733760, area: 5246, lng: 6.184, lat: 48.692 },
  { code: '55', name: 'Meuse', reg: '44', pref: 'Bar-le-Duc', sub: ['Commercy', 'Verdun'], pop: 181830, area: 6211, lng: 5.161, lat: 48.773 },
  { code: '56', name: 'Morbihan', reg: '53', pref: 'Vannes', sub: ['Lorient', 'Pontivy'], pop: 768652, area: 6823, lng: -2.758, lat: 47.658 },
  { code: '57', name: 'Moselle', reg: '44', pref: 'Metz', sub: ['Forbach', 'Sarrebourg', 'Sarreguemines', 'Thionville'], pop: 1049942, area: 6216, lng: 6.175, lat: 49.119 },
  { code: '58', name: 'Nièvre', reg: '27', pref: 'Nevers', sub: ['Château-Chinon', 'Clamecy', 'Cosne-Cours-sur-Loire'], pop: 202417, area: 6814, lng: 3.159, lat: 46.993 },
  { code: '59', name: 'Nord', reg: '32', pref: 'Lille', sub: ['Avesnes-sur-Helpe', 'Cambrai', 'Douai', 'Dunkerque', 'Valenciennes'], pop: 2611293, area: 5743, lng: 3.057, lat: 50.629 },
  { code: '60', name: 'Oise', reg: '32', pref: 'Beauvais', sub: ['Clermont', 'Compiègne', 'Senlis'], pop: 830364, area: 5860, lng: 2.083, lat: 49.429 },
  { code: '61', name: 'Orne', reg: '28', pref: 'Alençon', sub: ['Argentan', 'Mortagne-au-Perche'], pop: 276903, area: 6103, lng: 0.091, lat: 48.432 },
  { code: '62', name: 'Pas-de-Calais', reg: '32', pref: 'Arras', sub: ['Béthune', 'Boulogne-sur-Mer', 'Calais', 'Lens', 'Montreuil-sur-Mer', 'Saint-Omer'], pop: 1461441, area: 6671, lng: 2.777, lat: 50.292 },
  { code: '63', name: 'Puy-de-Dôme', reg: '84', pref: 'Clermont-Ferrand', sub: ['Ambert', 'Issoire', 'Riom', 'Thiers'], pop: 662285, area: 7970, lng: 3.087, lat: 45.777 },
  { code: '64', name: 'Pyrénées-Atlantiques', reg: '75', pref: 'Pau', sub: ['Bayonne', 'Oloron-Sainte-Marie'], pop: 693027, area: 7645, lng: -0.370, lat: 43.295 },
  { code: '65', name: 'Hautes-Pyrénées', reg: '76', pref: 'Tarbes', sub: ['Argelès-Gazost', 'Bagnères-de-Bigorre'], pop: 230956, area: 4464, lng: 0.078, lat: 43.232 },
  { code: '66', name: 'Pyrénées-Orientales', reg: '76', pref: 'Perpignan', sub: ['Céret', 'Prades'], pop: 487307, area: 4116, lng: 2.895, lat: 42.698 },
  { code: '67', name: 'Bas-Rhin', reg: '44', pref: 'Strasbourg', sub: ['Haguenau', 'Molsheim', 'Saverne', 'Sélestat'], pop: 1152662, area: 4755, lng: 7.752, lat: 48.573 },
  { code: '68', name: 'Haut-Rhin', reg: '44', pref: 'Colmar', sub: ['Altkirch', 'Mulhouse', 'Thann'], pop: 767083, area: 3525, lng: 7.358, lat: 48.079 },
  { code: '69', name: 'Rhône & Métropole de Lyon', reg: '84', pref: 'Lyon', sub: ['Villefranche-sur-Saône'], pop: 1893692, area: 3249, lng: 4.835, lat: 45.764 },
  { code: '70', name: 'Haute-Saône', reg: '27', pref: 'Vesoul', sub: ['Lure'], pop: 234296, area: 5360, lng: 6.155, lat: 47.623 },
  { code: '71', name: 'Saône-et-Loire', reg: '27', pref: 'Mâcon', sub: ['Autun', 'Chalon-sur-Saône', 'Charolles', 'Louhans'], pop: 549288, area: 8575, lng: 4.832, lat: 46.306 },
  { code: '72', name: 'Sarthe', reg: '52', pref: 'Le Mans', sub: ['La Flèche', 'Mamers'], pop: 566412, area: 6206, lng: 0.199, lat: 48.006 },
  { code: '73', name: 'Savoie', reg: '84', pref: 'Chambéry', sub: ['Albertville', 'Saint-Jean-de-Maurienne'], pop: 442468, area: 6028, lng: 5.918, lat: 45.564 },
  { code: '74', name: 'Haute-Savoie', reg: '84', pref: 'Annecy', sub: ['Bonneville', 'Saint-Julien-en-Genevois', 'Thonon-les-Bains'], pop: 841482, area: 4388, lng: 6.128, lat: 45.899 },
  { code: '75', name: 'Paris', reg: '11', pref: 'Paris', sub: [], pop: 2133111, area: 105, lng: 2.352, lat: 48.856 },
  { code: '76', name: 'Seine-Maritime', reg: '28', pref: 'Rouen', sub: ['Dieppe', 'Le Havre'], pop: 1255883, area: 6278, lng: 1.099, lat: 49.443 },
  { code: '77', name: 'Seine-et-Marne', reg: '11', pref: 'Melun', sub: ['Fontainebleau', 'Meaux', 'Provins', 'Torcy'], pop: 1438100, area: 5915, lng: 2.658, lat: 48.539 },
  { code: '78', name: 'Yvelines', reg: '11', pref: 'Versailles', sub: ['Mantes-la-Jolie', 'Rambouillet', 'Saint-Germain-en-Laye'], pop: 1456365, area: 2284, lng: 2.130, lat: 48.804 },
  { code: '79', name: 'Deux-Sèvres', reg: '75', pref: 'Niort', sub: ['Bressuire', 'Parthenay'], pop: 374587, area: 5999, lng: -0.463, lat: 46.323 },
  { code: '80', name: 'Somme', reg: '32', pref: 'Amiens', sub: ['Abbeville', 'Montdidier', 'Péronne'], pop: 566252, area: 6170, lng: 2.302, lat: 49.894 },
  { code: '81', name: 'Tarn', reg: '76', pref: 'Albi', sub: ['Castres'], pop: 393572, area: 5758, lng: 2.148, lat: 43.928 },
  { code: '82', name: 'Tarn-et-Garonne', reg: '76', pref: 'Montauban', sub: ['Castelsarrasin'], pop: 263377, area: 3718, lng: 1.354, lat: 44.017 },
  { code: '83', name: 'Var', reg: '93', pref: 'Toulon', sub: ['Brignoles', 'Draguignan'], pop: 1089776, area: 5973, lng: 5.928, lat: 43.124 },
  { code: '84', name: 'Vaucluse', reg: '93', pref: 'Avignon', sub: ['Apt', 'Carpentras'], pop: 564566, area: 3567, lng: 4.805, lat: 43.949 },
  { code: '85', name: 'Vendée', reg: '52', pref: 'La Roche-sur-Yon', sub: ['Fontenay-le-Comte', 'Les Sables-d\'Olonne'], pop: 699459, area: 6720, lng: -1.428, lat: 46.670 },
  { code: '86', name: 'Vienne', reg: '75', pref: 'Poitiers', sub: ['Châtellerault', 'Montmorillon'], pop: 439332, area: 6990, lng: 0.340, lat: 46.580 },
  { code: '87', name: 'Haute-Vienne', reg: '75', pref: 'Limoges', sub: ['Bellac', 'Rochechouart'], pop: 371691, area: 5520, lng: 1.261, lat: 45.833 },
  { code: '88', name: 'Vosges', reg: '44', pref: 'Épinal', sub: ['Neufchâteau', 'Saint-Dié-des-Vosges'], pop: 360673, area: 5874, lng: 6.450, lat: 48.174 },
  { code: '89', name: 'Yonne', reg: '27', pref: 'Auxerre', sub: ['Avallon', 'Sens'], pop: 333385, area: 7427, lng: 3.567, lat: 47.798 },
  { code: '90', name: 'Territoire de Belfort', reg: '27', pref: 'Belfort', sub: [], pop: 139654, area: 609, lng: 6.863, lat: 47.639 },
  { code: '91', name: 'Essonne', reg: '11', pref: 'Évry-Courcouronnes', sub: ['Étampes', 'Palaiseau'], pop: 1313768, area: 1804, lng: 2.432, lat: 48.629 },
  { code: '92', name: 'Hauts-de-Seine', reg: '11', pref: 'Nanterre', sub: ['Antony', 'Boulogne-Billancourt'], pop: 1635291, area: 176, lng: 2.206, lat: 48.892 },
  { code: '93', name: 'Seine-Saint-Denis', reg: '11', pref: 'Bobigny', sub: ['Le Raincy', 'Saint-Denis'], pop: 1668670, area: 236, lng: 2.441, lat: 48.908 },
  { code: '94', name: 'Val-de-Marne', reg: '11', pref: 'Créteil', sub: ['L\'Haÿ-les-Roses', 'Nogent-sur-Marne'], pop: 1415367, area: 245, lng: 2.453, lat: 48.790 },
  { code: '95', name: 'Val-d\'Oise', reg: '11', pref: 'Cergy', sub: ['Argenteuil', 'Pontoise', 'Sarcelles'], pop: 1256607, area: 1246, lng: 2.038, lat: 49.036 },
  // DROM
  { code: '971', name: 'Guadeloupe', reg: '01', pref: 'Basse-Terre', sub: ['Pointe-à-Pitre'], pop: 384315, area: 1628, lng: -61.725, lat: 15.998 },
  { code: '972', name: 'Martinique', reg: '02', pref: 'Fort-de-France', sub: ['Le Marin', 'Saint-Pierre', 'La Trinité'], pop: 360749, area: 1128, lng: -61.058, lat: 14.616 },
  { code: '973', name: 'Guyane', reg: '03', pref: 'Cayenne', sub: ['Saint-Laurent-du-Maroni'], pop: 294071, area: 83534, lng: -52.333, lat: 4.933 },
  { code: '974', name: 'La Réunion', reg: '04', pref: 'Saint-Denis', sub: ['Saint-Benoît', 'Saint-Paul', 'Saint-Pierre'], pop: 871157, area: 2504, lng: 55.450, lat: -20.882 },
  { code: '976', name: 'Mayotte', reg: '06', pref: 'Mamoudzou', sub: [], pop: 320901, area: 376, lng: 45.228, lat: -12.780 }
];

// Notable large cities / métropoles to highlight with population & coordinates
const notableCities = [
  { name: 'Paris', dept: '75', reg: '11', pop: 2133111, type: 'capitale', lng: 2.3522, lat: 48.8566 },
  { name: 'Marseille', dept: '13', reg: '93', pop: 873076, type: 'prefecture_region', lng: 5.3698, lat: 43.2965 },
  { name: 'Lyon', dept: '69', reg: '84', pop: 522250, type: 'prefecture_region', lng: 4.8357, lat: 45.7640 },
  { name: 'Toulouse', dept: '31', reg: '76', pop: 504078, type: 'prefecture_region', lng: 1.4442, lat: 43.6047 },
  { name: 'Nice', dept: '06', reg: '93', pop: 348085, type: 'prefecture', lng: 7.2620, lat: 43.7102 },
  { name: 'Nantes', dept: '44', reg: '52', pop: 323204, type: 'prefecture_region', lng: -1.5536, lat: 47.2184 },
  { name: 'Montpellier', dept: '34', reg: '76', pop: 302485, type: 'prefecture', lng: 3.8767, lat: 43.6108 },
  { name: 'Strasbourg', dept: '67', reg: '44', pop: 291303, type: 'prefecture_region', lng: 7.7521, lat: 48.5734 },
  { name: 'Bordeaux', dept: '33', reg: '75', pop: 261804, type: 'prefecture_region', lng: -0.5792, lat: 44.8378 },
  { name: 'Lille', dept: '59', reg: '32', pop: 236710, type: 'prefecture_region', lng: 3.0573, lat: 50.6292 },
  { name: 'Rennes', dept: '35', reg: '53', pop: 225081, type: 'prefecture_region', lng: -1.6778, lat: 48.1173 },
  { name: 'Reims', dept: '51', reg: '44', pop: 179380, type: 'subprefecture', lng: 4.0317, lat: 49.2583 },
  { name: 'Toulon', dept: '83', reg: '93', pop: 180452, type: 'prefecture', lng: 5.9280, lat: 43.1242 },
  { name: 'Saint-Étienne', dept: '42', reg: '84', pop: 174082, type: 'prefecture', lng: 4.3900, lat: 45.4397 },
  { name: 'Le Havre', dept: '76', reg: '28', pop: 166058, type: 'subprefecture', lng: 0.1079, lat: 49.4944 },
  { name: 'Grenoble', dept: '38', reg: '84', pop: 157477, type: 'prefecture', lng: 5.7245, lat: 45.1885 },
  { name: 'Dijon', dept: '21', reg: '27', pop: 159346, type: 'prefecture_region', lng: 5.0415, lat: 47.3220 },
  { name: 'Angers', dept: '49', reg: '52', pop: 157178, type: 'prefecture', lng: -0.5520, lat: 47.4784 },
  { name: 'Villeurbanne', dept: '69', reg: '84', pop: 156928, type: 'city', lng: 4.8800, lat: 45.7700 },
  { name: 'Nîmes', dept: '30', reg: '76', pop: 148104, type: 'prefecture', lng: 4.3601, lat: 43.8367 },
  { name: 'Clermont-Ferrand', dept: '63', reg: '84', pop: 147327, type: 'prefecture', lng: 3.0870, lat: 45.7772 },
  { name: 'Aix-en-Provence', dept: '13', reg: '93', pop: 147478, type: 'subprefecture', lng: 5.4474, lat: 43.5297 },
  { name: 'Le Mans', dept: '72', reg: '52', pop: 145004, type: 'prefecture', lng: 0.1996, lat: 48.0061 },
  { name: 'Brest', dept: '29', reg: '53', pop: 139619, type: 'subprefecture', lng: -4.4861, lat: 48.3904 },
  { name: 'Tours', dept: '37', reg: '24', pop: 137658, type: 'prefecture', lng: 0.6848, lat: 47.3941 },
  { name: 'Amiens', dept: '80', reg: '32', pop: 133625, type: 'prefecture', lng: 2.3023, lat: 49.8941 },
  { name: 'Limoges', dept: '87', reg: '75', pop: 129760, type: 'prefecture', lng: 1.2611, lat: 45.8336 },
  { name: 'Annecy', dept: '74', reg: '84', pop: 131715, type: 'prefecture', lng: 6.1289, lat: 45.8992 },
  { name: 'Perpignan', dept: '66', reg: '76', pop: 119656, type: 'prefecture', lng: 2.8956, lat: 42.6986 },
  { name: 'Boulogne-Billancourt', dept: '92', reg: '11', pop: 119808, type: 'subprefecture', lng: 2.2400, lat: 48.8350 },
  { name: 'Metz', dept: '57', reg: '44', pop: 120874, type: 'prefecture', lng: 6.1757, lat: 49.1193 },
  { name: 'Besançon', dept: '25', reg: '27', pop: 119198, type: 'prefecture', lng: 6.0241, lat: 47.2378 },
  { name: 'Orléans', dept: '45', reg: '24', pop: 116238, type: 'prefecture_region', lng: 1.9093, lat: 47.9029 },
  { name: 'Rouen', dept: '76', reg: '28', pop: 114083, type: 'prefecture_region', lng: 1.0999, lat: 49.4432 },
  { name: 'Mulhouse', dept: '68', reg: '44', pop: 106341, type: 'subprefecture', lng: 7.3359, lat: 47.7508 },
  { name: 'Caen', dept: '14', reg: '28', pop: 107229, type: 'prefecture', lng: -0.3707, lat: 49.1829 },
  { name: 'Nancy', dept: '54', reg: '44', pop: 104260, type: 'prefecture', lng: 6.1844, lat: 48.6921 },
  { name: 'Avignon', dept: '84', reg: '93', pop: 90330, type: 'prefecture', lng: 4.8055, lat: 43.9493 },
  { name: 'Poitiers', dept: '86', reg: '75', pop: 90240, type: 'prefecture', lng: 0.3404, lat: 46.5802 },
  { name: 'Dunkerque', dept: '59', reg: '32', pop: 86788, type: 'subprefecture', lng: 2.3768, lat: 51.0343 },
  { name: 'Pau', dept: '64', reg: '75', pop: 77066, type: 'prefecture', lng: -0.3708, lat: 43.2951 },
  { name: 'La Rochelle', dept: '17', reg: '75', pop: 78535, type: 'prefecture', lng: -1.1511, lat: 46.1603 },
  { name: 'Calais', dept: '62', reg: '32', pop: 67380, type: 'subprefecture', lng: 1.8587, lat: 50.9513 },
  { name: 'Cannes', dept: '06', reg: '93', pop: 73255, type: 'city', lng: 7.0174, lat: 43.5528 },
  { name: 'Béziers', dept: '34', reg: '76', pop: 80341, type: 'subprefecture', lng: 3.2158, lat: 43.3442 },
  { name: 'Bourges', dept: '18', reg: '24', pop: 63715, type: 'prefecture', lng: 2.3988, lat: 47.0810 },
  { name: 'Colmar', dept: '68', reg: '44', pop: 67730, type: 'prefecture', lng: 7.3585, lat: 48.0794 },
  { name: 'Ajaccio', dept: '2A', reg: '94', pop: 73822, type: 'prefecture_region', lng: 8.7386, lat: 41.9267 },
  { name: 'Bastia', dept: '2B', reg: '94', pop: 48768, type: 'prefecture', lng: 9.4509, lat: 42.7028 },
  // Overseas
  { name: 'Basse-Terre', dept: '971', reg: '01', pop: 10058, type: 'prefecture', lng: -61.725, lat: 15.998 },
  { name: 'Pointe-à-Pitre', dept: '971', reg: '01', pop: 14486, type: 'subprefecture', lng: -61.533, lat: 16.241 },
  { name: 'Fort-de-France', dept: '972', reg: '02', pop: 74921, type: 'prefecture', lng: -61.058, lat: 14.616 },
  { name: 'Cayenne', dept: '973', reg: '03', pop: 63468, type: 'prefecture', lng: -52.333, lat: 4.933 },
  { name: 'Saint-Denis (Réunion)', dept: '974', reg: '04', pop: 154765, type: 'prefecture', lng: 55.450, lat: -20.882 },
  { name: 'Saint-Pierre (Réunion)', dept: '974', reg: '04', pop: 84077, type: 'subprefecture', lng: 55.478, lat: -21.341 },
  { name: 'Mamoudzou', dept: '976', reg: '06', pop: 71437, type: 'prefecture', lng: 45.228, lat: -12.780 }
];

// Combine departments with geometry
const metroFeatures = {};
metro.features.forEach(f => {
  metroFeatures[f.properties.code] = f;
});

const dromFeatures = {};
drom.forEach(f => {
  dromFeatures[f.properties.code] = f;
});

const regionsByCode = {};
regions.forEach(r => { regionsByCode[r.code] = r; });

const finalDepartments = departmentsRaw.map(dept => {
  const isOverseas = ['971', '972', '973', '974', '976'].includes(dept.code);
  const reg = regionsByCode[dept.reg];
  
  let svgPath = '';
  let centroid = [0, 0];
  let prefX = 0;
  let prefY = 0;
  let bounds = [[0, 0], [0, 0]];
  let insetBox = null;

  if (!isOverseas) {
    const f = metroFeatures[dept.code];
    if (f) {
      svgPath = roundPath(metroPath(f));
      const c = metroPath.centroid(f);
      centroid = [Math.round(c[0] * 10) / 10, Math.round(c[1] * 10) / 10];
      const b = metroPath.bounds(f);
      bounds = [
        [Math.round(b[0][0]), Math.round(b[0][1])],
        [Math.round(b[1][0]), Math.round(b[1][1])]
      ];
    }
    const pt = metroProjection([dept.lng, dept.lat]);
    prefX = Math.round(pt[0] * 10) / 10;
    prefY = Math.round(pt[1] * 10) / 10;
  } else {
    insetBox = dromBoxes[dept.code];
    const item = dromProjections[dept.code];
    if (item) {
      const pGen = d3.geoPath().projection(item.proj);
      svgPath = roundPath(pGen(item.simplified));
      const c = pGen.centroid(item.simplified);
      centroid = [Math.round(c[0] * 10) / 10, Math.round(c[1] * 10) / 10];
      const pt = item.proj([dept.lng, dept.lat]);
      prefX = Math.round(pt[0] * 10) / 10;
      prefY = Math.round(pt[1] * 10) / 10;
    }
  }

  // Calculate density
  const density = Math.round(dept.pop / dept.area);

  return {
    code: dept.code,
    name: dept.name,
    regionCode: dept.reg,
    regionName: reg ? reg.name : '',
    prefecture: dept.pref,
    prefectureCoords: [dept.lng, dept.lat],
    prefecturePoint: [prefX, prefY],
    subPrefectures: dept.sub,
    population: dept.pop,
    areaKm2: dept.area,
    density,
    svgPath,
    centroid,
    bounds,
    isOverseas,
    insetBox
  };
});

// Compile projectable cities
const finalCities = [];
notableCities.forEach((city, idx) => {
  const isOverseas = ['971', '972', '973', '974', '976'].includes(city.dept);
  let x = 0, y = 0;
  if (!isOverseas) {
    const pt = metroProjection([city.lng, city.lat]);
    x = Math.round(pt[0] * 10) / 10;
    y = Math.round(pt[1] * 10) / 10;
  } else {
    const item = dromProjections[city.dept];
    if (item) {
      const pt = item.proj([city.lng, city.lat]);
      x = Math.round(pt[0] * 10) / 10;
      y = Math.round(pt[1] * 10) / 10;
    }
  }
  const reg = regionsByCode[city.reg];
  finalCities.push({
    id: `city-${idx}`,
    name: city.name,
    departmentCode: city.dept,
    regionCode: city.reg,
    regionName: reg ? reg.name : '',
    population: city.pop,
    type: city.type,
    lng: city.lng,
    lat: city.lat,
    x,
    y
  });
});

// Write output to src/data
fs.mkdirSync('./src/data', { recursive: true });

const outputData = {
  viewBox: '0 0 920 870',
  width: 920,
  height: 870,
  regions,
  departments: finalDepartments,
  cities: finalCities
};

fs.writeFileSync('./src/data/franceMapData.json', JSON.stringify(outputData));
console.log('Successfully generated franceMapData.json!');
console.log(`- ${regions.length} regions`);
console.log(`- ${finalDepartments.length} departments`);
console.log(`- ${finalCities.length} notable cities`);
