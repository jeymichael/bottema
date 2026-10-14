import { Point, TriangleVertices, SquareData, GeometryCalculation, GeometryOptions } from '../types/geometry';

export const distance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.hypot(dx, dy);
};

export const midpoint = (p1: Point, p2: Point): Point => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};

export const roundCoord = (val: number, decimals = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
};

export const snapPoint = (p: Point, step = 0.5): Point => {
  return {
    x: Math.round(p.x / step) * step,
    y: Math.round(p.y / step) * step,
  };
};

export const worldToScreen = (
  p: Point,
  width: number,
  height: number,
  panX: number,
  panY: number,
  zoom: number,
  unitPx = 40
): { x: number; y: number } => {
  return {
    x: width / 2 + panX + p.x * unitPx * zoom,
    y: height / 2 + panY - p.y * unitPx * zoom,
  };
};

export const screenToWorld = (
  sx: number,
  sy: number,
  width: number,
  height: number,
  panX: number,
  panY: number,
  zoom: number,
  unitPx = 40
): Point => {
  return {
    x: (sx - width / 2 - panX) / (unitPx * zoom),
    y: -(sy - height / 2 - panY) / (unitPx * zoom),
  };
};

/**
 * Computes a square built on edge (P_free, P_base).
 * Vertices returned in cyclical order: [P_free, P_base, P_diag, P_adj]
 * where P_diag is diagonally opposite to P_free.
 * 
 * @param pFree The free vertex of the triangle (C)
 * @param pBase The other vertex of the triangle edge (A or B)
 * @param direction '+1' for CCW rotation perpendicular, '-1' for CW rotation perpendicular
 */
export const computeSquareOnEdge = (
  pFree: Point,
  pBase: Point,
  direction: 1 | -1,
  color: 'red' | 'green',
  sideName: string
): SquareData => {
  // Edge vector from pFree to pBase
  const ux = pBase.x - pFree.x;
  const uy = pBase.y - pFree.y;

  // Perpendicular vector from pBase of length |u|
  // If direction is -1 (CW): (uy, -ux)
  // If direction is +1 (CCW): (-uy, ux)
  const perpX = direction === 1 ? -uy : uy;
  const perpY = direction === 1 ? ux : -ux;

  // The vertex opposite to pFree is at pBase + perp
  const pDiag: Point = {
    x: pBase.x + perpX,
    y: pBase.y + perpY,
  };

  // The 4th vertex adjacent to pFree is at pFree + perp
  const pAdj: Point = {
    x: pFree.x + perpX,
    y: pFree.y + perpY,
  };

  const sideLength = Math.hypot(ux, uy);
  const area = sideLength * sideLength;

  return {
    sideName,
    color,
    vertices: [pFree, pBase, pDiag, pAdj],
    freeVertex: pFree,
    diagonalOpposite: pDiag,
    sideLength,
    area,
  };
};

/**
 * Computes Bottema's theorem configuration given triangle vertices.
 */
