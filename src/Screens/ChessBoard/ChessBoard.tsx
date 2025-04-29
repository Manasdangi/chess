// ChessBoard.tsx
import styles from './ChessBoard.module.scss';
import { useEffect, useRef, useState } from 'react';
import RenderPieces from './Components/RenderPieces';
import ToolTip from './Components/ToolTip';
import pieceImages, { classNames, pieceMap } from '../../utils/Util';
import { handleSquareClick } from '../../utils/ChessBoardUtils';
import { blackTopWhiteDown, whiteTopBlackDown } from '../../constants';
import Timer from './Components/Timer';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../../Socket/socket';
import { useSocket } from '../../hook/useSocket';
import { FaHome } from 'react-icons/fa';
import useAuthStore from '../../Context/useAuthStore';

const ChessBoard = () => {
  const { user } = useAuthStore();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [grid, setGrid] = useState<number[][]>([[]]);
  const [chosenPieceColor, setChosenPieceColor] = useState<'white' | 'black' | null>(null);
  const [opponentEmail, setOpponentEmail] = useState<string | null>(null);
  const [isBlackMove, setIsBlackMove] = useState(false);
  const [currentIndex, setCurrentIndex] = useState({
    rowIndex: 0,
    colIndex: 0,
  });
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
  const [movingPiece, setMovingPiece] = useState({
    rowIndex: -1,
    colIndex: -1,
  });
  const [whiteTime, setWhiteTime] = useState(60);
  const [blackTime, setBlackTime] = useState(60);
  const [winner, setWinner] = useState<'white' | 'black' | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);

  useSocket(roomId, {
    onRoomJoined: data => setIsCreator(data.isCreator),
    onOpponentJoined: () => setOpponentJoined(true),
    onOpponentChoosePieceColor: color => setChosenPieceColor(color === 'white' ? 'black' : 'white'),
    onOpponentMove: move => {
      setIsBlackMove(move.piece > 0);
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => [...row]);
        newGrid[7 - move.from.row][7 - move.from.col] = 0;
        newGrid[7 - move.to.row][7 - move.to.col] = move.piece;
        return newGrid;
      });
    },
    onOpponentScore: (score, color) => {
      color === 'white' ? setWhiteScore(score) : setBlackScore(score);
    },
    onOpponentResign: email => {
      alert('Opponent resigned, You win!');
      setOpponentEmail(email);
      setWinner(chosenPieceColor === 'white' ? 'white' : 'black');
    },
    onOpponentTimeout: email => {
      alert('Opponent timed out, You win!');
      setOpponentEmail(email);
      setWinner(chosenPieceColor === 'white' ? 'white' : 'black');
    },
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!chosenPieceColor) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    console.log('console', opponentEmail, getSelfColor());
    const id = setInterval(() => {
      if (isBlackMove) {
        setBlackTime(prev => {
          if (prev < 1) {
            clearInterval(id);
            intervalRef.current = null;
            setWinner('white');
            if (chosenPieceColor === 'black') {
              socket.emit('onOpponentTimeout', roomId, user?.email);
            }
            return 0;
          }
          return prev - 1;
        });
      } else {
        setWhiteTime(prev => {
          if (prev < 1) {
            clearInterval(id);
            intervalRef.current = null;
            setWinner('black');
            if (chosenPieceColor === 'white') {
              socket.emit('onOpponentTimeout', roomId, user?.email);
            }
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    intervalRef.current = id;
    return () => clearInterval(id);
  }, [isBlackMove, chosenPieceColor]);

  useEffect(() => {
    if (chosenPieceColor) {
      setGrid(chosenPieceColor === 'white' ? blackTopWhiteDown : whiteTopBlackDown);
    }
  }, [chosenPieceColor]);

  const selectPiece = (piece: number) => {
    setValidMoves([[]]);
    setPiecesInAttack([[]]);
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => [...row]);
      newGrid[currentIndex.rowIndex][currentIndex.colIndex] = piece;
      return newGrid;
    });
    setShowTooltip(false);
  };

  const getSelfColor = () => {
    if (chosenPieceColor === 'white') {
      return isBlackMove ? 'black' : 'white';
    } else {
      return isBlackMove ? 'white' : 'black';
    }
  };

  const isKingKilled = () => {
    console.log('check', whiteScore, blackScore);
    if (isBlackMove) {
      return whiteScore.includes(1);
    }
    return blackScore.includes(1);
  };

  useEffect(() => {
    if (isKingKilled()) {
      alert('King is killed, You lose!');
      setWinner(chosenPieceColor === 'white' ? 'black' : 'white');
    }
  }, [blackScore, whiteScore]);

  const onSquareClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    rowIndex: number,
    colIndex: number
  ) => {
    setCurrentIndex({ rowIndex, colIndex });
    if (
      (chosenPieceColor === 'white' && isBlackMove) ||
      (chosenPieceColor === 'black' && !isBlackMove)
    ) {
      alert('It is not your turn');
      return;
    }

    handleSquareClick(
      e,
      grid,
      rowIndex,
      colIndex,
      setGrid,
      movingPiece,
      setMovingPiece,
      validMoves,
      setValidMoves,
      piecesInAttack,
      setPiecesInAttack,
      blackScore,
      whiteScore,
      setBlackScore,
      setWhiteScore,
      setTooltipX,
      setTooltipY,
      setShowTooltip,
      isBlackMove,
      setIsBlackMove,
      chosenPieceColor === 'white',
      roomId || ''
    );
  };

  const renderCapturedPieces = (score: number[], bg: string) => (
    <div className={styles.scoreContainer}>
      <p>{bg === 'white' ? 'White' : 'Black'} Points:</p>
      <div className={styles.capturedPieces} style={{ backgroundColor: bg }}>
        {score.map(pieceIndex => (
          <img
            key={pieceIndex}
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
                  rowIndex == movingPiece.rowIndex &&
                    colIndex == movingPiece.colIndex &&
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

  const handleHomeClick = () => {
    if (window.confirm('Are you sure you want to quit the game?')) {
      socket.emit('resign', roomId, user?.email);
      navigate('/');
    }
  };

  if (winner) {
    return (
      <div className={styles.container}>
        <p className={styles.header}>Game Over</p>
        <p className={styles.winner}>{winner.toUpperCase()} wins</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Start Playing for Room: {roomId}</p>
        <button className={styles.homeButton} onClick={handleHomeClick}>
          <FaHome size={24} />
        </button>
      </div>
      {!chosenPieceColor ? (
        <div className={styles.choosePieceColor}>
          {isCreator ? (
            opponentJoined ? (
              <>
                <p className={styles.choosePieceColorText}>Choose your piece color</p>
                <div className={styles.button}>
                  <button
                    onClick={() => {
                      setChosenPieceColor('black');
                      socket.emit('choosePieceColor', roomId, 'black');
                    }}
                  >
                    Black
                  </button>
                  <button
                    onClick={() => {
                      setChosenPieceColor('white');
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
          <Timer {...{ chosenPieceColor, isBlackMove, blackTime, whiteTime, position: 'top' }} />
          {renderChessBoard()}
          <Timer {...{ chosenPieceColor, isBlackMove, blackTime, whiteTime, position: 'bottom' }} />
          {showTooltip && (
            <ToolTip x={tooltipX} y={tooltipY} showBlack={isBlackMove} selectPiece={selectPiece} />
          )}
        </>
      )}
    </div>
  );
};
export default ChessBoard;
