export interface Move {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
  san?: string;
  lan?: string;
  fen?: string;
}

export interface ClockState {
  whiteTime: number;
  blackTime: number;
}

export interface CaptureState {
  whiteScore: number[];
  blackScore: number[];
}

export interface GameStatus {
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  winner: 'white' | 'black' | 'draw' | null;
  endReason?: string;
}

export interface ServerMovePayload extends ClockState, CaptureState {
  fen: string;
  move: Move;
  status: GameStatus;
}
