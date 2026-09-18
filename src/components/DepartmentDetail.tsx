import React from 'react';
import { X, MapPin, Users, Maximize2, Compass, Layers, Building, ChevronRight, Award, ExternalLink } from 'lucide-react';
import { Department, Region, City } from '../types';
import { regionsMap, citiesList, departmentsList } from '../data/mapData';

interface DepartmentDetailProps {
  dept: Department | null;
  onClose: () => void;
  onSelectRegion: (regionCode: string) => void;
  onSelectCity: (city: City) => void;
}

export const DepartmentDetail: React.FC<DepartmentDetailProps> = ({
  dept,
  onClose,
  onSelectRegion,
  onSelectCity,
}) => {
  if (!dept) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-xs flex flex-col items-center justify-center min-h-[380px]">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-xs">
          <MapPin className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Sélectionnez un département
        </h3>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Cliquez sur la carte ou utilisez la barre de recherche pour consulter les préfectures, villes, statistiques démographiques et géographiques.
        </p>

        <div className="mt-6 pt-5 border-t border-slate-100 w-full grid grid-cols-2 gap-2 text-left">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400">Total départements</div>
            <div className="text-sm font-black text-slate-800">101 (96 + 5 DROM)</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400">Régions adm.</div>
            <div className="text-sm font-black text-slate-800">18 régions</div>
          </div>
        </div>
      </div>
    );
  }

  const reg = regionsMap.get(dept.regionCode);

  // Compute ranks
  const sortedByPop = [...departmentsList].sort((a, b) => b.population - a.population);
  const popRank = sortedByPop.findIndex(d => d.code === dept.code) + 1;

  const sortedByArea = [...departmentsList].sort((a, b) => b.areaKm2 - a.areaKm2);
  const areaRank = sortedByArea.findIndex(d => d.code === dept.code) + 1;

  // Department's notable cities
  const deptCities = citiesList.filter(c => c.departmentCode === dept.code);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header with region color banner */}
      <div
        className="p-4 text-white relative flex items-start justify-between"
        style={{
          background: `linear-gradient(135deg, ${reg ? reg.color : '#4f46e5'}, ${
            reg ? reg.secondaryColor : '#818cf8'
          })`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-xl shadow-inner text-white">
            {dept.code}
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight leading-tight">
              {dept.name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-white/90 font-medium">
              <span>Région {dept.regionName}</span>
              {dept.isOverseas && (
                <span className="px-1.5 py-0.2 rounded-sm bg-white/20 text-[10px] font-bold">
                  DROM
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          id="btn-close-dept-detail"
          onClick={onClose}
          className="p-1 rounded-lg bg-black/10 hover:bg-black/20 text-white/80 hover:text-white transition-colors"
          title="Fermer la fiche"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[560px] overflow-y-auto">
        
        {/* Region link button */}
        {reg && (
          <button
            onClick={() => onSelectRegion(reg.code)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between group transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: reg.color }}
              />
              <span className="text-xs font-semibold text-slate-700">
                Explorer toute la région {reg.name}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}

        {/* Administration: Préfecture & Sous-préfectures */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Administration Territoriale
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                Préfecture (Chef-lieu)
              </div>
              <div className="text-sm font-bold text-slate-900">
                {dept.prefecture}
              </div>
              <div className="text-[11px] text-slate-500">
                Coord : {dept.prefectureCoords[1].toFixed(2)}°N, {dept.prefectureCoords[0].toFixed(2)}°E
              </div>
            </div>
          </div>

          {dept.subPrefectures && dept.subPrefectures.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Building className="w-3 h-3 text-slate-400" />
                <span>Sous-préfectures ({dept.subPrefectures.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dept.subPrefectures.map((sub, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Données Démographiques & Spatiales
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Population */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>Population</span>
              </div>
              <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                {dept.population.toLocaleString('fr-FR')}
              </div>
              <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                {popRank}ᵉ rang national
              </div>
            </div>

            {/* Superficie */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Maximize2 className="w-3 h-3 text-slate-400" />
                <span>Superficie</span>
              </div>
              <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                {dept.areaKm2.toLocaleString('fr-FR')} km²
              </div>
              <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                {areaRank}ᵉ rang national
              </div>
            </div>
          </div>

          {/* Density bar */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-600">Densité de population</span>
              <span className="font-bold text-slate-900 font-mono">
                {dept.density} hab/km²
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(4, (Math.log(dept.density) / Math.log(1000)) * 100))}%`,
                  backgroundColor: reg ? reg.color : '#6366f1',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Rurale (&lt;50)</span>
              <span>Moyenne (100)</span>
              <span>Urbaine (&gt;500)</span>
            </div>
          </div>
        </div>

        {/* Notable Cities in this department */}
        {deptCities.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Grandes Villes Référencées</span>
              <span className="text-indigo-600 font-medium">({deptCities.length})</span>
            </div>
            <div className="space-y-1.5">
              {deptCities.map(city => (
                <button
                  key={city.id}
                  onClick={() => onSelectCity(city)}
                  className="w-full px-3 py-2 rounded-xl bg-white hover:bg-indigo-50/50 border border-slate-200/70 flex items-center justify-between text-left transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                        {city.name}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {city.type === 'capitale'
                          ? 'Capitale de la France'
                          : city.type === 'prefecture_region'
                          ? 'Préfecture de région'
                          : city.type === 'prefecture'
                          ? 'Préfecture'
                          : 'Grande métropole'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-600">
                    {city.population.toLocaleString('fr-FR')} hab.
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
