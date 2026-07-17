import { Chess } from 'chess.js';
import stockfishWorkerUrl from '../../node_modules/stockfish/bin/stockfish-18-lite-single.js?url';
import stockfishWasmUrl from '../../node_modules/stockfish/bin/stockfish-18-lite-single.wasm?url';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_DEPTHS: Record<BotDifficulty, number> = {
  easy: 4,
  medium: 8,
  hard: 12,
};

const MOVE_TIMEOUT_MS = 5000;
const READY_TIMEOUT_MS = 5000;

function createFallbackMove(fen: string): string | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;

  const capture = moves.find(move => move.captured);
  const check = moves.find(move => move.san.includes('+') || move.san.includes('#'));
  const selectedMove = capture ?? check ?? moves[Math.floor(Math.random() * moves.length)];
  return `${selectedMove.from}${selectedMove.to}${selectedMove.promotion ?? ''}`;
}

class StockfishBotEngine {
  private worker: Worker | null = null;
  private readyPromise: Promise<void> | null = null;
  private movePromise: Promise<string | null> | null = null;
  private moveResolve: ((move: string | null) => void) | null = null;
  private disposed = false;

  private async initialize(): Promise<void> {
    if (this.worker || this.disposed) return;

    const worker = new Worker(
      `${stockfishWorkerUrl}#${encodeURIComponent(stockfishWasmUrl)},worker`
    );
    this.worker = worker;
    this.readyPromise = new Promise((resolve, reject) => {
      let isReady = false;
      const readyTimeoutId = window.setTimeout(() => {
        if (isReady) return;
        worker.terminate();
        this.worker = null;
        this.readyPromise = null;
        reject(new Error('Stockfish worker did not become ready.'));
      }, READY_TIMEOUT_MS);

      const handleMessage = (event: MessageEvent<string>) => {
        const message = typeof event.data === 'string' ? event.data.trim() : '';
        if (!message) return;

        if (message === 'readyok') {
          isReady = true;
          window.clearTimeout(readyTimeoutId);
          resolve();
          return;
        }

        if (message.startsWith('bestmove')) {
          const bestMove = message.split(' ')[1] ?? null;
          this.moveResolve?.(bestMove === '(none)' ? null : bestMove);
          this.moveResolve = null;
          this.movePromise = null;
        }
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', event => {
        window.clearTimeout(readyTimeoutId);
        worker.removeEventListener('message', handleMessage);
        this.worker = null;
        this.readyPromise = null;
        reject(new Error(event.message || 'Stockfish worker failed to start.'));
      });

      worker.postMessage('uci');
      worker.postMessage('isready');
    });
  }

  async getBestMove(fen: string, difficulty: BotDifficulty): Promise<string | null> {
    if (this.disposed) return null;
    await this.initialize();
    await this.readyPromise;

    if (!this.worker) return null;

    this.worker.postMessage('stop');
    this.movePromise = new Promise<string | null>(resolve => {
      let timeoutId = 0;
      const finish = (move: string | null) => {
        window.clearTimeout(timeoutId);
        this.moveResolve = null;
        this.movePromise = null;
        resolve(move);
      };
      timeoutId = window.setTimeout(() => {
        this.worker?.postMessage('stop');
        finish(null);
      }, MOVE_TIMEOUT_MS);

      this.moveResolve = finish;
    });

    this.worker.postMessage('ucinewgame');
    this.worker.postMessage(`position fen ${fen}`);
    this.worker.postMessage(`go depth ${DIFFICULTY_DEPTHS[difficulty]}`);
    return this.movePromise;
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.readyPromise = null;
    this.movePromise = null;
    this.moveResolve = null;
  }
}

const engine = new StockfishBotEngine();

export function createBotMoveFromFen(
  fen: string,
  difficulty: BotDifficulty
): Promise<string | null> {
  return engine.getBestMove(fen, difficulty).then(
    move => move ?? createFallbackMove(fen),
    error => {
      console.warn('[StockfishBot] Falling back to legal move.', error);
      return createFallbackMove(fen);
    }
  );
}

export function getBotMoveFromPosition(
  fen: string,
  difficulty: BotDifficulty
): Promise<string | null> {
  return createBotMoveFromFen(fen, difficulty);
}

export function parseBotMove(
  moveUci: string | null,
  fen: string
): { from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' } | null {
  if (!moveUci) return null;

  const chess = new Chess(fen);
  const from = moveUci.slice(0, 2);
  const to = moveUci.slice(2, 4);
  const promotion = moveUci.length > 4 ? (moveUci[4] as 'q' | 'r' | 'b' | 'n') : undefined;
  const move = chess.move({ from, to, promotion });

  if (!move) return null;

  return {
    from,
    to,
    promotion,
  };
}

export const BOT_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const BOT_DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export { stockfishWasmUrl };
