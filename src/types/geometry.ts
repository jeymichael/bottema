export interface Point {
  x: number;
  y: number;
}

export interface TriangleVertices {
  A: Point;
  B: Point;
  C: Point; // Free moving point
}

export interface SquareData {
  sideName: string;
  color: 'red' | 'green';
  // Vertices in order: base1, base2, opposite_base1 (diagonally across from free point), opposite_base2
  vertices: [Point, Point, Point, Point];
  freeVertex: Point;
  diagonalOpposite: Point; // The vertex diagonally across from the free vertex
  sideLength: number;
  area: number;
}

export interface GeometryCalculation {
  triangle: TriangleVertices;
  redSquare: SquareData;   // On side CA
  greenSquare: SquareData; // On side CB
  connectingLine: {
    start: Point; // P_A (diagonally across from C in red square)
    end: Point;   // P_B (diagonally across from C in green square)
    length: number;
    midpoint: Point; // Distinct BLUE dot (M)
  };
  theoreticalMidpoint: Point; // Invariant Bottema midpoint (M)
  isMidpointFixed: boolean;
  
  // Invariant square & circumcircle (Ask 1 & 2)
  baseMidpoint: Point;       // Center O = (A + B) / 2
  mirroredMidpoint: Point;   // M' below base line AB
  circumcircleRadius: number;// Radius of circle around square = |AB| / 2
  invariantSquareVertices: [Point, Point, Point, Point]; // [M, B, M', A]
}

export type GridTheme = 'blueprint' | 'paper' | 'slate';

export interface ViewportTransform {
  zoom: number;
  panX: number;
  panY: number;
}

export interface GeometryOptions {
  snapToGrid: boolean;
  gridStep: number;
  fillAlpha: number; // default 0.25
  showDiagonals: boolean;
  showCoordinates: boolean;
  showRightAngles: boolean;
  showLocusTrace: boolean;
  showGrid: boolean;
  gridTheme: GridTheme;
  squareOrientation: 'standard' | 'inward' | 'exteriorDynamic';
  activeFreePoint: 'C' | 'A' | 'B';
  showInvariantSquareAndCircle: boolean; // Dotted square & circle around it
}
