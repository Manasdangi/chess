import { Chess, type Color, type Move as ChessMove, type PieceSymbol, type Square } from 'chess.js';

export type PromotionPiece = 'q' | 'r' | 'b' | 'n';
export type PlayerColor = 'white' | 'black';

export interface PendingPromotionMove {
  from: Square;
  to: Square;
}

interface HandleSquareClickArgs {
  event: React.MouseEvent<HTMLDivElement, MouseEvent>;
  fen: string;
  row: number;
  col: number;
  movingPieceIndex: { row: number; col: number };
  setMovingPieceIndex: React.Dispatch<React.SetStateAction<{ row: number; col: number }>>;
  validMoves: number[][];
  piecesInAttack: number[][];
  setValidMoves: React.Dispatch<React.SetStateAction<number[][]>>;
  setPiecesInAttack: React.Dispatch<React.SetStateAction<number[][]>>;
  setTooltipX: React.Dispatch<React.SetStateAction<number>>;
  setTooltipY: React.Dispatch<React.SetStateAction<number>>;
  setShowTooltip: React.Dispatch<React.SetStateAction<boolean>>;
  isWhitePieceDown: boolean;
  onMoveReady: (move: PendingPromotionMove, promotion?: PromotionPiece) => void;
  onPromotionRequired: (move: PendingPromotionMove) => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

const PIECE_TO_CODE: Record<PieceSymbol, number> = {
  k: 1,
  q: 2,
  b: 3,
  n: 4,
  r: 5,
  p: 6,
};

const STARTING_COUNTS: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 2,
  6: 8,
  [-1]: 1,
  [-2]: 1,
  [-3]: 2,
  [-4]: 2,
  [-5]: 2,
  [-6]: 8,
};

export const INITIAL_FEN = new Chess().fen();

export function turnFromFen(fen: string): PlayerColor {
  return fen.split(' ')[1] === 'b' ? 'black' : 'white';
}

export function winnerFromCheckmateFen(fen: string): PlayerColor | null {
  const chess = new Chess(fen);
  if (!chess.isCheckmate()) return null;
  return chess.turn() === 'w' ? 'black' : 'white';
}

function pieceCode(piece: { color: Color; type: PieceSymbol }): number {
  const code = PIECE_TO_CODE[piece.type];
  return piece.color === 'w' ? code : -code;
}

export function toBoardSquare(row: number, col: number, isWhitePieceDown: boolean): Square {
  const file = isWhitePieceDown ? FILES[col] : FILES[7 - col];
  const rank = isWhitePieceDown ? 8 - row : row + 1;
  return `${file}${rank}` as Square;
}

export function squareToBoardIndex(square: Square, isWhitePieceDown: boolean) {
  const fileIndex = FILES.indexOf(square[0] as (typeof FILES)[number]);
  const rank = Number(square[1]);
  return isWhitePieceDown
    ? { row: 8 - rank, col: fileIndex }
    : { row: rank - 1, col: 7 - fileIndex };
}

export function gridFromFen(fen: string, isWhitePieceDown: boolean): number[][] {
  const chess = new Chess(fen);
  const grid = Array.from({ length: 8 }, () => Array<number>(8).fill(0));

  for (const square of FILES.flatMap(file =>
    [1, 2, 3, 4, 5, 6, 7, 8].map(rank => `${file}${rank}` as Square)
  )) {
    const piece = chess.get(square);
    if (!piece) continue;
    const { row, col } = squareToBoardIndex(square, isWhitePieceDown);
    grid[row][col] = pieceCode(piece);
  }

  return grid;
}

export function legalTargetsFromFen(
  fen: string,
  row: number,
  col: number,
  isWhitePieceDown: boolean
) {
  const chess = new Chess(fen);
  const square = toBoardSquare(row, col, isWhitePieceDown);
  const moves = chess.moves({ square, verbose: true });
  const seenMoves = new Set<string>();
  const seenCaptures = new Set<string>();
  const validMoves: number[][] = [];
  const piecesInAttack: number[][] = [];

  for (const move of moves) {
    const index = squareToBoardIndex(move.to, isWhitePieceDown);
    const key = `${index.row}:${index.col}`;
    if (move.isCapture() || move.isEnPassant()) {
      if (!seenCaptures.has(key)) {
        piecesInAttack.push([index.row, index.col]);
        seenCaptures.add(key);
      }
    } else if (!seenMoves.has(key)) {
      validMoves.push([index.row, index.col]);
      seenMoves.add(key);
    }
  }

  return { validMoves, piecesInAttack };
}

