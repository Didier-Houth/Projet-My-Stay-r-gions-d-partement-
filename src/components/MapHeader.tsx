import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Layers, Users, Sparkles, Trophy, RotateCcw, Type, Bookmark } from 'lucide-react';
import { ColorMode, CityVisibility, Department, Region, City, DeptLabelMode } from '../types';
import { departmentsList, regionsList, citiesList } from '../data/mapData';

interface MapHeaderProps {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  cityVisibility: CityVisibility;
  setCityVisibility: (vis: CityVisibility) => void;
  deptLabelMode: DeptLabelMode;
  setDeptLabelMode: (mode: DeptLabelMode) => void;
  showRegionNames: boolean;
  setShowRegionNames: (show: boolean) => void;
  selectedRegionCode: string | null;
  setSelectedRegionCode: (code: string | null) => void;
  onSelectDepartment: (dept: Department) => void;
  onSelectCity: (city: City) => void;
  onResetView: () => void;
  isQuizActive: boolean;
  setIsQuizActive: (active: boolean) => void;
}

export const MapHeader: React.FC<MapHeaderProps> = ({
  colorMode,
  setColorMode,
  cityVisibility,
  setCityVisibility,
  deptLabelMode,
  setDeptLabelMode,
  showRegionNames,
  setShowRegionNames,
  selectedRegionCode,
  setSelectedRegionCode,
  onSelectDepartment,
  onSelectCity,
  onResetView,
  isQuizActive,
  setIsQuizActive,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search results
  const cleanQuery = searchQuery.trim().toLowerCase();
  
  const matchedDepts = cleanQuery.length >= 1
    ? departmentsList.filter(
        d =>
          d.code.toLowerCase().startsWith(cleanQuery) ||
          d.name.toLowerCase().includes(cleanQuery) ||
          d.prefecture.toLowerCase().includes(cleanQuery)
      ).slice(0, 5)
    : [];

  const matchedCities = cleanQuery.length >= 2
    ? citiesList.filter(c => c.name.toLowerCase().includes(cleanQuery)).slice(0, 5)
    : [];

  const matchedRegions = cleanQuery.length >= 2
    ? regionsList.filter(r => r.name.toLowerCase().includes(cleanQuery)).slice(0, 3)
    : [];

  const hasResults = matchedDepts.length > 0 || matchedCities.length > 0 || matchedRegions.length > 0;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Brand & Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-teal-500 flex items-center justify-center shadow-md shadow-indigo-100 text-white font-black text-lg">
                FR
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Carte de France</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 hidden sm:inline-block">
                    Départements & Villes
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  101 départements • 18 régions administratives • Préfectures
                </p>
              </div>
            </div>

            {/* Mobile quiz button */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                id="mobile-quiz-btn"
                onClick={() => setIsQuizActive(!isQuizActive)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  isQuizActive
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>{isQuizActive ? 'Quitter Quiz' : 'Quiz'}</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div ref={searchRef} className="relative flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Rechercher département (ex: 33, Gironde), ville ou région..."
                className="w-full pl-10 pr-9 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900 placeholder:text-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {isSearchOpen && cleanQuery && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto">
                {!hasResults ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    Aucun résultat pour « {searchQuery} »
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 py-1">
                    {matchedDepts.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Départements
                        </div>
                        {matchedDepts.map(dept => (
                          <button
                            key={dept.code}
                            id={`search-dept-${dept.code}`}
                            onClick={() => {
                              onSelectDepartment(dept);
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-indigo-50/70 flex items-center justify-between group transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-6 rounded-md bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                                {dept.code}
                              </span>
                              <div>
                                <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-900">
                                  {dept.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Préfecture : {dept.prefecture} • {dept.regionName}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-slate-400">
                              {(dept.population / 1000).toFixed(0)}k hab.
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {matchedCities.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Villes & Métropoles
                        </div>
                        {matchedCities.map(city => (
                          <button
                            key={city.id}
                            id={`search-city-${city.id}`}
                            onClick={() => {
                              onSelectCity(city);
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-emerald-50/70 flex items-center justify-between group transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <MapPin className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-800 group-hover:text-emerald-900">
                                  {city.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Dép. {city.departmentCode} • {city.regionName}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-slate-400">
                              {(city.population / 1000).toFixed(0)}k hab.
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {matchedRegions.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Régions Administratives
                        </div>
                        {matchedRegions.map(reg => (
                          <button
                            key={reg.code}
                            id={`search-region-${reg.code}`}
                            onClick={() => {
                              setSelectedRegionCode(reg.code);
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-amber-50/70 flex items-center justify-between group transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full"
                                style={{ backgroundColor: reg.color }}
                              />
                              <div>
                                <div className="text-sm font-semibold text-slate-800 group-hover:text-amber-900">
                                  {reg.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Chef-lieu : {reg.capital} • {reg.departments.length} départements
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-slate-400">
                              {(reg.population / 1000000).toFixed(1)}M hab.
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Color Mode selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                id="btn-mode-region"
                onClick={() => setColorMode('region')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  colorMode === 'region'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Colorer selon les 18 régions administratives"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Régions</span>
              </button>
              <button
                id="btn-mode-density"
                onClick={() => setColorMode('density')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  colorMode === 'density'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Colorer par densité de population (hab/km²)"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Densité</span>
              </button>
              <button
                id="btn-mode-population"
                onClick={() => setColorMode('population')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  colorMode === 'population'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Colorer par population totale"
              >
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>Population</span>
              </button>
            </div>

            {/* City Visibility toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                id="btn-cities-major"
                onClick={() => setCityVisibility(cityVisibility === 'major' ? 'all' : cityVisibility === 'all' ? 'none' : 'major')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  cityVisibility !== 'none'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Affichage des repères de villes"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>
                  Villes : {cityVisibility === 'all' ? 'Toutes' : cityVisibility === 'major' ? 'Grandes' : 'Off'}
                </span>
              </button>
            </div>

            {/* Department labels toggle (Codes / Names / Both / Off) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                id="btn-dept-labels"
                onClick={() => {
                  const nextMode: Record<DeptLabelMode, DeptLabelMode> = {
                    both: 'name',
                    name: 'code',
                    code: 'none',
                    none: 'both',
                  };
                  setDeptLabelMode(nextMode[deptLabelMode]);
                }}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  deptLabelMode !== 'none'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Basculer l'affichage des noms et numéros des départements"
              >
                <Type className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  Dép. : {deptLabelMode === 'both' ? 'N° & Noms' : deptLabelMode === 'name' ? 'Noms' : deptLabelMode === 'code' ? 'N° seuls' : 'Off'}
                </span>
              </button>
            </div>

            {/* Region names toggle (On / Off) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                id="btn-region-names"
                onClick={() => setShowRegionNames(!showRegionNames)}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  showRegionNames
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Afficher ou masquer les noms des 18 régions administratives sur la carte"
              >
                <Bookmark className={`w-3.5 h-3.5 ${showRegionNames ? 'text-violet-600' : 'text-slate-400'}`} />
                <span>
                  Régions : {showRegionNames ? 'Noms On' : 'Noms Off'}
                </span>
              </button>
            </div>

            {/* Reset view button */}
            <button
              id="btn-reset-view"
              onClick={onResetView}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Réinitialiser le zoom et la vue"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Quiz button for Desktop */}
            <button
              id="desktop-quiz-btn"
              onClick={() => setIsQuizActive(!isQuizActive)}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isQuizActive
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>{isQuizActive ? 'Quitter le Quiz' : '🎓 Quiz Départements'}</span>
            </button>
          </div>

        </div>

        {/* Selected region notification banner if active */}
        {selectedRegionCode && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Région active :</span>
              <span
                className="inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-full text-white shadow-xs"
                style={{
                  backgroundColor:
                    regionsList.find(r => r.code === selectedRegionCode)?.color || '#4f46e5'
                }}
              >
                {regionsList.find(r => r.code === selectedRegionCode)?.name}
              </span>
              <span className="text-slate-400">
                ({regionsList.find(r => r.code === selectedRegionCode)?.departments.length} départements)
              </span>
            </div>
            <button
              onClick={() => setSelectedRegionCode(null)}
              className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Afficher toute la France
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
