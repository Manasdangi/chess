// ChessBoard.tsx
import styles from './ChessBoard.module.scss';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RenderPieces from './Components/RenderPieces';
import ToolTip from './Components/ToolTip';
import pieceImages, { classNames, pieceMap } from '../../utils/Util';
import {
  gridFromFen,
  handleSquareClick,
  INITIAL_FEN,
  PendingPromotionMove,
  pieceCodeToPromotionPiece,
  PromotionPiece,
  turnFromFen,
} from '../../utils/ChessBoardUtils';
import Timer from './Components/Timer';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../../Socket/socket';
import { useSocket } from '../../hook/useSocket';
import { FaCopy, FaHome } from 'react-icons/fa';
import useAuthStore from '../../Context/useAuthStore';
import { saveGameHistory } from '../../services/gameHistory';
import { CaptureState, ClockState, GameStatus, ServerMovePayload } from '../../types/chess';
import { getGuestIdentity } from '../../utils/guestIdentity';

interface EventHandlers {
  onRoomJoined: (data: { isCreator: boolean }) => void;
  onOpponentJoined: (payload: { opponentEmail: string; opponentDisplayName: string }) => void;
  onOpponentChoosePieceColor: (color: 'white' | 'black') => void;
  onMoveAccepted: (payload: ServerMovePayload) => void;
  onMoveRejected: (payload: { message: string }) => void;
  onOpponentMove: (payload: ServerMovePayload) => void;
  onClockUpdate: (payload: ClockState) => void;
  onGameOver: (payload: GameStatus & ClockState & CaptureState & { fen: string }) => void;
  onOpponentScore: (score: number[], color: 'white' | 'black') => void;
  onOpponentResign: () => void;
  onOpponentTimeout: () => void;
  onOpponentKingKilled: () => void;
  onRoomFull: () => void;
  onAlreadyInRoom: () => void;
}

