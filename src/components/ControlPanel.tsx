import React from 'react';
import { GeometryOptions, TriangleVertices } from '../types/geometry';
import { GEOMETRY_PRESETS } from '../utils/geometryMath';
import {
  PenTool,
  Sliders,
  Eye,
  Layers,
  Magnet,
  Trash2,
} from 'lucide-react';

interface ControlPanelProps {
  options: GeometryOptions;
  onOptionsChange: (newOptions: Partial<GeometryOptions>) => void;
  isDrawMode: boolean;
  onToggleDrawMode: () => void;
  onSelectPreset: (presetTriangle: TriangleVertices) => void;
  onClearLocus: () => void;
  activePresetId: string | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  options,
  onOptionsChange,
  isDrawMode,
  onToggleDrawMode,
  onSelectPreset,
  onClearLocus,
  activePresetId,
}) => {
  return (
    <div className="bg-slate-900 border-t border-slate-800 px-6 py-3.5 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Quick Actions & Draw Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Draw Triangle Mode Button */}
          <button
            onClick={onToggleDrawMode}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              isDrawMode
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">{isDrawMode ? 'Cancel Drawing' : 'Draw Triangle (Click 3 pts)'}</span>
          </button>

          {/* Presets Segmented Bar */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-950/70 rounded-lg border border-slate-800/80">
            <span className="text-[11px] text-slate-500 px-2 font-medium">Presets:</span>
            {GEOMETRY_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset.triangle)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Fine-tuning sliders and display toggles */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Alpha Opacity Slider (User requested 25% alpha) */}
          <div className="flex items-center gap-2 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 whitespace-nowrap">Square Fill:</span>
            <input
              type="range"
              min="0.10"
              max="0.60"
              step="0.05"
              value={options.fillAlpha}
              onChange={(e) => onOptionsChange({ fillAlpha: parseFloat(e.target.value) })}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-xs font-mono text-slate-300 min-w-8">
              {Math.round(options.fillAlpha * 100)}%
            </span>
          </div>

          {/* Snap to Grid Toggle */}
          <button
            onClick={() => onOptionsChange({ snapToGrid: !options.snapToGrid })}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              options.snapToGrid
                ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
            }`}
            title="Snap dragged vertices to grid intersections"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>Snap {options.snapToGrid ? 'On (0.5u)' : 'Off'}</span>
          </button>

          {/* Locus Trace Toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOptionsChange({ showLocusTrace: !options.showLocusTrace })}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                options.showLocusTrace
                  ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
              }`}
              title="Show locus path trace of point C and the connecting segment"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Trail</span>
            </button>
            {options.showLocusTrace && (
              <button
                onClick={onClearLocus}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                title="Clear current trail"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Grid Theme Selector */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => onOptionsChange({ gridTheme: 'blueprint' })}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                options.gridTheme === 'blueprint' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Blueprint
            </button>
            <button
              onClick={() => onOptionsChange({ gridTheme: 'paper' })}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                options.gridTheme === 'paper' ? 'bg-slate-800 text-blue-300 font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Graph Paper
            </button>
            <button
              onClick={() => onOptionsChange({ gridTheme: 'slate' })}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                options.gridTheme === 'slate' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Slate
            </button>
          </div>

          {/* More Display Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onOptionsChange({ showInvariantSquareAndCircle: !options.showInvariantSquareAndCircle })}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                options.showInvariantSquareAndCircle
                  ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
              }`}
              title="Toggle Dotted Invariant Square & Circumcircle connecting M, A, B, and Mirrored M'"
            >
              <span>Dotted Square &amp; Circle</span>
            </button>

            <button
              onClick={() => onOptionsChange({ showDiagonals: !options.showDiagonals })}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                options.showDiagonals
                  ? 'bg-slate-800 border-slate-700 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
              title="Toggle diagonal dashed lines in red/green squares"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
