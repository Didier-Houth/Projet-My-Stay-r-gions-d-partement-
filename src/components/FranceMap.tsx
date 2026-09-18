import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Compass, MapPin } from 'lucide-react';
import { Department, Region, City, ColorMode, CityVisibility, DeptLabelMode } from '../types';
import {
  franceData,
  regionsMap,
  regionCentroids,
  getDensityColor,
  getPopulationColor,
} from '../data/mapData';

interface FranceMapProps {
  colorMode: ColorMode;
  cityVisibility: CityVisibility;
  deptLabelMode: DeptLabelMode;
  showRegionNames: boolean;
  selectedDept: Department | null;
  selectedRegionCode: string | null;
  hoveredDept: Department | null;
  setHoveredDept: (dept: Department | null) => void;
  hoveredRegionCode?: string | null;
  setHoveredRegionCode?: (code: string | null) => void;
  onSelectDept: (dept: Department) => void;
  onSelectCity: (city: City) => void;
  onSelectRegion?: (code: string | null) => void;
  // Quiz specific props
  isQuizActive?: boolean;
  onQuizGuess?: (dept: Department) => void;
  quizSuccessCode?: string | null;
  quizErrorCode?: string | null;
}

export const FranceMap: React.FC<FranceMapProps> = ({
  colorMode,
  cityVisibility,
  deptLabelMode,
  showRegionNames,
  selectedDept,
  selectedRegionCode,
  hoveredDept,
  setHoveredDept,
  hoveredRegionCode,
  setHoveredRegionCode,
  onSelectDept,
  onSelectCity,
  onSelectRegion,
  isQuizActive = false,
  onQuizGuess,
  quizSuccessCode,
  quizErrorCode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    dept?: Department;
    city?: City;
  }>({
    visible: false,
    x: 0,
    y: 0,
  });

  // Handle Zoom In / Out
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, 0.8));
  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Center on selected department if it changes externally
  useEffect(() => {
    if (selectedDept && !selectedDept.isOverseas && selectedDept.centroid[0] > 0) {
      // Smooth subtle pan towards department centroid
      const targetX = (460 - selectedDept.centroid[0]) * 0.4;
      const targetY = (435 - selectedDept.centroid[1]) * 0.4;
      setPan({ x: targetX, y: targetY });
    }
  }, [selectedDept]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(prev => {
      const next = prev * zoomFactor;
      return Math.min(Math.max(next, 0.8), 5);
    });
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
    // ignore if clicked on a department or button
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      if (tooltip.visible) {
        setTooltip(prev => ({ ...prev, x: relX, y: relY }));
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Filter visible cities
  const visibleCities = useMemo(() => {
    if (cityVisibility === 'none') return [];
    if (cityVisibility === 'all') return franceData.cities;
    // 'major'
    return franceData.cities.filter(
      c =>
        c.type === 'capitale' ||
        c.type === 'prefecture_region' ||
        c.population > 140000
    );
  }, [cityVisibility]);

  // Determine department fill color
  const getDeptColor = (dept: Department) => {
    if (quizSuccessCode === dept.code) return '#22c55e'; // Green flash
    if (quizErrorCode === dept.code) return '#ef4444'; // Red flash

    if (colorMode === 'density') {
      return getDensityColor(dept.density);
    }
    if (colorMode === 'population') {
      return getPopulationColor(dept.population);
    }

    // ColorMode: 'region'
    const reg = regionsMap.get(dept.regionCode);
    return reg ? reg.color : '#6366f1';
  };

  // Handle department click
  const handleDeptClick = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isQuizActive && onQuizGuess) {
      onQuizGuess(dept);
    } else {
      onSelectDept(dept);
    }
  };

  // Tooltip show for department
  const handleDeptMouseEnter = (dept: Department, e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setHoveredDept(dept);
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        dept,
      });
    }
  };

  const handleDeptMouseLeave = () => {
    setHoveredDept(null);
    setTooltip(prev => ({ ...prev, visible: false, dept: undefined }));
  };

  // Tooltip show for city
  const handleCityMouseEnter = (city: City, e: React.MouseEvent) => {
    e.stopPropagation();
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        city,
      });
    }
  };

  const handleCityMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false, city: undefined }));
  };

  return (
    <div
      ref={containerRef}
      id="france-map-container"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-[580px] sm:h-[660px] lg:h-[750px] bg-gradient-to-b from-slate-100/80 via-white to-slate-100/60 rounded-2xl border border-slate-200/80 overflow-hidden shadow-inner select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Floating Zoom & Compass Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-md">
        <button
          id="map-zoom-in"
          onClick={handleZoomIn}
          className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Zoom avant"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="map-zoom-out"
          onClick={handleZoomOut}
          className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Zoom arrière"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="map-reset-zoom"
          onClick={handleResetZoom}
          className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors border-t border-slate-100"
          title="Recentrer la carte"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Compass / Orientation indicator */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-1.5 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-200/70 text-xs font-semibold text-slate-500 shadow-xs">
        <Compass className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
        <span>Nord</span>
      </div>

      {/* Main SVG Vector Canvas */}
      <svg
        ref={svgRef}
        viewBox="0 0 920 870"
        className="w-full h-full transform transition-transform duration-75"
        preserveAspectRatio="xMidYMid meet"
      >
        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          transform-origin="460 435"
          className="transition-transform duration-100 ease-out"
        >
          {/* Defs for gradients & shadows */}
          <defs>
            <filter id="dept-shadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.18" />
            </filter>
            <filter id="dept-hover-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.6" />
            </filter>
            <filter id="inset-shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.1" />
            </filter>
            <filter id="region-badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Background geographical water / border contour accent */}
          <rect
            x="0"
            y="0"
            width="920"
            height="870"
            fill="transparent"
            className="pointer-events-none"
          />

          {/* DROM / Outre-Mer Container Box (Bottom-Left) */}
          <g id="drom-container" className="select-none">
            <rect
              x="20"
              y="615"
              width="285"
              height="205"
              rx="14"
              ry="14"
              fill="#ffffff"
              fillOpacity="0.88"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              filter="url(#inset-shadow)"
            />
            <rect
              x="20"
              y="615"
              width="285"
              height="28"
              rx="14"
              ry="14"
              fill="#f1f5f9"
              fillOpacity="0.95"
            />
            <text
              x="32"
              y="634"
              fontSize="11"
              fontWeight="700"
              fill="#334155"
              letterSpacing="0.03em"
            >
              France d'Outre-Mer (DROM)
            </text>

            {/* Inset Sub-Boxes grid labels */}
            <text x="70" y="655" fontSize="9.5" fontWeight="600" fill="#64748b" textAnchor="middle">
              Guadeloupe (971)
            </text>
            <text x="160" y="655" fontSize="9.5" fontWeight="600" fill="#64748b" textAnchor="middle">
              Martinique (972)
            </text>
            <text x="255" y="655" fontSize="9.5" fontWeight="600" fill="#64748b" textAnchor="middle">
              Guyane (973)
            </text>
            <text x="160" y="745" fontSize="9.5" fontWeight="600" fill="#64748b" textAnchor="middle">
              La Réunion (974)
            </text>
            <text x="70" y="745" fontSize="9.5" fontWeight="600" fill="#64748b" textAnchor="middle">
              Mayotte (976)
            </text>

            {/* Inset dividing dashed guidelines */}
            <rect x="28" y="660" width="84" height="68" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="118" y="660" width="84" height="68" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="208" y="660" width="90" height="150" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="28" y="748" width="84" height="62" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="118" y="748" width="84" height="62" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
          </g>

          {/* Departments Layer */}
          <g id="departments-layer">
            {franceData.departments.map(dept => {
              const isSelected = selectedDept?.code === dept.code;
              const isHovered = hoveredDept?.code === dept.code;
              const isRegionFiltered =
                selectedRegionCode && dept.regionCode !== selectedRegionCode;

              const fillColor = getDeptColor(dept);

              // Opacity rules
              let opacity = 0.94;
              if (isRegionFiltered) opacity = 0.22;
              if (isHovered || isSelected) opacity = 1;

              // Stroke styling
              let strokeColor = '#ffffff';
              let strokeWidth = 1.1;

              if (isSelected) {
                strokeColor = '#0f172a'; // Deep charcoal navy
                strokeWidth = 2.8;
              } else if (isHovered) {
                strokeColor = '#ffffff';
                strokeWidth = 2.4;
              } else if (colorMode === 'region') {
                strokeColor = '#ffffff';
                strokeWidth = 1.2;
              }

              return (
                <path
                  key={dept.code}
                  id={`dept-${dept.code}`}
                  d={dept.svgPath}
                  fill={fillColor}
                  fillOpacity={opacity}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="map-dept-path cursor-pointer"
                  filter={isSelected ? 'url(#dept-shadow)' : isHovered ? 'url(#dept-hover-glow)' : undefined}
                  onClick={e => handleDeptClick(dept, e)}
                  onMouseEnter={e => handleDeptMouseEnter(dept, e)}
                  onMouseMove={e => handleDeptMouseEnter(dept, e)}
                  onMouseLeave={handleDeptMouseLeave}
                />
              );
            })}
          </g>

          {/* Region Names Layer (Large elegant interactive regional banners) */}
          {showRegionNames && (
            <g id="region-names-layer" className="select-none">
              {regionCentroids
                .filter(rc => !rc.isOverseas)
                .map(rc => {
                  const reg = regionsMap.get(rc.code);
                  const isSelected = selectedRegionCode === rc.code;
                  const isHovered = hoveredRegionCode === rc.code;
                  const isOtherFiltered = selectedRegionCode && selectedRegionCode !== rc.code;

                  const regColor = reg?.color || '#4f46e5';
                  // Calculate dynamic badge width based on name length
                  const badgeWidth = Math.max(90, rc.name.length * 8.2 + 24);
                  const badgeHeight = 22;

                  return (
                    <g
                      key={`region-label-${rc.code}`}
                      id={`region-pill-${rc.code}`}
                      transform={`translate(${rc.x}, ${rc.y})`}
                      className="cursor-pointer group transition-transform duration-200"
                      onClick={e => {
                        e.stopPropagation();
                        onSelectRegion?.(isSelected ? null : rc.code);
                      }}
                      onMouseEnter={() => setHoveredRegionCode?.(rc.code)}
                      onMouseLeave={() => setHoveredRegionCode?.(null)}
                      opacity={isOtherFiltered ? 0.28 : isHovered ? 1 : 0.94}
                    >
                      {/* Region Background Pill */}
                      <rect
                        x={-badgeWidth / 2}
                        y={-badgeHeight / 2}
                        width={badgeWidth}
                        height={badgeHeight}
                        rx="11"
                        fill={isSelected ? regColor : isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.92)'}
                        stroke={isSelected ? '#ffffff' : regColor}
                        strokeWidth={isSelected ? '2' : isHovered ? '2' : '1.3'}
                        filter="url(#region-badge-shadow)"
                        className="transition-colors duration-150"
                      />

                      {/* Region Color Dot */}
                      <circle
                        cx={-badgeWidth / 2 + 10}
                        cy="0"
                        r="3.5"
                        fill={isSelected ? '#ffffff' : regColor}
                      />

                      {/* Region Name Text */}
                      <text
                        x={6}
                        y="3.5"
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight={isSelected ? '900' : '800'}
                        fill={isSelected ? '#ffffff' : '#0f172a'}
                        letterSpacing="0.04em"
                        className="transition-colors pointer-events-none"
                      >
                        {rc.name}
                      </text>
                    </g>
                  );
                })}
            </g>
          )}

          {/* Department Labels (Codes, Names, or Both) */}
          {deptLabelMode !== 'none' && (
            <g id="department-labels" className="pointer-events-none select-none">
              {franceData.departments.map(dept => {
                if (dept.isOverseas || dept.centroid[0] <= 0) return null;
                const isSelected = selectedDept?.code === dept.code;
                const isHovered = hoveredDept?.code === dept.code;
                const isRegionFiltered =
                  selectedRegionCode && dept.regionCode !== selectedRegionCode;

                // Handle tiny departments in Paris inner ring (75, 92, 93, 94) to avoid clutter when zoomed out
                const isParisInner = ['75', '92', '93', '94'].includes(dept.code);
                if (isParisInner && zoom < 1.6 && !isSelected && !isHovered) {
                  if (dept.code === '75') {
                    return (
                      <text
                        key={`label-${dept.code}`}
                        x={dept.centroid[0]}
                        y={dept.centroid[1] + 3}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="800"
                        fill="#0f172a"
                        stroke="#ffffff"
                        strokeWidth="3.2"
                        paintOrder="stroke"
                        strokeLinejoin="round"
                        opacity={isRegionFiltered ? 0.3 : 0.95}
                      >
                        75 Paris
                      </text>
                    );
                  }
                  // Omit 92, 93, 94 at low zoom levels unless hovered or zoomed
                  return null;
                }

                // Check visibility: at zoom 1, hide small departments (< 3000 km2) only if not hovered/selected
                const showDeptLabel =
                  zoom >= 1.2 ||
                  isSelected ||
                  isHovered ||
                  dept.areaKm2 > 3400 ||
                  deptLabelMode === 'code';

                if (!showDeptLabel) return null;

                const cx = dept.centroid[0];
                const cy = dept.centroid[1];

                const opacity = isRegionFiltered ? 0.22 : isSelected || isHovered ? 1 : 0.96;
                const textColor = isSelected ? '#0f172a' : isHovered ? '#0f172a' : '#1e293b';
                const haloColor = isSelected ? '#fef08a' : '#ffffff';
                const haloWidth = isSelected ? '3.8' : '3';

                // Display Mode: BOTH (Number + Name)
                if (deptLabelMode === 'both') {
                  return (
                    <g
                      key={`label-${dept.code}`}
                      transform={`translate(${cx}, ${cy})`}
                      opacity={opacity}
                    >
                      {/* Department Code */}
                      <text
                        x="0"
                        y="-1.5"
                        textAnchor="middle"
                        fontSize={isSelected || isHovered ? '10' : zoom >= 1.8 ? '10' : '8.5'}
                        fontWeight="900"
                        fill={textColor}
                        stroke={haloColor}
                        strokeWidth={haloWidth}
                        paintOrder="stroke"
                        strokeLinejoin="round"
                      >
                        {dept.code}
                      </text>
                      {/* Department Name */}
                      <text
                        x="0"
                        y="8.5"
                        textAnchor="middle"
                        fontSize={isSelected || isHovered ? '9' : zoom >= 1.8 ? '8.5' : '7.5'}
                        fontWeight={isSelected || isHovered ? '800' : '700'}
                        fill={textColor}
                        stroke={haloColor}
                        strokeWidth={haloWidth}
                        paintOrder="stroke"
                        strokeLinejoin="round"
                      >
                        {dept.name}
                      </text>
                    </g>
                  );
                }

                // Display Mode: NAME ONLY
                if (deptLabelMode === 'name') {
                  return (
                    <text
                      key={`label-${dept.code}`}
                      x={cx}
                      y={cy + 3}
                      textAnchor="middle"
                      fontSize={isSelected || isHovered ? '10' : zoom >= 1.8 ? '9.5' : '8'}
                      fontWeight={isSelected || isHovered ? '800' : '700'}
                      fill={textColor}
                      stroke={haloColor}
                      strokeWidth={haloWidth}
                      paintOrder="stroke"
                      strokeLinejoin="round"
                      opacity={opacity}
                    >
                      {dept.name}
                    </text>
                  );
                }

                // Display Mode: CODE ONLY
                if (deptLabelMode === 'code') {
                  return (
                    <text
                      key={`label-${dept.code}`}
                      x={cx}
                      y={cy + 3}
                      textAnchor="middle"
                      fontSize={isSelected || isHovered ? '11' : zoom >= 1.8 ? '10' : '8.5'}
                      fontWeight="800"
                      fill={textColor}
                      stroke={haloColor}
                      strokeWidth={haloWidth}
                      paintOrder="stroke"
                      strokeLinejoin="round"
                      opacity={opacity}
                    >
                      {dept.code}
                    </text>
                  );
                }

                return null;
              })}
            </g>
          )}

          {/* City Markers Layer */}
          {visibleCities.length > 0 && (
            <g id="cities-layer">
              {visibleCities.map(city => {
                const isSelected = selectedDept?.code === city.departmentCode;
                const isCapitale = city.type === 'capitale';
                const isPrefRegion = city.type === 'prefecture_region';
                const isFiltered =
                  selectedRegionCode && city.regionCode !== selectedRegionCode;

                if (isFiltered) return null;

                const markerSize = isCapitale ? 6.5 : isPrefRegion ? 5 : 4;

                return (
                  <g
                    key={city.id}
                    id={`marker-${city.id}`}
                    transform={`translate(${city.x}, ${city.y})`}
                    className="cursor-pointer group"
                    onClick={e => {
                      e.stopPropagation();
                      onSelectCity(city);
                    }}
                    onMouseEnter={e => handleCityMouseEnter(city, e)}
                    onMouseMove={e => handleCityMouseEnter(city, e)}
                    onMouseLeave={handleCityMouseLeave}
                  >
                    {/* Pulsing ring for Paris / Capitale */}
                    {isCapitale && (
                      <circle
                        r="11"
                        fill="#f59e0b"
                        fillOpacity="0.3"
                        className="animate-ping"
                      />
                    )}

                    {/* Outer marker ring */}
                    <circle
                      r={markerSize + 1.8}
                      fill="#ffffff"
                      stroke={isCapitale ? '#f59e0b' : isPrefRegion ? '#4f46e5' : '#0f172a'}
                      strokeWidth="1.8"
                      className="transition-transform group-hover:scale-125"
                    />

                    {/* Inner marker dot */}
                    <circle
                      r={markerSize - 1.2}
                      fill={isCapitale ? '#f59e0b' : isPrefRegion ? '#4f46e5' : '#0f172a'}
                      className="transition-transform group-hover:scale-110"
                    />

                    {/* City label text */}
                    {(zoom >= 1.2 || isCapitale || isPrefRegion || isSelected) && (
                      <text
                        x={markerSize + 4}
                        y="3.5"
                        fontSize={isCapitale ? '11.5' : isPrefRegion ? '10' : '8.5'}
                        fontWeight={isCapitale ? '800' : isPrefRegion ? '700' : '600'}
                        fill="#0f172a"
                        stroke="#ffffff"
                        strokeWidth="2.8"
                        paintOrder="stroke"
                        className="pointer-events-none select-none transition-all group-hover:font-extrabold"
                      >
                        {city.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </svg>

      {/* Floating Dynamic Tooltip */}
      {tooltip.visible && tooltip.dept && (
        <div
          className="absolute z-50 pointer-events-none transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${Math.min(
              tooltip.x + 16,
              (containerRef.current?.clientWidth || 800) - 260
            )}px, ${Math.min(
              tooltip.y + 16,
              (containerRef.current?.clientHeight || 600) - 180
            )}px)`,
          }}
        >
          <div className="bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700/60 max-w-xs text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-400/30 text-[11px]">
                  {tooltip.dept.code}
                </span>
                <span className="font-bold text-sm text-slate-50 tracking-tight">
                  {tooltip.dept.name}
                </span>
              </div>
              <span
                className="w-2.5 h-2.5 rounded-full ring-2 ring-white/20"
                style={{
                  backgroundColor:
                    regionsMap.get(tooltip.dept.regionCode)?.color || '#38bdf8',
                }}
              />
            </div>

            <div className="text-[11px] text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Région :</span>
              <span className="font-semibold text-slate-200">
                {tooltip.dept.regionName}
              </span>
            </div>

            <div className="text-[11px] text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Préfecture :</span>
              <span className="font-semibold text-amber-300 flex items-center gap-1">
                ★ {tooltip.dept.prefecture}
              </span>
            </div>

            <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Population :</span>
              <span className="font-mono font-bold text-emerald-400">
                {tooltip.dept.population.toLocaleString('fr-FR')} hab.
              </span>
            </div>

            <div className="text-[11px] text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Densité :</span>
              <span className="font-mono text-slate-200">
                {tooltip.dept.density} hab/km²
              </span>
            </div>

            <div className="text-[10px] text-slate-400 italic pt-0.5 text-center">
              Cliquez pour afficher tous les détails
            </div>
          </div>
        </div>
      )}

      {/* Floating Dynamic Tooltip for City */}
      {tooltip.visible && tooltip.city && (
        <div
          className="absolute z-50 pointer-events-none transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${Math.min(
              tooltip.x + 16,
              (containerRef.current?.clientWidth || 800) - 240
            )}px, ${Math.min(
              tooltip.y + 16,
              (containerRef.current?.clientHeight || 600) - 150
            )}px)`,
          }}
        >
          <div className="bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2 rounded-xl shadow-2xl border border-slate-700/60 max-w-xs text-xs space-y-1">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold text-sm text-slate-50">{tooltip.city.name}</span>
            </div>
            <div className="text-[11px] text-slate-300 flex justify-between">
              <span className="text-slate-400">Statut :</span>
              <span className="font-semibold text-indigo-300">
                {tooltip.city.type === 'capitale'
                  ? 'Capitale de la France'
                  : tooltip.city.type === 'prefecture_region'
                  ? 'Préfecture de région'
                  : tooltip.city.type === 'prefecture'
                  ? 'Préfecture de département'
                  : 'Grande ville / Sous-préfecture'}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 flex justify-between">
              <span className="text-slate-400">Population :</span>
              <span className="font-mono font-bold text-emerald-400">
                {tooltip.city.population.toLocaleString('fr-FR')} hab.
              </span>
            </div>
            <div className="text-[11px] text-slate-300 flex justify-between">
              <span className="text-slate-400">Département :</span>
              <span className="font-semibold text-slate-200">
                Dép. {tooltip.city.departmentCode}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Map watermark / hint footer */}
      <div className="absolute bottom-3 right-4 z-10 hidden sm:flex items-center gap-2 text-[11px] text-slate-600 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-xs">
        <span>Molette / glisser pour zoomer</span>
        <span>•</span>
        <span>Cliquer sur un département</span>
      </div>
    </div>
  );
};
