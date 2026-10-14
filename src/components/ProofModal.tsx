import React from 'react';
import { X, Sparkles, BookOpen, Lightbulb } from 'lucide-react';

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProofModal: React.FC<ProofModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Bottema's Theorem &amp; Invariant Midpoint
              </h2>
              <p className="text-xs text-slate-400">The mathematical proof behind the stationary blue dot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300 leading-relaxed">
          {/* Introductory callout */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/20 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Theorem Statement</h4>
              <p className="text-xs text-slate-200 mt-1">
                Let <span className="font-mono text-white">ABC</span> be any triangle. Construct squares externally on sides <span className="font-mono text-red-300">CA</span> and <span className="font-mono text-emerald-300">CB</span>. Let <span className="font-mono text-red-300">P₁</span> and <span className="font-mono text-emerald-300">P₂</span> be the vertices diagonally opposite to <span className="font-mono text-amber-300">C</span> in each square. Then the midpoint <span className="font-mono text-blue-400 font-bold">M</span> of segment <span className="font-mono text-purple-300">P₁P₂</span> is completely independent of <span className="font-mono text-amber-300">C</span>.
              </p>
            </div>
          </div>

          {/* Proof by Complex Numbers */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Vector / Complex Plane Proof</span>
            </h3>

            <p className="text-xs text-slate-300">
              Represent every vertex as a point in the 2D Cartesian plane or complex number plane:
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
              <div className="text-slate-400">
                1. Vector from C to A is (A - C). Rotating clockwise by 90°:
              </div>
              <div className="text-red-300 pl-4">
                P₁ = A - i·(A - C) = (1 - i)A + i·C
              </div>
              <div className="text-slate-400">
                2. Vector from C to B is (B - C). Rotating counterclockwise by 90°:
              </div>
              <div className="text-emerald-300 pl-4">
                P₂ = B + i·(B - C) = (1 + i)B - i·C
              </div>
              <div className="text-slate-400">
                3. Taking the arithmetic midpoint of P₁ and P₂:
              </div>
              <div className="text-blue-300 pl-4 font-bold">
                M = (P₁ + P₂) / 2 = [(1 - i)A + (1 + i)B + (i·C - i·C)] / 2
              </div>
              <div className="text-amber-400 pl-4 font-bold">
                M = [(1 - i)A + (1 + i)B] / 2
              </div>
            </div>
          </div>

          {/* Geometric Interpretation */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
            <h4 className="text-xs font-semibold text-slate-200">Where is the Blue Dot Located?</h4>
            <p className="text-xs text-slate-400">
              Look closely at the formula <span className="font-mono text-slate-300">M = [(1 - i)A + (1 + i)B] / 2</span>.
              This point <span className="text-blue-400 font-semibold font-mono">M</span> is precisely the apex of an isosceles right triangle erected on base <span className="font-mono text-slate-300">AB</span>!
            </p>
            <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
              <li>Angle ∠AMB is always exactly 90°.</li>
              <li>Lengths |MA| and |MB| are always equal.</li>
              <li>Even if you drag C onto the line segment AB (making the triangle degenerate), the blue dot never moves!</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
          >
            Got it, Back to Canvas
          </button>
        </div>
      </div>
    </div>
  );
};
