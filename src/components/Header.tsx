import React from 'react';
import { RotateCcw, Play, Pause, Sparkles } from 'lucide-react';

interface HeaderProps {
  isAnimating: boolean;
  onToggleAnimate: () => void;
  onReset: () => void;
  onOpenProofModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAnimating,
  onToggleAnimate,
  onReset,
  onOpenProofModal,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-slate-100 shrink-0">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a href={import.meta.env.BASE_URL} className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-xs font-black shadow-sm shadow-blue-500/50">
            B
          </div>
          <span>Bottema</span>
        </a>
        <span className="hidden sm:inline text-xs text-slate-400 border-l border-slate-700 pl-3">
          Dynamic Triangle & Square Theorem Explorer
        </span>
      </div>

      {/* Zone 2: Navigation / Quick links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={onOpenProofModal}
          className="hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Bottema Theorem Proof</span>
        </button>
        <span className="text-slate-600">·</span>
        <span className="text-slate-300 font-mono">Midpoint M is invariant to C</span>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onToggleAnimate}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
            isAnimating
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
          }`}
          title={isAnimating ? 'Pause automatic orbit' : 'Animate free point C in orbit'}
        >
          {isAnimating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="whitespace-nowrap">{isAnimating ? 'Pause Orbit' : 'Auto Orbit'}</span>
        </button>

        <button
          onClick={onReset}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Reset triangle to default position"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  );
};
