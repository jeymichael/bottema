import React, { useState } from 'react';
import { GeometryCalculation, GeometryOptions } from '../types/geometry';
import { roundCoord } from '../utils/geometryMath';
import { CheckCircle2, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface InspectorDeckProps {
  calculation: GeometryCalculation;
  options: GeometryOptions;
  onOpenProofModal: () => void;
}

export const InspectorDeck: React.FC<InspectorDeckProps> = ({
  calculation,
  options,
  onOpenProofModal,
}) => {
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);
  const { triangle, redSquare, greenSquare, connectingLine, theoreticalMidpoint } = calculation;

  return (
    <aside className="w-full lg:w-84 xl:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto text-slate-200 divide-y divide-slate-800/80">
      {/* 1. Theorem Invariant Verification Banner */}
      <div className="p-4 bg-slate-950/60">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Bottema's Invariant</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                Stationary Dot
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              As you drag the free point <span className="text-amber-400 font-semibold font-mono">C</span> anywhere on the plane, the <span className="text-blue-400 font-semibold">blue dot M</span> remains <strong className="text-white">rock solid</strong>.
            </p>
          </div>
        </div>

        {/* Live Midpoint Coordinates Box */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">Midpoint M (x, y)</span>
            <span className="text-sm font-semibold font-mono tabular-nums text-blue-400">
              ({roundCoord(connectingLine.midpoint.x, 2)}, {roundCoord(connectingLine.midpoint.y, 2)})
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Formula Theoretical</span>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              ({roundCoord(theoreticalMidpoint.x, 2)}, {roundCoord(theoreticalMidpoint.y, 2)})
            </span>
          </div>
        </div>
      </div>

      {/* 2. Geometric Entities Inspection (Tabular) */}
      <div className="p-4 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Live Geometry Metrics
        </div>

        {/* Triangle Vertices */}
        <div className="rounded-lg bg-slate-950/40 border border-slate-800/80 p-3 space-y-2">
          <div className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span>Triangle Vertices</span>
            <span className="text-[10px] text-slate-500 font-mono">Cartesian</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 block">Base A</span>
              <span className="text-slate-200">
                {roundCoord(triangle.A.x, 1)}, {roundCoord(triangle.A.y, 1)}
              </span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 block">Base B</span>
              <span className="text-slate-200">
                {roundCoord(triangle.B.x, 1)}, {roundCoord(triangle.B.y, 1)}
              </span>
            </div>
            <div className="bg-amber-500/10 p-1.5 rounded border border-amber-500/30 text-center">
              <span className="text-[10px] text-amber-400 block font-sans font-medium">Free C</span>
              <span className="text-amber-300 font-semibold">
                {roundCoord(triangle.C.x, 1)}, {roundCoord(triangle.C.y, 1)}
              </span>
            </div>
          </div>
        </div>

        {/* Red Square on Side CA */}
        <div className="rounded-lg bg-red-950/20 border border-red-500/30 p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-red-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500/80 inline-block" />
              <span>Red Square (Moving Side CA)</span>
            </div>
            <span className="text-[10px] font-mono text-red-400/80">25% Alpha Fill</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Side Length</span>
              <span className="text-slate-200 font-semibold">{roundCoord(redSquare.sideLength, 2)}u</span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Area</span>
              <span className="text-slate-200 font-semibold">{roundCoord(redSquare.area, 1)}u²</span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-red-400 block font-sans">Corner P₁</span>
              <span className="text-red-300 font-semibold">
                {roundCoord(redSquare.diagonalOpposite.x, 1)}, {roundCoord(redSquare.diagonalOpposite.y, 1)}
              </span>
            </div>
          </div>
        </div>

        {/* Green Square on Side CB */}
        <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/30 p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-emerald-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80 inline-block" />
              <span>Green Square (Moving Side CB)</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80">25% Alpha Fill</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Side Length</span>
              <span className="text-slate-200 font-semibold">{roundCoord(greenSquare.sideLength, 2)}u</span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Area</span>
              <span className="text-slate-200 font-semibold">{roundCoord(greenSquare.area, 1)}u²</span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-emerald-400 block font-sans">Corner P₂</span>
              <span className="text-emerald-300 font-semibold">
                {roundCoord(greenSquare.diagonalOpposite.x, 1)}, {roundCoord(greenSquare.diagonalOpposite.y, 1)}
              </span>
            </div>
          </div>
        </div>

        {/* Connecting Line P1 -> P2 */}
        <div className="rounded-lg bg-purple-950/20 border border-purple-500/30 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-purple-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-purple-400 inline-block" />
              <span>Connecting Line (P₁ to P₂)</span>
            </div>
            <span className="text-[10px] font-mono text-purple-400/80">Opposite Corners</span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800 text-xs font-mono tabular-nums">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Segment Length</span>
              <span className="text-purple-300 font-semibold">{roundCoord(connectingLine.length, 2)} units</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-sans">Midpoint M</span>
              <span className="text-blue-400 font-semibold">
                ({roundCoord(connectingLine.midpoint.x, 2)}, {roundCoord(connectingLine.midpoint.y, 2)})
              </span>
            </div>
          </div>
        </div>

        {/* Invariant Square & Circumcircle (Asks 1 & 2) */}
        <div className="rounded-lg bg-blue-950/20 border border-blue-500/30 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-blue-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-blue-400 border-dashed inline-block" />
              <span>Dotted Square &amp; Circumcircle</span>
            </div>
            <span className="text-[10px] font-mono text-blue-400/80">Invariant</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Mirrored Point M'</span>
              <span className="text-blue-300 font-semibold">
                ({roundCoord(calculation.mirroredMidpoint.x, 1)}, {roundCoord(calculation.mirroredMidpoint.y, 1)})
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Circle Radius R</span>
              <span className="text-blue-300 font-semibold">
                {roundCoord(calculation.circumcircleRadius, 2)} units
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-sans leading-tight pt-1">
            Vertices <strong className="text-blue-300">M, B, M', A</strong> form an invariant square circumscribed by a circle with diameter <strong className="text-slate-200">AB</strong>.
          </div>
        </div>
      </div>

      {/* 3. Mathematical Proof & Invariant Explanation */}
      <div className="p-4 space-y-3">
        <button
          onClick={() => setShowFormulaDetails(!showFormulaDetails)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer py-1"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Why Does The Blue Dot Never Move?</span>
          </span>
          {showFormulaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showFormulaDetails && (
          <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 text-xs text-slate-300 space-y-2.5 font-sans leading-relaxed animate-in fade-in duration-200">
            <p>
              In Bottema's Theorem, let vertices be represented in the complex plane as <span className="font-mono text-slate-200">A</span>, <span className="font-mono text-slate-200">B</span>, and <span className="font-mono text-amber-300">C</span>:
            </p>
            <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-200 space-y-1">
              <div>P₁ = A - i·(A - C) = (1 - i)A + i·C</div>
              <div>P₂ = B + i·(B - C) = (1 + i)B - i·C</div>
            </div>
            <p>
              When taking the midpoint <span className="font-mono text-blue-400">M = (P₁ + P₂) / 2</span>:
            </p>
            <div className="p-2 bg-blue-950/30 border border-blue-500/20 rounded font-mono text-[11px] text-blue-300">
              M = [(1 - i)A + (1 + i)B + (i - i)C] / 2
              <div className="font-bold text-emerald-400 mt-1">
                = [(1 - i)A + (1 + i)B] / 2
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Notice the term <span className="font-mono text-amber-300">C</span> completely cancels out! The midpoint <span className="text-blue-400 font-semibold">M</span> forms an isosceles right triangle with the base <span className="font-mono text-slate-300">AB</span>.
            </p>
            <button
              onClick={onOpenProofModal}
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium pt-1 block cursor-pointer"
            >
              Read full historical theorem details →
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
