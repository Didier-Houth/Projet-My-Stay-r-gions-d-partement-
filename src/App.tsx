import React, { useState, useCallback, useEffect } from 'react';
import { MapHeader } from './components/MapHeader';
import { FranceMap } from './components/FranceMap';
import { DepartmentDetail } from './components/DepartmentDetail';
import { MapLegend } from './components/MapLegend';
import { QuizOverlay } from './components/QuizOverlay';
import { ColorMode, CityVisibility, Department, City, Region, DeptLabelMode } from './types';
import { departmentsList, regionsList, departmentsMap, regionsMap } from './data/mapData';

// Web Audio synthesizer for tactile quiz feedback
function playChime(isSuccess: boolean) {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      // Pleasant chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      // Gentle warning bump
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.linearRampToValueAtTime(146.83, ctx.currentTime + 0.2); // D3
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Ignore audio context autoplay limitations
  }
}

export default function App() {
  // Main view state
  const [colorMode, setColorMode] = useState<ColorMode>('region');
  const [cityVisibility, setCityVisibility] = useState<CityVisibility>('major');
  const [deptLabelMode, setDeptLabelMode] = useState<DeptLabelMode>('both');
  const [showRegionNames, setShowRegionNames] = useState(true);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedRegionCode, setSelectedRegionCode] = useState<string | null>(null);
  const [hoveredDept, setHoveredDept] = useState<Department | null>(null);
  const [hoveredRegionCode, setHoveredRegionCode] = useState<string | null>(null);

  // Quiz game state
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizTarget, setQuizTarget] = useState<Department | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStreak, setQuizStreak] = useState(0);
  const [quizLastResult, setQuizLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [quizSuccessCode, setQuizSuccessCode] = useState<string | null>(null);
  const [quizErrorCode, setQuizErrorCode] = useState<string | null>(null);

  // Pick random department for quiz
  const pickNewQuizQuestion = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * departmentsList.length);
    setQuizTarget(departmentsList[randomIndex]);
    setQuizLastResult(null);
    setQuizSuccessCode(null);
    setQuizErrorCode(null);
  }, []);

  // Toggle quiz mode
  const handleToggleQuiz = (active: boolean) => {
    setIsQuizActive(active);
    if (active) {
      setQuizScore(0);
      setQuizStreak(0);
      pickNewQuizQuestion();
    } else {
      setQuizTarget(null);
      setQuizLastResult(null);
      setQuizSuccessCode(null);
      setQuizErrorCode(null);
    }
  };

  // Handle guess in Quiz mode
  const handleQuizGuess = (dept: Department) => {
    if (!quizTarget) return;

    if (dept.code === quizTarget.code) {
      // Correct!
      playChime(true);
      setQuizSuccessCode(dept.code);
      setQuizErrorCode(null);
      setQuizLastResult('correct');
      setQuizScore(prev => prev + 10 * Math.max(1, quizStreak + 1));
      setQuizStreak(prev => prev + 1);

      // Auto advance to next question after 800ms
      setTimeout(() => {
        pickNewQuizQuestion();
      }, 900);
    } else {
      // Error
      playChime(false);
      setQuizErrorCode(dept.code);
      setQuizLastResult('wrong');
      setQuizStreak(0);
      setTimeout(() => {
        setQuizErrorCode(null);
      }, 600);
    }
  };

  // Selection handlers
  const handleSelectDepartment = useCallback((dept: Department) => {
    setSelectedDept(dept);
    // If quiz is active, clicking also counts as guess
    if (isQuizActive) {
      handleQuizGuess(dept);
    }
  }, [isQuizActive, quizTarget, quizStreak]);

  const handleSelectCity = useCallback((city: City) => {
    const dept = departmentsMap.get(city.departmentCode);
    if (dept) {
      setSelectedDept(dept);
    }
  }, []);

  const handleSelectRegion = useCallback((code: string | null) => {
    setSelectedRegionCode(code);
    if (code) {
      // If a region is selected, clear active department selection if not in that region
      if (selectedDept && selectedDept.regionCode !== code) {
        setSelectedDept(null);
      }
    }
  }, [selectedDept]);

  const handleResetView = useCallback(() => {
    setSelectedDept(null);
    setSelectedRegionCode(null);
    setHoveredDept(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation & Search Header */}
      <MapHeader
        colorMode={colorMode}
        setColorMode={setColorMode}
        cityVisibility={cityVisibility}
        setCityVisibility={setCityVisibility}
        deptLabelMode={deptLabelMode}
        setDeptLabelMode={setDeptLabelMode}
        showRegionNames={showRegionNames}
        setShowRegionNames={setShowRegionNames}
        selectedRegionCode={selectedRegionCode}
        setSelectedRegionCode={handleSelectRegion}
        onSelectDepartment={handleSelectDepartment}
        onSelectCity={handleSelectCity}
        onResetView={handleResetView}
        isQuizActive={isQuizActive}
        setIsQuizActive={handleToggleQuiz}
      />

      {/* Main App Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
        
        {/* Quiz Overlay Banner when active */}
        {isQuizActive && quizTarget && (
          <QuizOverlay
            targetDept={quizTarget}
            score={quizScore}
            streak={quizStreak}
            lastResult={quizLastResult}
            onNextQuestion={pickNewQuizQuestion}
            onQuitQuiz={() => handleToggleQuiz(false)}
            onGuessTarget={handleQuizGuess}
          />
        )}

        {/* Map & Department Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* Main Map View (8 cols on large screens) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            <FranceMap
              colorMode={colorMode}
              cityVisibility={cityVisibility}
              deptLabelMode={deptLabelMode}
              showRegionNames={showRegionNames}
              selectedDept={selectedDept}
              selectedRegionCode={selectedRegionCode}
              hoveredDept={hoveredDept}
              setHoveredDept={setHoveredDept}
              hoveredRegionCode={hoveredRegionCode}
              setHoveredRegionCode={setHoveredRegionCode}
              onSelectDept={handleSelectDepartment}
              onSelectCity={handleSelectCity}
              onSelectRegion={handleSelectRegion}
              isQuizActive={isQuizActive}
              onQuizGuess={handleQuizGuess}
              quizSuccessCode={quizSuccessCode}
              quizErrorCode={quizErrorCode}
            />
          </div>

          {/* Sidebar / Detailed Info Drawer (4 cols on large screens) */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            <DepartmentDetail
              dept={selectedDept}
              onClose={() => setSelectedDept(null)}
              onSelectRegion={code => handleSelectRegion(code)}
              onSelectCity={handleSelectCity}
            />

            {/* Quick Regional Summary card if a region is active */}
            {selectedRegionCode && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                {(() => {
                  const reg = regionsMap.get(selectedRegionCode);
                  if (!reg) return null;
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: reg.color }}
                          />
                          <h4 className="text-sm font-bold text-slate-800">
                            Région {reg.name}
                          </h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {reg.departments.length} départements
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Chef-lieu régional :</span>
                          <span className="font-semibold text-slate-800">{reg.capital}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Population régionale :</span>
                          <span className="font-semibold text-slate-800">
                            {reg.population.toLocaleString('fr-FR')} hab.
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Superficie :</span>
                          <span className="font-semibold text-slate-800">
                            {reg.areaKm2.toLocaleString('fr-FR')} km²
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Départements composants :
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {reg.departments.map(dCode => {
                            const d = departmentsMap.get(dCode);
                            if (!d) return null;
                            const isSelected = selectedDept?.code === d.code;
                            return (
                              <button
                                key={d.code}
                                onClick={() => handleSelectDepartment(d)}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                  isSelected
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {d.code} - {d.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

        </div>

        {/* Legend & Region Selector Filter */}
        <MapLegend
          colorMode={colorMode}
          selectedRegionCode={selectedRegionCode}
          onSelectRegion={handleSelectRegion}
          hoveredRegionCode={hoveredRegionCode}
          setHoveredRegionCode={setHoveredRegionCode}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-8 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">France Administrative</span>
            <span>•</span>
            <span>Données officielles INSEE & IGN Open Data</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>96 départements métropolitains</span>
            <span>•</span>
            <span>5 départements et régions d'outre-mer</span>
            <span>•</span>
            <span>18 régions administratives</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
