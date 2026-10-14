import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Point,
  TriangleVertices,
  GeometryCalculation,
  GeometryOptions,
  ViewportTransform,
} from '../types/geometry';
import {
  worldToScreen,
  screenToWorld,
  snapPoint,
  roundCoord,
} from '../utils/geometryMath';
import { ZoomIn, ZoomOut, Crosshair, Move, Hand, Sparkles } from 'lucide-react';

interface GeometryCanvasProps {
  calculation: GeometryCalculation;
  options: GeometryOptions;
  isDrawMode: boolean;
  onUpdateTriangle: (triangle: TriangleVertices) => void;
  onFinishDrawMode?: () => void;
  locusPoints: Point[];
  locusLines: Array<{ start: Point; end: Point }>;
  onAddLocusPoint: (pt: Point, line: { start: Point; end: Point }) => void;
  viewResetKey?: number; // bump to reset zoom & pan
}

export const GeometryCanvas: React.FC<GeometryCanvasProps> = ({
  calculation,
  options,
  isDrawMode,
  onUpdateTriangle,
  onFinishDrawMode,
  locusPoints,
  locusLines,
  onAddLocusPoint,
  viewResetKey = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 650 });
  const [transform, setTransform] = useState<ViewportTransform>({
    zoom: 1,
    panX: 0,
    panY: 20,
  });

  const [activeDragging, setActiveDragging] = useState<'A' | 'B' | 'C' | 'pan' | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<'A' | 'B' | 'C' | null>(null);
  const [drawClicks, setDrawClicks] = useState<Point[]>([]);

  const dragStartRef = useRef<{ screenX: number; screenY: number; initPanX: number; initPanY: number }>({
    screenX: 0,
    screenY: 0,
    initPanX: 0,
    initPanY: 0,
  });

  const vertexDragStartRef = useRef<{ screenX: number; screenY: number; world: Point; zoom: number }>({
    screenX: 0,
    screenY: 0,
    world: { x: 0, y: 0 },
    zoom: 1,
  });

  // Latest calculation, read when fitting the view on first measure
  const calculationRef = useRef(calculation);
  calculationRef.current = calculation;
  const hasFittedRef = useRef(false);

  // World-space bounding box of the whole figure, padded by `pad` units
  const figureBounds = (calc: GeometryCalculation, pad: number) => {
    const pts = [
      calc.triangle.A,
      calc.triangle.B,
      calc.triangle.C,
      ...calc.redSquare.vertices,
      ...calc.greenSquare.vertices,
      ...calc.invariantSquareVertices,
    ];
    return {
      minX: Math.min(...pts.map((p) => p.x)) - pad,
      maxX: Math.max(...pts.map((p) => p.x)) + pad,
      minY: Math.min(...pts.map((p) => p.y)) - pad,
      maxY: Math.max(...pts.map((p) => p.y)) + pad,
    };
  };

  // Zoom & pan so the whole figure fits the viewport, never zooming in past maxZoom
  const fitTransform = (width: number, height: number, maxZoom = 1): ViewportTransform => {
    const { minX, maxX, minY, maxY } = figureBounds(calculationRef.current, 1.5); // room for labels
    const zoom = Math.min(
      Math.max(Math.min(width / ((maxX - minX) * 40), height / ((maxY - minY) * 40)), 0.05),
      maxZoom
    );
    return {
      zoom,
      panX: -((minX + maxX) / 2) * 40 * zoom,
      panY: ((minY + maxY) / 2) * 40 * zoom,
    };
  };

  const isNarrow = (width: number) => width < 1024;

  // Track dimensions with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setDimensions({ width: clientWidth, height: clientHeight });
          if (!hasFittedRef.current) {
            hasFittedRef.current = true;
            if (isNarrow(window.innerWidth)) setTransform(fitTransform(clientWidth, clientHeight));
          }
        }
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto zoom-out: when a drag or orbit pushes the figure past the viewport edge,
  // zoom out (never in) and re-center so everything stays in view.
  useEffect(() => {
    if (!hasFittedRef.current) return;
    const { width, height } = dimensions;
    const { minX, maxX, minY, maxY } = figureBounds(calculation, 0.5);
    setTransform((t) => {
      const topLeft = worldToScreen({ x: minX, y: maxY }, width, height, t.panX, t.panY, t.zoom, 40);
      const bottomRight = worldToScreen({ x: maxX, y: minY }, width, height, t.panX, t.panY, t.zoom, 40);
      const inView =
        topLeft.x >= 0 && topLeft.y >= 0 && bottomRight.x <= width && bottomRight.y <= height;
      return inView ? t : fitTransform(width, height, t.zoom);
    });
  }, [calculation, dimensions]);

  const { triangle, redSquare, greenSquare, connectingLine } = calculation;
  const isDraggingVertex = activeDragging !== null && activeDragging !== 'pan';
  const unitPx = 40; // 1 coordinate unit = 40 pixels

  const toScreen = useCallback(
    (p: Point) =>
      worldToScreen(p, dimensions.width, dimensions.height, transform.panX, transform.panY, transform.zoom, unitPx),
    [dimensions, transform, unitPx]
  );

  const toWorld = useCallback(
    (sx: number, sy: number) =>
      screenToWorld(sx, sy, dimensions.width, dimensions.height, transform.panX, transform.panY, transform.zoom, unitPx),
    [dimensions, transform, unitPx]
  );

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.909;
    const newZoom = Math.min(Math.max(transform.zoom * zoomFactor, 0.05), 3.0);

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const originX = dimensions.width / 2 + transform.panX;
      const originY = dimensions.height / 2 + transform.panY;

      const newPanX = mouseX - (mouseX - originX) * (newZoom / transform.zoom) - dimensions.width / 2;
      const newPanY = mouseY - (mouseY - originY) * (newZoom / transform.zoom) - dimensions.height / 2;

      setTransform({
        zoom: newZoom,
        panX: newPanX,
        panY: newPanY,
      });
    }
  };

  // Global window pointer move & up listeners for ultra-reliable dragging
  useEffect(() => {
    if (!activeDragging) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (activeDragging === 'pan') {
        const dx = e.clientX - dragStartRef.current.screenX;
        const dy = e.clientY - dragStartRef.current.screenY;
        setTransform((prev) => ({
          ...prev,
          panX: dragStartRef.current.initPanX + dx,
          panY: dragStartRef.current.initPanY + dy,
        }));
        return;
      }

      // Dragging a vertex (A, B, or C): map the finger's displacement using the zoom at
      // drag start, so auto zoom-out mid-drag can't feed back and fling the vertex away
      const start = vertexDragStartRef.current;
      const scale = unitPx * start.zoom;
      let worldPt = {
        x: start.world.x + (e.clientX - start.screenX) / scale,
        y: start.world.y - (e.clientY - start.screenY) / scale,
      };

      if (options.snapToGrid) {
        worldPt = snapPoint(worldPt, options.gridStep);
      }

      const updated = { ...triangle, [activeDragging]: worldPt };
      onUpdateTriangle(updated);

      if (options.showLocusTrace && activeDragging === 'C') {
        onAddLocusPoint(worldPt, {
          start: redSquare.diagonalOpposite,
          end: greenSquare.diagonalOpposite,
        });
      }
    };

    const handleGlobalPointerUp = () => {
      setActiveDragging(null);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [activeDragging, options.snapToGrid, options.gridStep, options.showLocusTrace, toWorld, triangle, onUpdateTriangle, onAddLocusPoint, redSquare.diagonalOpposite, greenSquare.diagonalOpposite]);

  // Pointer Down on a specific vertex
  const handleVertexPointerDown = (e: React.PointerEvent, target: 'A' | 'B' | 'C') => {
    e.preventDefault();
    e.stopPropagation(); // CRITICAL: prevent canvas pan from overwriting vertex drag!
    vertexDragStartRef.current = {
      screenX: e.clientX,
      screenY: e.clientY,
      world: { ...triangle[target] },
      zoom: transform.zoom,
    };
    setActiveDragging(target);
  };

  // Pointer Down on background canvas
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();

    if (isDrawMode) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      let worldPt = toWorld(sx, sy);
      if (options.snapToGrid) {
        worldPt = snapPoint(worldPt, options.gridStep);
      }

      const nextClicks = [...drawClicks, worldPt];
      setDrawClicks(nextClicks);

      if (nextClicks.length === 3) {
        onUpdateTriangle({
          A: nextClicks[0],
          B: nextClicks[1],
          C: nextClicks[2],
        });
        setDrawClicks([]);
        onFinishDrawMode?.();
      }
      return;
    }

    // Start canvas panning
    setActiveDragging('pan');
    dragStartRef.current = {
      screenX: e.clientX,
      screenY: e.clientY,
      initPanX: transform.panX,
      initPanY: transform.panY,
    };
  };

  // Screen coordinates
  const sA = toScreen(triangle.A);
  const sB = toScreen(triangle.B);
  const sC = toScreen(triangle.C);

  const sRedSquare = redSquare.vertices.map(toScreen);
  const sGreenSquare = greenSquare.vertices.map(toScreen);

  const sPA = toScreen(connectingLine.start);
  const sPB = toScreen(connectingLine.end);
  const sM = toScreen(connectingLine.midpoint);

  // Invariant square & circumcircle screen entities (Asks 1 & 2)
  const sMirroredM = toScreen(calculation.mirroredMidpoint);
  const sBaseCenter = toScreen(calculation.baseMidpoint);
  const circumcircleRadiusPx = calculation.circumcircleRadius * unitPx * transform.zoom;
  const invariantSquarePoints = `${sM.x},${sM.y} ${sB.x},${sB.y} ${sMirroredM.x},${sMirroredM.y} ${sA.x},${sA.y}`;

  // Grid system parameters
  const currentUnitPx = unitPx * transform.zoom;
  const originX = dimensions.width / 2 + transform.panX;
  const originY = dimensions.height / 2 + transform.panY;

  const minWorldX = Math.floor((-originX) / currentUnitPx) - 1;
  const maxWorldX = Math.ceil((dimensions.width - originX) / currentUnitPx) + 1;
  const minWorldY = Math.floor((originY - dimensions.height) / currentUnitPx) - 1;
  const maxWorldY = Math.ceil(originY / currentUnitPx) + 1;

  // Adaptive grid spacing: widen major lines (1, 2, 5, 10, …) as the view zooms out
  const majorStep = [1, 2, 5, 10, 20, 50, 100, 200].find((s) => s * currentUnitPx >= 16) ?? 200;
  const labelEvery = majorStep * currentUnitPx < 30 ? 2 : 1; // label every Nth major line
  const isOnMajor = (v: number) => Math.abs(v / majorStep - Math.round(v / majorStep)) < 0.001;
  const firstMajor = (v: number) => Math.floor(v / majorStep) * majorStep;

  // Distinct Theme Styling for genuine graph paper
  const theme = options.gridTheme;
  const isPaper = theme === 'paper';
  const isBlueprint = theme === 'blueprint';

  // High-contrast, authentic colors
  const bgColor = isPaper ? '#f8fafc' : isBlueprint ? '#09152e' : '#0f172a';
  const majorGridColor = isPaper ? 'rgba(56, 189, 248, 0.45)' : isBlueprint ? 'rgba(56, 189, 248, 0.4)' : 'rgba(71, 85, 105, 0.45)';
  const minorGridColor = isPaper ? 'rgba(14, 165, 233, 0.18)' : isBlueprint ? 'rgba(14, 165, 233, 0.16)' : 'rgba(51, 65, 85, 0.25)';
  const axisLineColor = isPaper ? '#0f172a' : isBlueprint ? '#38bdf8' : '#94a3b8';
  const labelColor = isPaper ? '#334155' : isBlueprint ? '#93c5fd' : '#cbd5e1';

  // Grid lines accumulation
  const gridElements: React.ReactNode[] = [];

  if (options.showGrid) {
    // Minor subdivisions (0.2 or 0.5 units) for true graph paper feel
    const minorStep =
      majorStep === 1 ? (transform.zoom >= 1.2 ? 0.2 : 0.5) : majorStep / (String(majorStep)[0] === '2' ? 4 : 5);
    const showMinor = minorStep * currentUnitPx >= 5;
    for (let x = firstMajor(minWorldX); showMinor && x <= maxWorldX; x += minorStep) {
      if (isOnMajor(x)) continue;
      const sx = originX + x * currentUnitPx;
      gridElements.push(
        <line
          key={`sub-x-${x.toFixed(1)}`}
          x1={sx}
          y1={0}
          x2={sx}
          y2={dimensions.height}
          stroke={minorGridColor}
          strokeWidth="0.75"
        />
      );
    }
    for (let y = firstMajor(minWorldY); showMinor && y <= maxWorldY; y += minorStep) {
      if (isOnMajor(y)) continue;
      const sy = originY - y * currentUnitPx;
      gridElements.push(
        <line
          key={`sub-y-${y.toFixed(1)}`}
          x1={0}
          y1={sy}
          x2={dimensions.width}
          y2={sy}
          stroke={minorGridColor}
          strokeWidth="0.75"
        />
      );
    }

    // Major 1.0 unit grid lines
    for (let x = firstMajor(minWorldX); x <= maxWorldX; x += majorStep) {
      const sx = originX + x * currentUnitPx;
      const isZero = x === 0;
      gridElements.push(
        <line
          key={`maj-x-${x}`}
          x1={sx}
          y1={0}
          x2={sx}
          y2={dimensions.height}
          stroke={isZero ? axisLineColor : majorGridColor}
          strokeWidth={isZero ? '2' : '1.25'}
        />
      );

      // X-Axis Number labels
      if (!isZero && Math.round(x / majorStep) % labelEvery === 0) {
        const clampedY = Math.min(Math.max(originY + 16, 20), dimensions.height - 10);
        gridElements.push(
          <text
            key={`lbl-x-${x}`}
            x={sx}
            y={clampedY}
            fill={labelColor}
            fontSize="11"
            fontFamily="monospace"
            fontWeight="600"
            textAnchor="middle"
            className="select-none pointer-events-none"
          >
            {x}
          </text>
        );
      }
    }

    // Y-Axis grid lines & labels
    for (let y = firstMajor(minWorldY); y <= maxWorldY; y += majorStep) {
      const sy = originY - y * currentUnitPx;
      const isZero = y === 0;
      gridElements.push(
        <line
          key={`maj-y-${y}`}
          x1={0}
          y1={sy}
          x2={dimensions.width}
          y2={sy}
          stroke={isZero ? axisLineColor : majorGridColor}
          strokeWidth={isZero ? '2' : '1.25'}
        />
      );

      // Y-Axis Number labels
      if (!isZero && Math.round(y / majorStep) % labelEvery === 0) {
        const clampedX = Math.min(Math.max(originX - 8, 24), dimensions.width - 24);
        gridElements.push(
          <text
            key={`lbl-y-${y}`}
            x={clampedX}
            y={sy + 4}
            fill={labelColor}
            fontSize="11"
            fontFamily="monospace"
            fontWeight="600"
            textAnchor="end"
            className="select-none pointer-events-none"
          >
            {y}
          </text>
        );
      }
    }

    // Origin (0,0) label
    gridElements.push(
      <text
        key="lbl-origin"
        x={originX - 8}
        y={originY + 16}
        fill={labelColor}
        fontSize="11"
        fontFamily="monospace"
        fontWeight="bold"
        textAnchor="end"
        className="select-none pointer-events-none"
      >
        (0,0)
      </text>
    );
  }

  // Polygon point strings
  const redSquarePoints = sRedSquare.map((p) => `${p.x},${p.y}`).join(' ');
  const greenSquarePoints = sGreenSquare.map((p) => `${p.x},${p.y}`).join(' ');
  const trianglePoints = `${sA.x},${sA.y} ${sB.x},${sB.y} ${sC.x},${sC.y}`;

  const resetView = () => {
    if (isNarrow(window.innerWidth)) {
      setTransform(fitTransform(dimensions.width, dimensions.height));
    } else {
      setTransform({ zoom: 1, panX: 0, panY: 20 });
    }
  };

  // Parent-triggered view reset (e.g. the Reset button)
  useEffect(() => {
    if (viewResetKey > 0) resetView();
  }, [viewResetKey]);

  return (
    <div
      ref={containerRef}
      style={{ backgroundColor: bgColor }}
      className="relative w-full h-full overflow-hidden select-none touch-none transition-colors duration-200"
      onWheel={handleWheel}
    >
      <svg
        className={`w-full h-full ${activeDragging === 'pan' ? 'cursor-grabbing' : 'cursor-default'}`}
        onPointerDown={handleCanvasPointerDown}
      >
        <defs>
          <radialGradient id="blueGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
          </radialGradient>
          <filter id="shadowGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#2563eb" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* 1. Precision Graph Sheet Grid */}
        <g className="grid-layer pointer-events-none">{gridElements}</g>

        {/* 2. Locus / Movement Trails (if enabled) */}
        {options.showLocusTrace && (
          <g className="locus-layer pointer-events-none">
            {locusLines.map((line, idx) => {
              const p1 = toScreen(line.start);
              const p2 = toScreen(line.end);
              const alpha = Math.max(0.04, (idx / locusLines.length) * 0.25);
              return (
                <line
                  key={`ll-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#a855f7"
                  strokeWidth="1.2"
                  strokeOpacity={alpha}
                />
              );
            })}
            {locusPoints.map((pt, idx) => {
              const sp = toScreen(pt);
              const alpha = Math.max(0.1, (idx / locusPoints.length) * 0.7);
              return (
                <circle
                  key={`lp-${idx}`}
                  cx={sp.x}
                  cy={sp.y}
                  r="2"
                  fill="#f59e0b"
                  fillOpacity={alpha}
                />
              );
            })}
          </g>
        )}

        {/* 3. Red Square on Side CA (Filled with red 25% alpha) */}
        <g className="red-square-layer">
          <polygon
            points={redSquarePoints}
            fill={`rgba(239, 68, 68, ${options.fillAlpha})`}
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Diagonal across from C to P_A */}
          {options.showDiagonals && (
            <line
              x1={sC.x}
              y1={sC.y}
              x2={sPA.x}
              y2={sPA.y}
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="5,4"
              opacity="0.8"
            />
          )}

          {/* Area label in square center */}
          <text
            x={(sRedSquare[0].x + sRedSquare[2].x) / 2}
            y={(sRedSquare[0].y + sRedSquare[2].y) / 2 + 4}
            fill="#dc2626"
            fontSize="12"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
            className="pointer-events-none select-none"
          >
            Red Square ({roundCoord(redSquare.area, 1)}u²)
          </text>
        </g>

        {/* 4. Green Square on Side CB (Filled with green 25% alpha) */}
        <g className="green-square-layer">
          <polygon
            points={greenSquarePoints}
            fill={`rgba(34, 197, 94, ${options.fillAlpha})`}
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Diagonal across from C to P_B */}
          {options.showDiagonals && (
            <line
              x1={sC.x}
              y1={sC.y}
              x2={sPB.x}
              y2={sPB.y}
              stroke="#22c55e"
              strokeWidth="1.5"
              strokeDasharray="5,4"
              opacity="0.8"
            />
          )}

          {/* Area label in square center */}
          <text
            x={(sGreenSquare[0].x + sGreenSquare[2].x) / 2}
            y={(sGreenSquare[0].y + sGreenSquare[2].y) / 2 + 4}
            fill="#16a34a"
            fontSize="12"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
            className="pointer-events-none select-none"
          >
            Green Square ({roundCoord(greenSquare.area, 1)}u²)
          </text>
        </g>

        {/* 5. The Triangle ABC */}
        <g className="triangle-layer">
          {/* Subtle interior fill */}
          <polygon
            points={trianglePoints}
            fill={isPaper ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.12)'}
            stroke="none"
          />

          {/* Base AB */}
          <line
            x1={sA.x}
            y1={sA.y}
            x2={sB.x}
            y2={sB.y}
            stroke={isPaper ? '#334155' : '#94a3b8'}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Moving Side CA (Red edge) */}
          <line
            x1={sC.x}
            y1={sC.y}
            x2={sA.x}
            y2={sA.y}
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Moving Side CB (Green edge) */}
          <line
            x1={sC.x}
            y1={sC.y}
            x2={sB.x}
            y2={sB.y}
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* 6. Connecting Line Between Diagonally Opposite Points P1 and P2 */}
        <g className="connecting-line-layer">
          <line
            x1={sPA.x}
            y1={sPA.y}
            x2={sPB.x}
            y2={sPB.y}
            stroke="#9333ea"
            strokeWidth="3"
            strokeDasharray="6,4"
            strokeLinecap="round"
          />

          {/* Diagonally opposite corner P1 (in Red Square) */}
          <g className="corner-p1">
            <circle cx={sPA.x} cy={sPA.y} r="6.5" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            <text
              x={sPA.x + 9}
              y={sPA.y - 9}
              fill="#ef4444"
              fontSize="12"
              fontFamily="monospace"
              fontWeight="bold"
              className="pointer-events-none select-none"
            >
              P₁ (Red Corner)
            </text>
          </g>

          {/* Diagonally opposite corner P2 (in Green Square) */}
          <g className="corner-p2">
            <circle cx={sPB.x} cy={sPB.y} r="6.5" fill="#22c55e" stroke="#ffffff" strokeWidth="2" />
            <text
              x={sPB.x + 9}
              y={sPB.y - 9}
              fill="#22c55e"
              fontSize="12"
              fontFamily="monospace"
              fontWeight="bold"
              className="pointer-events-none select-none"
            >
              P₂ (Green Corner)
            </text>
          </g>

          {/* Length label */}
          <text
            x={(sPA.x + sPB.x) / 2 + 10}
            y={(sPA.y + sPB.y) / 2 - 14}
            fill="#9333ea"
            fontSize="11"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="start"
            className="pointer-events-none select-none"
          >
            Line P₁P₂ = {roundCoord(connectingLine.length, 2)}u
          </text>
        </g>

        {/* 7. Distinct BLUE Dot at Midpoint M (Bottema Invariant) */}
        <g className="midpoint-layer">
          {/* Glowing halo */}
          <circle cx={sM.x} cy={sM.y} r="26" fill="url(#blueGlow)" className="pointer-events-none" />

          {/* Target outer ring */}
          <circle
            cx={sM.x}
            cy={sM.y}
            r="12"
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeDasharray="3,3"
            className="pointer-events-none"
          />

          {/* Distinct BLUE Dot */}
          <circle
            cx={sM.x}
            cy={sM.y}
            r="8"
            fill="#2563eb"
            stroke="#ffffff"
            strokeWidth="2.5"
            filter="url(#shadowGlow)"
            className="pointer-events-none"
          />

          {/* Center pinpoint */}
          <circle cx={sM.x} cy={sM.y} r="2.5" fill="#ffffff" className="pointer-events-none" />

          {/* Clean Midpoint Label M (removed bulky 'Blue Midpoint' text) */}
          <text
            x={sM.x + 12}
            y={sM.y - 10}
            fill="#2563eb"
            fontSize="13"
            fontFamily="monospace"
            fontWeight="bold"
            className="pointer-events-none select-none"
          >
            M{options.showCoordinates && ` (${roundCoord(connectingLine.midpoint.x, 1)}, ${roundCoord(connectingLine.midpoint.y, 1)})`}
          </text>
        </g>

        {/* 7b. Invariant Dotted Square & Circumcircle (Asks 1 & 2) */}
        {options.showInvariantSquareAndCircle && (
          <g className="invariant-square-circle-layer pointer-events-none">
            {/* (2) Dotted Line Circle around the square (Circumcircle) */}
            <circle
              cx={sBaseCenter.x}
              cy={sBaseCenter.y}
              r={circumcircleRadiusPx}
              fill="rgba(37, 99, 235, 0.03)"
              stroke="#2563eb"
              strokeWidth="2"
              strokeDasharray="6,4"
            />

            {/* (1) Dotted-Line Square connecting Blue midpoint M, Bottom points B & A, and Mirrored Blue point M' */}
            <polygon
              points={invariantSquarePoints}
              fill="rgba(37, 99, 235, 0.08)"
              stroke="#2563eb"
              strokeWidth="2.25"
              strokeDasharray="5,4"
              strokeLinejoin="round"
            />

            {/* Diagonal axis: segment from M to M' */}
            <line
              x1={sM.x}
              y1={sM.y}
              x2={sMirroredM.x}
              y2={sMirroredM.y}
              stroke="#3b82f6"
              strokeWidth="1.2"
              strokeDasharray="3,3"
              opacity="0.5"
            />

            {/* Base Midpoint O (Center of circumcircle) */}
            <g className="base-center-marker">
              <circle cx={sBaseCenter.x} cy={sBaseCenter.y} r="3.5" fill="#2563eb" />
              <text
                x={sBaseCenter.x + 8}
                y={sBaseCenter.y + 12}
                fill={isPaper ? '#1e40af' : '#60a5fa'}
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                Center O ({roundCoord(calculation.baseMidpoint.x, 1)}, {roundCoord(calculation.baseMidpoint.y, 1)})
              </text>
            </g>

            {/* Mirrored Blue Point below the line (M') */}
            <g className="mirrored-midpoint-marker">
              {/* Glowing halo */}
              <circle cx={sMirroredM.x} cy={sMirroredM.y} r="22" fill="url(#blueGlow)" />
              {/* Outer target ring */}
              <circle
                cx={sMirroredM.x}
                cy={sMirroredM.y}
                r="12"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeDasharray="3,3"
              />
              {/* Core distinct blue dot */}
              <circle
                cx={sMirroredM.x}
                cy={sMirroredM.y}
                r="7.5"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="2"
                filter="url(#shadowGlow)"
              />
              <circle cx={sMirroredM.x} cy={sMirroredM.y} r="2" fill="#ffffff" />

              {/* Clean label M' */}
              <text
                x={sMirroredM.x + 12}
                y={sMirroredM.y + 16}
                fill="#2563eb"
                fontSize="13"
                fontFamily="monospace"
                fontWeight="bold"
                className="pointer-events-none select-none"
              >
                M'{options.showCoordinates && ` (${roundCoord(calculation.mirroredMidpoint.x, 1)}, ${roundCoord(calculation.mirroredMidpoint.y, 1)})`}
              </text>
            </g>
          </g>
        )}

        {/* 8. Interactive Vertices */}

        {/* Base Vertex A */}
        <g
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => handleVertexPointerDown(e, 'A')}
          onPointerEnter={() => setHoveredPoint('A')}
          onPointerLeave={() => setHoveredPoint(null)}
        >
          {/* Big invisible hit target */}
          <circle cx={sA.x} cy={sA.y} r="24" fill="transparent" />
          <circle
            cx={sA.x}
            cy={sA.y}
            r={hoveredPoint === 'A' || activeDragging === 'A' ? '9' : '7'}
            fill="#334155"
            stroke="#ffffff"
            strokeWidth="2.5"
            className="transition-all"
          />
          <text
            x={sA.x - 14}
            y={sA.y + 18}
            fill={labelColor}
            fontSize="12"
            fontFamily="monospace"
            fontWeight="bold"
            className="pointer-events-none select-none"
          >
            A ({roundCoord(triangle.A.x, 1)}, {roundCoord(triangle.A.y, 1)})
          </text>
        </g>

        {/* Base Vertex B */}
        <g
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => handleVertexPointerDown(e, 'B')}
          onPointerEnter={() => setHoveredPoint('B')}
          onPointerLeave={() => setHoveredPoint(null)}
        >
          {/* Big invisible hit target */}
          <circle cx={sB.x} cy={sB.y} r="24" fill="transparent" />
          <circle
            cx={sB.x}
            cy={sB.y}
            r={hoveredPoint === 'B' || activeDragging === 'B' ? '9' : '7'}
            fill="#334155"
            stroke="#ffffff"
            strokeWidth="2.5"
            className="transition-all"
          />
          <text
            x={sB.x + 10}
            y={sB.y + 18}
            fill={labelColor}
            fontSize="12"
            fontFamily="monospace"
            fontWeight="bold"
            className="pointer-events-none select-none"
          >
            B ({roundCoord(triangle.B.x, 1)}, {roundCoord(triangle.B.y, 1)})
          </text>
        </g>

        {/* FREE VERTEX C (High-prominence, large draggable hit target) */}
        <g
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => handleVertexPointerDown(e, 'C')}
          onPointerEnter={() => setHoveredPoint('C')}
          onPointerLeave={() => setHoveredPoint(null)}
        >
          {/* Massive 32px touch/click target area */}
          <circle cx={sC.x} cy={sC.y} r="32" fill="transparent" />

          {/* Animated beacon ring */}
          <circle
            cx={sC.x}
            cy={sC.y}
            r="16"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4,3"
            className="pointer-events-none"
          />

          {/* Vertex core handle */}
          <circle
            cx={sC.x}
            cy={sC.y}
            r={hoveredPoint === 'C' || activeDragging === 'C' ? '11' : '9'}
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth="3"
            className="transition-all shadow-lg"
          />
          <circle cx={sC.x} cy={sC.y} r="3" fill="#ffffff" className="pointer-events-none" />

          {/* Prominent floating badge above Point C (hidden while dragging a vertex) */}
          {!isDraggingVertex && (
          <g transform={`translate(${sC.x}, ${sC.y - 26})`} className="pointer-events-none">
            <rect
              x="-60"
              y="-12"
              width="120"
              height="24"
              rx="12"
              fill={isPaper ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)'}
              stroke="#f59e0b"
              strokeWidth="2"
              className="shadow-lg"
            />
            <text
              x="0"
              y="4"
              fill="#d97706"
              fontSize="11"
              fontFamily="sans-serif"
              fontWeight="bold"
              textAnchor="middle"
              className="select-none"
            >
              ★ DRAG POINT C ★
            </text>
          </g>
          )}

          <text
            x={sC.x}
            y={sC.y + 26}
            fill={labelColor}
            fontSize="11"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
            className="pointer-events-none select-none"
          >
            C ({roundCoord(triangle.C.x, 1)}, {roundCoord(triangle.C.y, 1)})
          </text>
        </g>

        {/* 9. Interactive Draw Mode Pending Points */}
        {isDrawMode && (
          <g className="draw-clicks-layer pointer-events-none">
            {drawClicks.map((pt, idx) => {
              const sp = toScreen(pt);
              const label = idx === 0 ? 'A' : idx === 1 ? 'B' : 'C';
              return (
                <g key={`dc-${idx}`}>
                  <circle cx={sp.x} cy={sp.y} r="9" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                  <text
                    x={sp.x + 12}
                    y={sp.y + 4}
                    fill={isPaper ? '#0f172a' : '#ffffff'}
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Point {label} placed ({roundCoord(pt.x, 1)}, {roundCoord(pt.y, 1)})
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Floating Canvas Controls HUD (Bottom Right) */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 shadow-xl text-slate-200 z-10">
        <button
          onClick={() => setTransform((t) => ({ ...t, zoom: Math.min(t.zoom * 1.15, 3.0) }))}
          className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTransform((t) => ({ ...t, zoom: Math.max(t.zoom * 0.87, 0.05) }))}
          className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Reset View & Center Origin"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Canvas Top Banner / Instructions */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        {isDrawMode ? (
          <div className="px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-lg border border-blue-400/50 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>Click graph sheet to place Point {drawClicks.length === 0 ? 'A' : drawClicks.length === 1 ? 'B' : 'C'} ({drawClicks.length}/3)</span>
          </div>
        ) : isDraggingVertex ? null : (
          <div className="px-3.5 py-2 bg-slate-900/90 backdrop-blur-md text-slate-200 text-xs rounded-xl border border-slate-700 shadow-xl flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Hand className="w-4 h-4" />
              <span>Interactive:</span>
            </div>
            <span className="hidden lg:inline">Click &amp; drag the orange <strong className="text-amber-400 font-bold">Point C</strong> to morph the triangle &amp; squares!</span>
            <span className="lg:hidden">Drag <strong className="text-amber-400 font-bold">Point C</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