const ChessBoard = () => {
  const { user, addGameHistoryEntry } = useAuthStore();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [gameFen, setGameFen] = useState(INITIAL_FEN);
  const [grid, setGrid] = useState<number[][]>(() => gridFromFen(INITIAL_FEN, true));
  const [chosenPieceColor, setChosenPieceColor] = useState<'white' | 'black' | null>(null);
  const [opponentEmail, setOpponentEmail] = useState<string | null>(null);
  const [opponentDisplayName, setOpponentDisplayName] = useState('');
  const [isBlackMove, setIsBlackMove] = useState(false);
  // Tooltip position
  const [tooltipX, setTooltipX] = useState(0);
  const [tooltipY, setTooltipY] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  // Captured pieces
  const [blackScore, setBlackScore] = useState<number[]>([]);
  const [whiteScore, setWhiteScore] = useState<number[]>([]);

  // Valid moves and pieces in attack
  // These are used to highlight valid moves and pieces in attack
  const [validMoves, setValidMoves] = useState<number[][]>([[]]);
  const [piecesInAttack, setPiecesInAttack] = useState<number[][]>([[]]);
  const [movingPieceIndex, setMovingPieceIndex] = useState({
    row: -1,
    col: -1,
  });
  const [whiteTime, setWhiteTime] = useState(10 * 60);
  const [blackTime, setBlackTime] = useState(10 * 60);
  const [winner, setWinner] = useState<'white' | 'black' | 'draw' | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [historySaveStatus, setHistorySaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>(
    'idle'
  );
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const historySavedRef = useRef(false);
  /** Set before setWinner so persist can attach Firestore metadata (e.g. king_capture). */
  const gameEndMetaRef = useRef<string | undefined>(undefined);
  const pendingPromotionMoveRef = useRef<PendingPromotionMove | null>(null);
  const guestIdentity = useMemo(() => getGuestIdentity(), []);
  const playerProfile = useMemo(
    () => ({
      email: user?.email ?? guestIdentity.email,
      displayName: user?.displayName?.trim() || guestIdentity.displayName,
    }),
    [guestIdentity.displayName, guestIdentity.email, user?.displayName, user?.email]
  );

  useEffect(() => {
    historySavedRef.current = false;
    gameEndMetaRef.current = undefined;
    pendingPromotionMoveRef.current = null;
    setGameFen(INITIAL_FEN);
    setBlackScore([]);
    setWhiteScore([]);
    setWhiteTime(10 * 60);
    setBlackTime(10 * 60);
    setWinner(null);
  }, [roomId]);

  const applyClockState = useCallback((payload: ClockState) => {
    setWhiteTime(payload.whiteTime);
    setBlackTime(payload.blackTime);
  }, []);

  const applyCaptureState = useCallback((payload: CaptureState) => {
    setWhiteScore(payload.whiteScore);
    setBlackScore(payload.blackScore);
  }, []);

  const applyGameStatus = useCallback((status: GameStatus) => {
    if (!status.isGameOver) return;
    gameEndMetaRef.current = status.endReason;
    setWinner(status.winner);
  }, []);

  const applyServerMovePayload = useCallback(
    (payload: ServerMovePayload) => {
      setGameFen(payload.fen);
      applyClockState(payload);
      applyCaptureState(payload);
      applyGameStatus(payload.status);
    },
    [applyCaptureState, applyClockState, applyGameStatus]
  );

  const applyGameOverPayload = useCallback(
    (payload: GameStatus & ClockState & CaptureState & { fen: string }) => {
      setGameFen(payload.fen);
      applyClockState(payload);
      applyCaptureState(payload);
      applyGameStatus(payload);
    },
    [applyCaptureState, applyClockState, applyGameStatus]
  );

  const eventHandlers: EventHandlers = useMemo(
    () => ({
      onRoomJoined: data => setIsCreator(data.isCreator),
      onOpponentJoined: payload => {
        setOpponentEmail(payload.opponentEmail);
        setOpponentDisplayName(payload.opponentDisplayName?.trim() || '');
        setOpponentJoined(true);
      },
      onOpponentChoosePieceColor: color => {
        setChosenPieceColor(color === 'white' ? 'black' : 'white');
        setGameFen(INITIAL_FEN);
        setBlackScore([]);
        setWhiteScore([]);
      },
      onMoveAccepted: applyServerMovePayload,
      onMoveRejected: payload => {
        alert(payload.message || 'Illegal move rejected by server.');
      },
      onOpponentMove: applyServerMovePayload,
      onClockUpdate: applyClockState,
      onGameOver: applyGameOverPayload,
      onOpponentScore: (score, color) => {
        if (color === 'white') setWhiteScore(score);
        else setBlackScore(score);
      },
      onOpponentResign: () => {
        alert('Opponent resigned, You win!');
        gameEndMetaRef.current = 'opponent_resigned';
        setWinner(chosenPieceColor === 'white' ? 'white' : 'black');
      },
      onOpponentTimeout: () => {
        alert('Opponent timed out, You win!');
        gameEndMetaRef.current = 'opponent_timeout';
        setWinner(chosenPieceColor === 'white' ? 'white' : 'black');
      },
      onRoomFull: () => {
        alert('Room is full, please try another room');
        navigate('/');
      },
      onAlreadyInRoom: () => {
        alert(
          'You are already present in this room, Please cancel this tab and navigate to previous tab'
        );
      },
      onOpponentKingKilled: () => {
        gameEndMetaRef.current = 'king_capture_legacy';
        setWinner(chosenPieceColor === 'white' ? 'black' : 'white');
      },
    }),
    [applyClockState, applyGameOverPayload, applyServerMovePayload, chosenPieceColor, navigate]
  );

  const persistFinishedGame = useCallback(
    async (result: 'win' | 'loss' | 'draw', endReason?: string) => {
      if (historySavedRef.current || !user?.uid || !chosenPieceColor) return false;
      historySavedRef.current = true;
      const playedAt = new Date().toISOString();
      const opponentEmailResolved =
        opponentEmail?.trim() ||
        (roomId ? `unknown+${roomId}@game.local` : 'unknown@game.local');
      const entry = {
        playedAt,
        opponentEmail: opponentEmailResolved,
        opponentDisplayName: opponentDisplayName || '',
        result,
        myColor: chosenPieceColor,
        roomId: roomId ?? undefined,
        endReason,
      };
      try {
        const id = await saveGameHistory(user.uid, entry);
        addGameHistoryEntry({ ...entry, id });
        console.info('[GameHistory] Saved successfully', {
          id,
          uid: user.uid,
          roomId: entry.roomId ?? null,
          result: entry.result,
          endReason: entry.endReason ?? null,
        });
        return true;
      } catch (e) {
        console.error('[GameHistory] Save failed', {
          uid: user.uid,
          roomId: entry.roomId ?? null,
          result: entry.result,
          endReason: entry.endReason ?? null,
          error: e,
        });
        addGameHistoryEntry({ ...entry });
        return false;
      }
    },
    [user?.uid, opponentEmail, opponentDisplayName, chosenPieceColor, roomId, addGameHistoryEntry]
  );

  useSocket(roomId, playerProfile, eventHandlers);

  useEffect(() => {
    if (!winner || !chosenPieceColor || !user?.uid) return;
    const result = winner === 'draw' ? 'draw' : winner === chosenPieceColor ? 'win' : 'loss';
    const endMeta = gameEndMetaRef.current;
    gameEndMetaRef.current = undefined;
    setHistorySaveStatus('saving');
    console.log('[GameHistory] Game over reached, attempting save...');
    void persistFinishedGame(result, endMeta).then(saved => {
      setHistorySaveStatus(saved ? 'saved' : 'failed');
    });
  }, [winner, chosenPieceColor, user?.uid, persistFinishedGame]);

  useEffect(() => {
    setIsBlackMove(turnFromFen(gameFen) === 'black');
    if (!chosenPieceColor) return;
    const isWhitePieceDown = chosenPieceColor === 'white';
    setGrid(gridFromFen(gameFen, isWhitePieceDown));
  }, [chosenPieceColor, gameFen]);

  const sendMove = useCallback(
    (move: PendingPromotionMove, promotion?: PromotionPiece) => {
      if (!roomId) return;
      socket.emit('move', {
        roomId,
        move: {
          ...move,
          promotion,
        },
      });
    },
    [roomId]
  );

  const selectPiece = (piece: number) => {
    const pendingMove = pendingPromotionMoveRef.current;
    if (pendingMove) {
      sendMove(pendingMove, pieceCodeToPromotionPiece(piece));
      pendingPromotionMoveRef.current = null;
    }
    setShowTooltip(false);
  };

  const onSquareClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    rowIndex: number,
    colIndex: number
  ) => {
    if (
      (chosenPieceColor === 'white' && isBlackMove) ||
      (chosenPieceColor === 'black' && !isBlackMove)
    ) {
      alert('It is not your turn');
      return;
    }

    handleSquareClick(
      {
        event: e,
        fen: gameFen,
        row: rowIndex,
        col: colIndex,
        movingPieceIndex,
        setMovingPieceIndex,
        validMoves,
        setValidMoves,
        piecesInAttack,
        setPiecesInAttack,
        setTooltipX,
        setTooltipY,
        setShowTooltip,
        isWhitePieceDown: chosenPieceColor === 'white',
        onMoveReady: sendMove,
        onPromotionRequired: move => {
          pendingPromotionMoveRef.current = move;
        },
      }
    );
  };

  const renderCapturedPieces = (score: number[], bg: string) => (
    <div className={styles.scoreContainer}>
      <p>{bg === 'white' ? 'White' : 'Black'} Points:</p>
      <div className={styles.capturedPieces} style={{ backgroundColor: bg }}>
        {score.map((pieceIndex, index) => (
          <img
            key={`${pieceIndex}-${index}`}
            src={pieceImages[pieceMap[pieceIndex]]}
            height={10}
            width={10}
            className={styles.capturedPiece}
          />
        ))}
      </div>
    </div>
  );

  const renderChessBoard = () => (
    <div className={styles.body}>
      {grid.map((row, rowIndex) => (
        <div className={styles.row} key={rowIndex}>
          {row.map((_, colIndex) => {
            const isValidMove = validMoves.some(([r, c]) => r === rowIndex && c === colIndex);
            const isDanger = piecesInAttack.some(([r, c]) => r === rowIndex && c === colIndex);

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={classNames(
                  styles.box,
                  (rowIndex + colIndex) % 2 ? styles.whiteBox : styles.blackBox,
                  isValidMove && styles.highlight,
                  isDanger && styles.danger,
                  isBlackMove && grid[rowIndex][colIndex] > 0 && styles.opacity,
                  !isBlackMove && grid[rowIndex][colIndex] < 0 && styles.opacity,
                  rowIndex == movingPieceIndex.row &&
                    colIndex == movingPieceIndex.col &&
                    styles.lastMoved
                )}
                onClick={e => onSquareClick(e, rowIndex, colIndex)}
              >
                <RenderPieces val={grid[rowIndex][colIndex]} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  const handleHomeClick = async () => {
    if (!window.confirm('Are you sure you want to quit the game?')) return;
    socket.emit('resign', roomId, playerProfile.email);
    if (chosenPieceColor && user?.uid) {
      historySavedRef.current = false;
      await persistFinishedGame('loss', 'resigned');
    }
    navigate('/');
  };

  const handleStartNewGame = () => {
    navigate('/');
  };

  const handleCopyInvite = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    window.setTimeout(() => setCopyStatus('idle'), 1800);
  };

  if (winner) {
    return (
      <div className={styles.container}>
        <p className={styles.header}>Game Over</p>
        <p className={styles.winner}>
          {winner === 'draw' ? 'DRAW' : `${winner.toUpperCase()} wins`}
        </p>
        <p className={styles.saveStatus}>
          {historySaveStatus === 'saving' && 'Saving game history...'}
          {historySaveStatus === 'saved' && 'Game history saved.'}
          {historySaveStatus === 'failed' && 'Could not save to cloud, kept locally.'}
        </p>
        <button className={styles.newGameButton} onClick={handleStartNewGame}>
          Start a New Game
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <div className={styles.roomHeaderCard}>
          <p className={styles.header}>Start Playing</p>
          <p className={styles.roomMeta}>
            Room ID: <span>{roomId}</span>
          </p>
          <button className={styles.copyInviteButton} type="button" onClick={handleCopyInvite}>
            <FaCopy size={14} />
            {copyStatus === 'copied'
              ? 'Copied'
              : copyStatus === 'failed'
                ? 'Copy failed'
                : 'Copy invite link'}
          </button>
        </div>
        <button className={styles.homeButton} onClick={handleHomeClick}>
          <FaHome size={24} />
        </button>
      </div>
      {!chosenPieceColor ? (
        <div className={styles.setupCard}>
          {isCreator ? (
            opponentJoined ? (
              <>
                <p className={styles.choosePieceColorText}>Choose your piece color</p>
                <div className={styles.button}>
                  <button
                    onClick={() => {
                      setChosenPieceColor('black');
                      setGameFen(INITIAL_FEN);
                      setBlackScore([]);
                      setWhiteScore([]);
                      socket.emit('choosePieceColor', roomId, 'black');
                    }}
                  >
                    Black
                  </button>
                  <button
                    onClick={() => {
                      setChosenPieceColor('white');
                      setGameFen(INITIAL_FEN);
                      setBlackScore([]);
                      setWhiteScore([]);
                      socket.emit('choosePieceColor', roomId, 'white');
                    }}
                  >
                    White
                  </button>
                </div>
              </>
            ) : (
              <p className={styles.waitingText}>Waiting for another player to join...</p>
            )
          ) : (
            <p className={styles.waitingText}>Waiting for room creator to choose color...</p>
          )}
        </div>
      ) : (
        <>
          <div className={styles.scoresContainer}>
            {blackScore.length > 0 && renderCapturedPieces(blackScore, 'grey')}
            {whiteScore.length > 0 && renderCapturedPieces(whiteScore, 'white')}
          </div>
          <Timer {...{ chosenPieceColor, blackTime, whiteTime, position: 'top' }} />
          {renderChessBoard()}
          <Timer {...{ chosenPieceColor, blackTime, whiteTime, position: 'bottom' }} />
          {showTooltip && (
            <ToolTip
              x={tooltipX}
              y={tooltipY}
              showBlack={chosenPieceColor === 'black'}
              selectPiece={selectPiece}
            />
          )}
        </>
      )}
    </div>
  );
};
export default ChessBoard;
