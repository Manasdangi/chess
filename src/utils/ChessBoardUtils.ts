import socket from '../Socket/socket';

const isSafe = (grid: number[][], row: number, col: number, checkNull: boolean = true) => {
  if (row < 0 || row > 7 || col < 0 || col > 7 || (checkNull && grid[row][col] != 0)) return false;
  else return true;
};

const movePiece = (
  grid: number[][],
  row: number,
  col: number,
  currentPiece: number,
  movingPiece: { rowIndex: number; colIndex: number },
  setGrid: React.Dispatch<React.SetStateAction<number[][]>>,
  setValidMoves: React.Dispatch<React.SetStateAction<number[][]>>,
  setPiecesInAttack: React.Dispatch<React.SetStateAction<number[][]>>,
  blackScore: number[],
  whiteScore: number[],
  setBlackScore: React.Dispatch<React.SetStateAction<number[]>>,
  setWhiteScore: React.Dispatch<React.SetStateAction<number[]>>,
  setShowTooltip: React.Dispatch<React.SetStateAction<boolean>>,
  roomId: string
) => {
  let executed = false;
  setValidMoves([[]]);
  setPiecesInAttack([[]]);

  socket.emit('move', {
    roomId,
    move: {
      piece: grid[movingPiece.rowIndex][movingPiece.colIndex],
      from: {
        row: movingPiece.rowIndex,
        col: movingPiece.colIndex,
      },
      to: {
        row,
        col,
      },
    },
  });

  setGrid(prevGrid => {
    let newGrid = prevGrid.map((r: number[]) => [...r]);
    const piece = newGrid[row][col];

    if (!executed) {
      const updatedBlackScore = piece > 0 ? [...blackScore, piece] : blackScore;
      const updatedWhiteScore = piece < 0 ? [...whiteScore, piece] : whiteScore;
      socket.emit(
        'updateOpponentScore',
        roomId,
        piece > 0 ? updatedBlackScore : updatedWhiteScore,
        piece > 0 ? 'black' : 'white'
      );
      if (piece > 0) {
        setBlackScore(updatedBlackScore);
      } else if (piece < 0) {
        setWhiteScore(updatedWhiteScore);
      }
    }
    newGrid[row][col] = prevGrid[movingPiece.rowIndex][movingPiece.colIndex];
    newGrid[movingPiece.rowIndex][movingPiece.colIndex] = 0;
    executed = true;
    return newGrid;
  });

  const val = grid[movingPiece.rowIndex][movingPiece.colIndex];
  console.log('val', val, currentPiece);
  if (
    (row == 0 || row == 7) &&
    (val == 6 || val == -6) &&
    currentPiece != 1 &&
    currentPiece != -1
  ) {
    setShowTooltip(true);
  }
};

const getValidAndAttackingMoves = (
  grid: number[][],
  rowIndex: number,
  colIndex: number,
  rowStep: number,
  colStep: number,
  isKingCase: boolean = false
): { moves1: number[][]; moves2: number[][] } => {
  let moves1: number[][] = [[]];
  let moves2: number[][] = [[]];
  let newRow = rowIndex + rowStep;
  let newCol = colIndex + colStep;
  while (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
    if (grid[newRow][newCol] === 0) {
      moves1.push([newRow, newCol]);
    } else if (grid[newRow][newCol] * grid[rowIndex][colIndex] < 0) {
      moves2.push([newRow, newCol]);
      break;
    } else {
      break;
    }
    newRow += rowStep;
    newCol += colStep;
    if (isKingCase) break;
  }

  return {
    moves1,
    moves2,
  };
};

const getKnightMoves = (
  grid: number[][],
  row: number,
  col: number
): { moves1: number[][]; moves2: number[][] } => {
  const potentialMoves = [
    [row - 2, col - 1],
    [row - 2, col + 1],
    [row - 1, col - 2],
    [row - 1, col + 2],
    [row + 1, col - 2],
    [row + 1, col + 2],
    [row + 2, col - 1],
    [row + 2, col + 1],
  ];
  return {
    moves1: potentialMoves.filter(([r, c]) => isSafe(grid, r, c)),
    moves2: potentialMoves.filter(
      ([r, c]) => isSafe(grid, r, c, false) && grid[r][c] != 0 && grid[r][c] * grid[row][col] < 0
    ),
  };
};

const isBounded = (row: number, col: number) => {
  return !(row < 0 || row > 7 || col < 0 || col > 7);
};

