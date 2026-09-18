import React, { useState, useEffect } from 'react';
import { Trophy, HelpCircle, ArrowRight, RotateCcw, Flame, CheckCircle2, XCircle } from 'lucide-react';
import { Department } from '../types';
import { departmentsList, regionsMap } from '../data/mapData';

interface QuizOverlayProps {
  onGuessTarget: (targetDept: Department) => void;
  targetDept: Department | null;
  score: number;
  streak: number;
  lastResult: 'correct' | 'wrong' | null;
  onNextQuestion: () => void;
  onQuitQuiz: () => void;
}

export const QuizOverlay: React.FC<QuizOverlayProps> = ({
  targetDept,
  score,
  streak,
  lastResult,
  onNextQuestion,
  onQuitQuiz,
}) => {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(false);
  }, [targetDept]);

  if (!targetDept) return null;

  const reg = regionsMap.get(targetDept.regionCode);

  return (
    <div className="bg-white/95 backdrop-blur-md border border-amber-200/90 rounded-2xl p-4 shadow-lg mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Question content */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-200">
            <Trophy className="w-5 h-5" />
          </div>

          <div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Quiz : Trouvez le département sur la carte</span>
              {streak > 1 && (
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black flex items-center gap-0.5">
                  <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                  Série x{streak}
                </span>
              )}
            </div>

            <div className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 mt-0.5">
              <span>Cliquez sur :</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold">
                {targetDept.name} ({targetDept.code})
              </span>
            </div>

            {/* Hint */}
            {showHint && (
              <div className="text-xs text-amber-800 font-medium mt-1 animate-fade-in flex items-center gap-1">
                <span>💡 Indice : situé en région <strong>{targetDept.regionName}</strong> • Préfecture : <strong>{targetDept.prefecture}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-2 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          
          {/* Result badge */}
          {lastResult && (
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-bounce ${
                lastResult === 'correct'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {lastResult === 'correct' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Bravo !</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Raté, réessayez !</span>
                </>
              )}
            </div>
          )}

          {/* Score Counter */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
            Score : <span className="font-mono text-indigo-600 text-sm font-black">{score}</span>
          </div>

          {/* Hint button */}
          {!showHint && (
            <button
              onClick={() => setShowHint(true)}
              className="p-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors"
              title="Obtenir un indice"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {/* Next / Skip button */}
          <button
            onClick={onNextQuestion}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 border border-slate-200 transition-colors"
          >
            <span>Passer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Close / Quit Quiz */}
          <button
            onClick={onQuitQuiz}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Quitter
          </button>
        </div>

      </div>
    </div>
  );
};
