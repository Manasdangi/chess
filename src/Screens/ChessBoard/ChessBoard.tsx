// ChessBoard.tsx
import styles from './ChessBoard.module.scss';
import { useEffect, useState } from 'react';
import RenderPieces from './Components/RenderPieces';
import ToolTip from './Components/ToolTip';
import pieceImages, { classNames, pieceMap } from '../../utils/Util';
import { handleSquareClick } from '../../utils/ChessBoardUtils';
import { blackTopWhiteDown, whiteTopBlackDown } from '../../constants';
import Timer from './Components/Timer';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../../Socket/socket';
import Popup from '../Home/Popup';

const ChessBoard = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [grid, setGrid] = useState<number[][]>([[]]);
  const [chosenPieceColor, setChosenPieceColor] = useState<'white' | 'black' | null>(null);
  const [isBlackMove, setIsBlackMove] = useState(false);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [tooltipX, setTooltipX] = useState(0);
  const [tooltipY, setTooltipY] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [blackScore, setBlackScore] = useState<number[]>([]);
  const [whiteScore, setWhiteScore] = useState<number[]>([]);
  const [validMoves, setValidMoves] = useState<number[][]>([[]]);
  const [piecesInAttack, setPiecesInAttack] = useState<number[][]>([[]]);
  const [movingPiece, setMovingPiece] = useState({
    rowIndex: -1,
    colIndex: -1,
  });
  const [whiteTime, setWhiteTime] = useState(600); // 600 seconds = 10 mins
  const [blackTime, setBlackTime] = useState(600);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [winner, setWinner] = useState<'white' | 'black' | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [isCreator, setIsCreator] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const showMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const handleRoomJoined = (data: {
    message: string;
    isCreator: boolean;
    playerCount: number;
    userId: string;
  }) => {
    console.log('Room joined:', data);
    showMessage(data.message);
    setIsCreator(data.isCreator);
    setPlayerCount(data.playerCount);
    setUserId(data.userId);
  };

  const handleOpponentJoined = (data: {
    message: string;
    playerCount: number;
    userId: string;
  }) => {
    console.log('Opponent joined:', data);
    showMessage(data.message);
    setPlayerCount(data.playerCount);
    setOpponentJoined(true);
  };

  const handleRoomFull = (data: { message: string; userId: string }) => {
    console.log('Room full:', data);
    showMessage(data.message, 'error');
  };

  const handleAlreadyInRoom = (data: {
    message: string;
    isCreator: boolean;
    playerCount: number;
    userId: string;
  }) => {
    console.log('Already in room:', data);
    showMessage(data.message);
    setIsCreator(data.isCreator);
    setPlayerCount(data.playerCount);
    setUserId(data.userId);
  };
  
  useEffect(() => {
    if (!roomId) {
      showMessage('No room ID provided', 'error');
      navigate('/');
      return;
    }

    // Set up event listeners
    socket.on('roomJoined', handleRoomJoined);
    socket.on('opponentJoined', handleOpponentJoined);
    socket.on('roomFull', handleRoomFull);
    socket.on('alreadyInRoom', handleAlreadyInRoom);

    // Join the room
    socket.emit('joinRoom', roomId);

    // Clean up
    return () => {
      socket.off('roomJoined', handleRoomJoined);
      socket.off('opponentJoined', handleOpponentJoined);
      socket.off('roomFull', handleRoomFull);
      socket.off('alreadyInRoom', handleAlreadyInRoom);
      socket.emit('leaveRoom', roomId);
    };
  }, [roomId, navigate]);

  useEffect(() => {
    if (!chosenPieceColor) return;
    if (intervalId) clearInterval(intervalId);

    const id = setInterval(() => {
      if (isBlackMove) {
        setBlackTime(prev => {
          if (prev <= 1) {
            clearInterval(id);
            setWinner('white');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setWhiteTime(prev => {
          if (prev <= 1) {
            clearInterval(id);
            setWinner('black');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    setIntervalId(id);

    return () => clearInterval(id);
  }, [isBlackMove, chosenPieceColor]);

  useEffect(() => {
    if (chosenPieceColor) {
      setGrid(chosenPieceColor === 'white' ? blackTopWhiteDown : whiteTopBlackDown);
    }
  }, [chosenPieceColor]);

  // Handle opponent's moves
  useEffect(() => {
    const handleOpponentMove = (move: any) => {
      console.log('Opponent moved:', move);
      setIsBlackMove(!isBlackMove);
    };

    socket.on('opponentMove', handleOpponentMove);

    return () => {
      socket.off('opponentMove', handleOpponentMove);
    };
  }, [isBlackMove]);

  //select piece from tooltip
  const selectPiece = (piece: number) => {
    setValidMoves([[]]);
    setPiecesInAttack([[]]);
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => [...row]);
      newGrid[currentRow][currentCol] = piece;
      return newGrid;
    });
    setShowTooltip(false);
  };

  const onSquareClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    rowIndex: number,
    colIndex: number
  ) => {
    setCurrentRow(rowIndex);
    setCurrentCol(colIndex);
    console.log(`Row: ${rowIndex}, Col: ${colIndex}`);

    if (!roomId) return;

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
      setBlackScore,
      setWhiteScore,
      setTooltipX,
      setTooltipY,
      setShowTooltip,
      isBlackMove,
      setIsBlackMove,
      chosenPieceColor === 'white',
      roomId
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
      <p className={styles.header}>Start Playing</p>

      {!chosenPieceColor ? (
        <div className={styles.choosePieceColor}>
          {opponentJoined ? (
            isCreator ? (
              <>
                <p className={styles.choosePieceColorText}>Choose your piece color</p>
                <div className={styles.button}>
                  <button onClick={() => setChosenPieceColor('black')}>Black</button>
                  <button onClick={() => setChosenPieceColor('white')}>White</button>
                </div>
              </>
            ) : (
              <p className={styles.waitingText}>Waiting for room creator to choose color...</p>
            )
          ) : (
            <p className={styles.waitingText}>Waiting for another player to join...</p>
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
      {showPopup && (
        <Popup message={popupMessage} onClose={() => setShowPopup(false)} type={popupType} />
      )}
    </div>
  );
};

export default ChessBoard;