const highLight = (
  grid: number[][],
  row: number,
  col: number,
  setValidMoves: React.Dispatch<React.SetStateAction<number[][]>>,
  setPiecesInAttack: React.Dispatch<React.SetStateAction<number[][]>>,
  isWhitePieceDown: boolean
) => {
  const val = grid[row][col];
  let validMoves: number[][] = [[]];
  let attackingMoves: number[][] = [[]];
  const stepArray = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
    [1, 0],
    [1, -1],
    [0, -1],
  ];
  switch (val) {
    case 6:
    case -6:
      let step;
      if ((grid[row][col] > 0 && !isWhitePieceDown) || (grid[row][col] < 0 && isWhitePieceDown))
        step = 1;
      else step = -1;

      if (isSafe(grid, row + step * 1, col)) {
        validMoves.push([row + step * 1, col]);
        if ((row === 1 || row === 6) && isSafe(grid, row + step * 2, col))
          validMoves.push([row + step * 2, col]);
      }
      if (isBounded(row + step * 1, col - 1) && grid[row + step * 1][col - 1] !== 0) {
        attackingMoves.push([row + step * 1, col - 1]);
      }
      if (isBounded(row + step * 1, col + 1) && grid[row + step * 1][col + 1] !== 0) {
        attackingMoves.push([row + step * 1, col + 1]);
      }
      break;

    case 1:
    case -1:
      for (let i = 0; i < stepArray.length; i++) {
        const { moves1, moves2 } = getValidAndAttackingMoves(
          grid,
          row,
          col,
          stepArray[i][0],
          stepArray[i][1],
          true
        );
        validMoves = [...validMoves, ...moves1];
        attackingMoves = [...attackingMoves, ...moves2];
      }
      break;

    case 2:
    case -2:
      for (let i = 0; i < stepArray.length; i++) {
        const { moves1, moves2 } = getValidAndAttackingMoves(
          grid,
          row,
          col,
          stepArray[i][0],
          stepArray[i][1]
        );
        validMoves = [...validMoves, ...moves1];
        attackingMoves = [...attackingMoves, ...moves2];
      }
      break;

    case 3:
    case -3:
      for (let i = 0; i < stepArray.length; i += 2) {
        const { moves1, moves2 } = getValidAndAttackingMoves(
          grid,
          row,
          col,
          stepArray[i][0],
          stepArray[i][1]
        );
        validMoves = [...validMoves, ...moves1];
        attackingMoves = [...attackingMoves, ...moves2];
      }
      break;

    case 4:
    case -4:
      const total_moves2 = getKnightMoves(grid, row, col);
      validMoves = total_moves2.moves1;
      attackingMoves = total_moves2.moves2;
      break;

    case 5:
    case -5:
      for (let i = 1; i < stepArray.length; i += 2) {
        const { moves1, moves2 } = getValidAndAttackingMoves(
          grid,
          row,
          col,
          stepArray[i][0],
          stepArray[i][1]
        );
        validMoves = [...validMoves, ...moves1];
        attackingMoves = [...attackingMoves, ...moves2];
      }
      break;

    default:
  }
  setValidMoves(prevValidMoves => [...prevValidMoves, ...validMoves]);
  setPiecesInAttack(prevAttackingMoves => [...prevAttackingMoves, ...attackingMoves]);
};

export const handleSquareClick = (
  event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  grid: number[][],
  row: number,
  col: number,
  setGrid: React.Dispatch<React.SetStateAction<number[][]>>,
  movingPiece: { rowIndex: number; colIndex: number },
  setMovingPiece: React.Dispatch<
    React.SetStateAction<{
      rowIndex: number;
      colIndex: number;
    }>
  >,
  validMoves: number[][],
  setValidMoves: React.Dispatch<React.SetStateAction<number[][]>>,
  piecesInAttack: number[][],
  setPiecesInAttack: React.Dispatch<React.SetStateAction<number[][]>>,
  blackScore: number[],
  whiteScore: number[],
  setBlackScore: React.Dispatch<React.SetStateAction<number[]>>,
  setWhiteScore: React.Dispatch<React.SetStateAction<number[]>>,
  setTooltipX: React.Dispatch<React.SetStateAction<number>>,
  setTooltipY: React.Dispatch<React.SetStateAction<number>>,
  setShowTooltip: React.Dispatch<React.SetStateAction<boolean>>,
  isBlackMove: boolean,
  setIsBlackMove: React.Dispatch<React.SetStateAction<boolean>>,
  isWhitePieceDown: boolean,
  roomId: string
) => {
  if (
    validMoves.some(move => move[0] == row && move[1] == col) ||
    piecesInAttack.some(move => move[0] == row && move[1] == col)
  ) {
    if (movingPiece.rowIndex == -1) {
      return;
    }

    if (movingPiece.rowIndex == row && movingPiece.colIndex == col) {
    }
    setTooltipX(event.clientX);
    setTooltipY(event.clientY);
    setIsBlackMove(prev => !prev);
    const currentPiece = grid[row][col];
    movePiece(
      grid,
      row,
      col,
      currentPiece,
      movingPiece,
      setGrid,
      setValidMoves,
      setPiecesInAttack,
      blackScore,
      whiteScore,
      setBlackScore,
      setWhiteScore,
      setShowTooltip,
      roomId
    );
    setMovingPiece({ rowIndex: row, colIndex: col });
  } else {
    // If the clicked square is not a valid move or attack, reset the moving piece
    if (movingPiece.rowIndex != -1) {
      setValidMoves([[]]);
      setPiecesInAttack([[]]);
      setMovingPiece({ rowIndex: -1, colIndex: -1 });
    }

    if (isBlackMove && grid[row][col] > 0) return;
    if (!isBlackMove && grid[row][col] < 0) return;

    setMovingPiece({ rowIndex: row, colIndex: col });
    highLight(grid, row, col, setValidMoves, setPiecesInAttack, isWhitePieceDown);
  }
};
