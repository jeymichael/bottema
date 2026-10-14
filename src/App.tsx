import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TriangleVertices, GeometryOptions, Point } from './types/geometry';
import { calculateGeometry, GEOMETRY_PRESETS } from './utils/geometryMath';
import { Header } from './components/Header';
import { GeometryCanvas } from './components/GeometryCanvas';
import { InspectorDeck } from './components/InspectorDeck';
import { ControlPanel } from './components/ControlPanel';
import { ProofModal } from './components/ProofModal';
import { Play, Pause, RotateCcw } from 'lucide-react';

const DEFAULT_TRIANGLE: TriangleVertices = {
  A: { x: -5, y: 0 },
  B: { x: 5, y: 0 },
  C: { x: 2, y: 1 },
};

const DEFAULT_OPTIONS: GeometryOptions = {
  snapToGrid: false,
  gridStep: 0.5,
  fillAlpha: 0.25, // 25% alpha per user brief
  showDiagonals: true,
  showCoordinates: true,
  showRightAngles: true,
  showLocusTrace: false,
  showGrid: true,
  gridTheme: 'paper', // Default to clean graph paper
  squareOrientation: 'standard',
  activeFreePoint: 'C',
  showInvariantSquareAndCircle: true, // Default to showing the dotted square and circle
};

export default function App() {
  const [triangle, setTriangle] = useState<TriangleVertices>(DEFAULT_TRIANGLE);
  const [options, setOptions] = useState<GeometryOptions>(DEFAULT_OPTIONS);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [viewResetKey, setViewResetKey] = useState(0);

  // Locus trail states
  const [locusPoints, setLocusPoints] = useState<Point[]>([]);
  const [locusLines, setLocusLines] = useState<Array<{ start: Point; end: Point }>>([]);

  // Auto-Orbit Animation
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const orbitTimeRef = useRef(0);
  const orbitCenterRef = useRef<Point>({ x: 2, y: 1 });

  // Calculate geometry entities in real time
  const calculation = calculateGeometry(triangle, options);

  // Update options helper
  const handleOptionsChange = (newOptions: Partial<GeometryOptions>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  };

  // Select preset
  const handleSelectPreset = (presetTriangle: TriangleVertices) => {
    setIsAnimating(false);
    setTriangle(presetTriangle);
    setLocusPoints([]);
    setLocusLines([]);
    orbitCenterRef.current = { ...presetTriangle.C };
    const matched = GEOMETRY_PRESETS.find(
      (p) => JSON.stringify(p.triangle) === JSON.stringify(presetTriangle)
    );
    setActivePresetId(matched?.id || null);
  };

  // Reset to default
  const handleReset = () => {
    setIsAnimating(false);
    setTriangle(DEFAULT_TRIANGLE);
    setLocusPoints([]);
    setLocusLines([]);
    orbitCenterRef.current = { ...DEFAULT_TRIANGLE.C };
    setActivePresetId(null);
    setViewResetKey((k) => k + 1);
  };

  // Add points to locus trace
  const handleAddLocusPoint = useCallback((pt: Point, line: { start: Point; end: Point }) => {
    setLocusPoints((prev) => {
      const next = [...prev, pt];
      return next.length > 100 ? next.slice(-100) : next;
    });
    setLocusLines((prev) => {
      const next = [...prev, line];
      return next.length > 50 ? next.slice(-50) : next;
    });
  }, []);

  // Clear locus trace
  const handleClearLocus = () => {
    setLocusPoints([]);
    setLocusLines([]);
  };

  // Animation Loop for Auto Orbit
  useEffect(() => {
    if (!isAnimating) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const radiusX = 3.2;
    const radiusY = 2.0;

    const animate = () => {
      orbitTimeRef.current += 0.015;
      const t = orbitTimeRef.current;
      const nextC = {
        x: orbitCenterRef.current.x + Math.sin(t) * radiusX,
        y: orbitCenterRef.current.y + Math.cos(t * 1.5) * radiusY,
      };

      setTriangle((prev) => ({
        ...prev,
        C: nextC,
      }));

      if (options.showLocusTrace) {
        // Sample every 4th frame
        if (Math.floor(t * 60) % 4 === 0) {
          const currentCalc = calculateGeometry(
            { ...triangle, C: nextC },
            options
          );
          handleAddLocusPoint(nextC, {
            start: currentCalc.redSquare.diagonalOpposite,
            end: currentCalc.greenSquare.diagonalOpposite,
          });
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isAnimating, options, handleAddLocusPoint, triangle]);

  return (
    <div className="flex flex-col h-full w-full lg:min-h-[500px] overflow-hidden bg-slate-950 font-sans">
      {/* 1. Header (Adhering to Top Bar Contract) — desktop only; mobile is canvas-only */}
      <div className="hidden lg:block">
      <Header
        isAnimating={isAnimating}
        onToggleAnimate={() => setIsAnimating(!isAnimating)}
        onReset={handleReset}
        onOpenProofModal={() => setIsProofModalOpen(true)}
      />
      </div>

      {/* 2. Main Visual Interactive Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left/Center: Interactive SVG Graph Sheet Canvas */}
        <main className="flex-1 h-full relative">
          <GeometryCanvas
            calculation={calculation}
            options={options}
            isDrawMode={isDrawMode}
            onUpdateTriangle={(newTri) => {
              if (isAnimating) setIsAnimating(false);
              setTriangle(newTri);
              setActivePresetId(null);
            }}
            onFinishDrawMode={() => setIsDrawMode(false)}
            locusPoints={locusPoints}
            locusLines={locusLines}
            onAddLocusPoint={handleAddLocusPoint}
            viewResetKey={viewResetKey}
          />

          {/* Mobile-only canvas actions (header is hidden below lg) */}
          <div className="lg:hidden absolute bottom-4 left-4 z-10 flex items-center gap-2">
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xl ${
                isAnimating
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="whitespace-nowrap">{isAnimating ? 'Pause Orbit' : 'Auto Orbit'}</span>
            </button>
            <button
              onClick={handleReset}
              className="px-3.5 py-2 text-sm font-medium text-slate-200 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 rounded-xl border border-slate-700 shadow-xl flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </main>

        {/* Right: Metrics & Inspection Deck (desktop only) */}
        <div className="hidden lg:flex h-full">
        <InspectorDeck
          calculation={calculation}
          options={options}
          onOpenProofModal={() => setIsProofModalOpen(true)}
        />
        </div>
      </div>

      {/* 3. Control Panel (Bottom Deck, desktop only) */}
      <div className="hidden lg:block">
      <ControlPanel
        options={options}
        onOptionsChange={handleOptionsChange}
        isDrawMode={isDrawMode}
        onToggleDrawMode={() => setIsDrawMode(!isDrawMode)}
        onSelectPreset={handleSelectPreset}
        onClearLocus={handleClearLocus}
        activePresetId={activePresetId}
      />
      </div>

      {/* 4. Educational Bottema Theorem Modal */}
      <ProofModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
      />
    </div>
  );
}