export const calculateGeometry = (
  triangle: TriangleVertices,
  options: Pick<GeometryOptions, 'squareOrientation' | 'activeFreePoint'>
): GeometryCalculation => {
  const freePointKey = options.activeFreePoint || 'C';
  
  // Designate the free point and the two base points
  let freePt: Point;
  let baseA: Point;
  let baseB: Point;
  let nameA: string;
  let nameB: string;

  if (freePointKey === 'A') {
    freePt = triangle.A;
    baseA = triangle.B;
    baseB = triangle.C;
    nameA = 'AB';
    nameB = 'AC';
  } else if (freePointKey === 'B') {
    freePt = triangle.B;
    baseA = triangle.A;
    baseB = triangle.C;
    nameA = 'BA';
    nameB = 'BC';
  } else {
    // Default: C is the moving point
    freePt = triangle.C;
    baseA = triangle.A;
    baseB = triangle.B;
    nameA = 'CA';
    nameB = 'CB';
  }

  // Determine direction based on orientation mode
  let dirA: 1 | -1 = -1; // Side 1 (CA) uses CW
  let dirB: 1 | -1 = 1;  // Side 2 (CB) uses CCW

  if (options.squareOrientation === 'inward') {
    dirA = 1;
    dirB = -1;
  } else if (options.squareOrientation === 'exteriorDynamic') {
    // Check orientation of triangle (baseA -> baseB -> freePt)
    const cross = (baseB.x - baseA.x) * (freePt.y - baseA.y) - (baseB.y - baseA.y) * (freePt.x - baseA.x);
    if (cross < 0) {
      dirA = 1;
      dirB = -1;
    }
  }

  const redSquare = computeSquareOnEdge(freePt, baseA, dirA, 'red', `Side ${nameA}`);
  const greenSquare = computeSquareOnEdge(freePt, baseB, dirB, 'green', `Side ${nameB}`);

  const pA = redSquare.diagonalOpposite;
  const pB = greenSquare.diagonalOpposite;

  const actualMidpoint = midpoint(pA, pB);
  const connLength = distance(pA, pB);

  // Invariant theoretical midpoint for Bottema's theorem:
  // For standard: M = ((1 + i)*baseA + (1 - i)*baseB) / 2
  // M.x = (baseA.x + baseB.x + dirA * (baseB.y - baseA.y)) / 2 ...
  // Let's calculate directly from baseA and baseB using the directions
  const theoreticalX = (baseA.x + baseB.x + (dirA === -1 ? (baseA.y - baseB.y) : (baseB.y - baseA.y))) / 2;
  const theoreticalY = (baseA.y + baseB.y + (dirA === -1 ? (baseB.x - baseA.x) : (baseA.x - baseB.x))) / 2;
  const theoreticalMidpoint: Point = { x: theoreticalX, y: theoreticalY };

  // Midpoint is fixed if distance to theoretical is negligible
  const isMidpointFixed = distance(actualMidpoint, theoreticalMidpoint) < 0.001;

  // Base Midpoint (Center of hypotenuse/base AB)
  const baseMidpoint = midpoint(baseA, baseB);

  // Mirrored Blue Point below line AB: M' = 2*O - M = baseA + baseB - M
  const mirroredMidpoint: Point = {
    x: baseA.x + baseB.x - actualMidpoint.x,
    y: baseA.y + baseB.y - actualMidpoint.y,
  };

  // Circumcircle radius = |AB| / 2 = distance(baseMidpoint, actualMidpoint)
  const circumcircleRadius = distance(baseMidpoint, actualMidpoint);

  // Dotted square connecting: M -> baseB -> M' -> baseA
  const invariantSquareVertices: [Point, Point, Point, Point] = [
    actualMidpoint,
    baseB,
    mirroredMidpoint,
    baseA,
  ];

  return {
    triangle,
    redSquare,
    greenSquare,
    connectingLine: {
      start: pA,
      end: pB,
      length: connLength,
      midpoint: actualMidpoint,
    },
    theoreticalMidpoint,
    isMidpointFixed,
    baseMidpoint,
    mirroredMidpoint,
    circumcircleRadius,
    invariantSquareVertices,
  };
};

/**
 * Presets for interesting geometric initial states
 */
export const GEOMETRY_PRESETS = [
  {
    id: 'classic-bottema',
    name: 'Classic Right Triangle',
    description: 'A 3-4-5 right triangle showing the elegant right-angle configuration',
    triangle: {
      A: { x: -3, y: 0 },
      B: { x: 3, y: 0 },
      C: { x: -3, y: 4 },
    },
  },
  {
    id: 'equilateral',
    name: 'Equilateral Apex',
    description: 'Symmetric apex configuration forming balanced dual squares',
    triangle: {
      A: { x: -3.5, y: -1 },
      B: { x: 3.5, y: -1 },
      C: { x: 0, y: 5.06 },
    },
  },
  {
    id: 'acute-scalene',
    name: 'Dynamic Scalene',
    description: 'Unequal sides with varied square sizes and tilted connecting line',
    triangle: {
      A: { x: -4, y: -1 },
      B: { x: 3, y: -2 },
      C: { x: 1.5, y: 4.5 },
    },
  },
  {
    id: 'obtuse',
    name: 'Sprawling Obtuse',
    description: 'Wide obtuse angle showcasing expansive overlapping squares',
    triangle: {
      A: { x: -5, y: 0 },
      B: { x: 4, y: 0 },
      C: { x: -1, y: 1.5 },
    },
  },
  {
    id: 'collinear',
    name: 'Degenerate Collinear Line',
    description: 'Point C placed directly on base AB — proving the theorem holds on a straight line!',
    triangle: {
      A: { x: -4, y: 0 },
      B: { x: 4, y: 0 },
      C: { x: 1, y: 0 },
    },
  },
];