export function isPromotionMove(fen: string, from: Square, to: Square): boolean {
  const chess = new Chess(fen);
  return chess
    .moves({ square: from, verbose: true })
    .some(move => move.from === from && move.to === to && move.isPromotion());
}

export function pieceCodeToPromotionPiece(piece: number): PromotionPiece {
  const absolutePiece = Math.abs(piece);
  if (absolutePiece === 5) return 'r';
  if (absolutePiece === 3) return 'b';
  if (absolutePiece === 4) return 'n';
  return 'q';
}

export function capturedPiecesFromFen(fen: string, capturedBy: PlayerColor): number[] {
  const chess = new Chess(fen);
  const currentCounts: Record<number, number> = {};

  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue;
      const code = pieceCode(piece);
      currentCounts[code] = (currentCounts[code] ?? 0) + 1;
    }
  }

  const capturedPieceCodes =
    capturedBy === 'white' ? [-1, -2, -3, -4, -5, -6] : [1, 2, 3, 4, 5, 6];

  return capturedPieceCodes.flatMap(code =>
    Array(Math.max(0, STARTING_COUNTS[code] - (currentCounts[code] ?? 0))).fill(code)
  );
}

export function applyMoveToFen(
  fen: string,
  move: PendingPromotionMove,
  promotion?: PromotionPiece
): ChessMove | null {
  const chess = new Chess(fen);
  return chess.move({ from: move.from, to: move.to, promotion });
}

function resetSelection(
  setValidMoves: React.Dispatch<React.SetStateAction<number[][]>>,
  setPiecesInAttack: React.Dispatch<React.SetStateAction<number[][]>>,
  setMovingPieceIndex: React.Dispatch<React.SetStateAction<{ row: number; col: number }>>
) {
  setValidMoves([]);
  setPiecesInAttack([]);
  setMovingPieceIndex({ row: -1, col: -1 });
}

export function handleSquareClick({
  event,
  fen,
  row,
  col,
  movingPieceIndex,
  setMovingPieceIndex,
  validMoves,
  piecesInAttack,
  setValidMoves,
  setPiecesInAttack,
  setTooltipX,
  setTooltipY,
  setShowTooltip,
  isWhitePieceDown,
  onMoveReady,
  onPromotionRequired,
}: HandleSquareClickArgs) {
  const clickedTarget =
    validMoves.some(([r, c]) => r === row && c === col) ||
    piecesInAttack.some(([r, c]) => r === row && c === col);

  if (clickedTarget && movingPieceIndex.row !== -1) {
    const move = {
      from: toBoardSquare(movingPieceIndex.row, movingPieceIndex.col, isWhitePieceDown),
      to: toBoardSquare(row, col, isWhitePieceDown),
    };

    resetSelection(setValidMoves, setPiecesInAttack, setMovingPieceIndex);

    if (isPromotionMove(fen, move.from, move.to)) {
      setTooltipX(event.clientX);
      setTooltipY(event.clientY);
      setShowTooltip(true);
      onPromotionRequired(move);
      return;
    }

    onMoveReady(move);
    return;
  }

  const chess = new Chess(fen);
  const square = toBoardSquare(row, col, isWhitePieceDown);
  const piece = chess.get(square);
  resetSelection(setValidMoves, setPiecesInAttack, setMovingPieceIndex);
  setShowTooltip(false);

  if (!piece || piece.color !== chess.turn()) return;

  const targets = legalTargetsFromFen(fen, row, col, isWhitePieceDown);
  setMovingPieceIndex({ row, col });
  setValidMoves(targets.validMoves);
  setPiecesInAttack(targets.piecesInAttack);
}
