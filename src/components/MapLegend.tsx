import React from 'react';
import { Layers, MapPin, X, ChevronDown, Sparkles } from 'lucide-react';
import { ColorMode, CityVisibility } from '../types';
import { regionsList } from '../data/mapData';

interface MapLegendProps {
  colorMode: ColorMode;
  selectedRegionCode: string | null;
  onSelectRegion: (code: string | null) => void;
  hoveredRegionCode: string | null;
  setHoveredRegionCode: (code: string | null) => void;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  colorMode,
  selectedRegionCode,
  onSelectRegion,
  hoveredRegionCode,
  setHoveredRegionCode,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
      
      {/* Legend Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {colorMode === 'region'
              ? '18 Régions Administratives'
              : colorMode === 'density'
              ? 'Échelle de Densité (hab/km²)'
              : 'Échelle de Population Totale'}
          </h3>
        </div>

        {selectedRegionCode && (
          <button
            onClick={() => onSelectRegion(null)}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 hover:underline"
          >
            <X className="w-3 h-3" />
            Réinitialiser le filtre
          </button>
        )}
      </div>

      {/* Mode: Region (18 regions grid) */}
      {colorMode === 'region' && (
        <div>
          <p className="text-[11px] text-slate-500 mb-2">
            Cliquez sur une région pour isoler ses départements sur la carte :
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-1.5">
            {regionsList.map(reg => {
              const isSelected = selectedRegionCode === reg.code;
              const isHovered = hoveredRegionCode === reg.code;

              return (
                <button
                  key={reg.code}
                  id={`legend-region-${reg.code}`}
                  onClick={() => onSelectRegion(isSelected ? null : reg.code)}
                  onMouseEnter={() => setHoveredRegionCode(reg.code)}
                  onMouseLeave={() => setHoveredRegionCode(null)}
                  className={`p-1.5 rounded-xl border text-left transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : isHovered
                      ? 'bg-slate-50 border-slate-300'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                  title={`${reg.name} (Chef-lieu : ${reg.capital}) - ${reg.departments.length} départements`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: reg.color }}
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-800 truncate leading-tight">
                      {reg.name}
                    </div>
                    <div className="text-[9.5px] text-slate-400 truncate">
                      {reg.departments.length} dép.
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode: Density */}
      {colorMode === 'density' && (
        <div className="space-y-2">
          <div className="h-4 rounded-full bg-gradient-to-r from-[#bbf7d0] via-[#fde047] via-[#fb923c] via-[#ef4444] to-[#9333ea] border border-slate-200" />
          <div className="flex justify-between text-[11px] text-slate-600 font-medium">
            <span>&lt; 30 (Lozère, Creuse)</span>
            <span>~100 (Moyenne nationale)</span>
            <span>500 (Urbain)</span>
            <span>&gt; 20 000 (Paris)</span>
          </div>
        </div>
      )}

      {/* Mode: Population */}
      {colorMode === 'population' && (
        <div className="space-y-2">
          <div className="h-4 rounded-full bg-gradient-to-r from-[#bae6fd] via-[#38bdf8] via-[#0284c7] via-[#1d4ed8] to-[#1e1b4b] border border-slate-200" />
          <div className="flex justify-between text-[11px] text-slate-600 font-medium">
            <span>&lt; 150 000 hab.</span>
            <span>~500 000 hab.</span>
            <span>1 000 000 hab.</span>
            <span>&gt; 2 000 000 (Paris, Nord, BdR)</span>
          </div>
        </div>
      )}

      {/* Symbology for cities key */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wide">
          Repères cartographiques :
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-500 bg-amber-400" />
          <span>Capitale (Paris)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-indigo-600 bg-white" />
          <span>Préfecture de région</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-white" />
          <span>Préfecture / Ville majeure</span>
        </div>
      </div>

    </div>
  );
};
