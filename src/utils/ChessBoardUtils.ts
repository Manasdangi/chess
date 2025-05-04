import socket from '../Socket/socket';

const isSafe = (grid: number[][], row: number, col: number, checkNull: boolean = true) => {
  if (row < 0 || row > 7 || col < 0 || col > 7 || (checkNull && grid[row][col] != 0)) return false;
  else return true;
};

const isCastlingMove = (
  grid: number[][],
  row: number,
  col: number,
  movingPieceIndex: { row: number; col: number }
) => {
  const currentPiece = grid[row][col];
  const movingPiece = grid[movingPieceIndex.row][movingPieceIndex.col];
  if (!(row == 0 || row == 7)) return false;
  if (!(movingPieceIndex.row == 0 || movingPieceIndex.row == 7)) return false;
  if (row !== movingPieceIndex.row) return false;
  if (!(currentPiece === 5 || currentPiece === -5)) return false;
  if (!(movingPiece === 1 || movingPiece === -1)) return false;
  return true;
};

const executeCastling = (
  roomId: string,
  grid: number[][],
  col: number,
  movingPieceIndex: { row: number; col: number },
  setGrid: React.Dispatch<React.SetStateAction<number[][]>>,
  setValidMoves: React.Dispatch<React.SetStateAction<number[][]>>,
  setPiecesInAttack: React.Dispatch<React.SetStateAction<number[][]>>
) => {
  setGrid(prevGrid => {
    let newGrid = prevGrid.map((r: number[]) => [...r]);

    const kingStartCol = movingPieceIndex.col;
    const kingRow = movingPieceIndex.row;

    const isKingside = col > kingStartCol;

    let from1, to1, from2, to2;

    if (isKingside) {
      // Kingside Castling
      newGrid[kingRow][kingStartCol + 2] = newGrid[kingRow][kingStartCol]; // move king
      newGrid[kingRow][kingStartCol] = 0;

      newGrid[kingRow][kingStartCol + 1] = newGrid[kingRow][7]; // move rook
      newGrid[kingRow][7] = 0;

      from1 = { row: kingRow, col: 7 }; // rook
      to1 = { row: kingRow, col: kingStartCol + 1 };
      from2 = { row: kingRow, col: kingStartCol }; // king
      to2 = { row: kingRow, col: kingStartCol + 2 };
    } else {
      // Queenside Castling
      newGrid[kingRow][kingStartCol - 2] = newGrid[kingRow][kingStartCol]; // move king
      newGrid[kingRow][kingStartCol] = 0;

      newGrid[kingRow][kingStartCol - 1] = newGrid[kingRow][0]; // move rook
      newGrid[kingRow][0] = 0;

      from1 = { row: kingRow, col: 0 }; // rook
      to1 = { row: kingRow, col: kingStartCol - 1 };
      from2 = { row: kingRow, col: kingStartCol }; // king
      to2 = { row: kingRow, col: kingStartCol - 2 };
    }

    setValidMoves([[]]);
    setPiecesInAttack([[]]);

    console.log('Castling Move:', from1, to1, from2, to2);

    // Emit rook move
    socket.emit('move', {
      roomId,
      move: {
        piece: grid[from1.row][from1.col],
        from: from1,
        to: to1,
      },
    });

    // Emit king move
    socket.emit('move', {
      roomId,
      move: {
        piece: grid[from2.row][from2.col],
        from: from2,
        to: to2,
      },
    });

    return newGrid;
  });
};

const movePiece = (
  grid: number[][],
  row: number,
  col: number,
  currentPiece: number,
  movingPieceIndex: { row: number; col: number },
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
  if (isCastlingMove(grid, row, col, movingPieceIndex)) {
    executeCastling(roomId, grid, col, movingPieceIndex, setGrid, setValidMoves, setPiecesInAttack);
    return;
  }
  let executed = false;
  setValidMoves([[]]);
  setPiecesInAttack([[]]);

  socket.emit('move', {
    roomId,
    move: {
      piece: grid[movingPieceIndex.row][movingPieceIndex.col],
      from: {
        row: movingPieceIndex.row,
        col: movingPieceIndex.col,
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
    newGrid[row][col] = prevGrid[movingPieceIndex.row][movingPieceIndex.col];
    newGrid[movingPieceIndex.row][movingPieceIndex.col] = 0;
    executed = true;
    return newGrid;
  });

  const val = grid[movingPieceIndex.row][movingPieceIndex.col];
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

const isPathClear = (grid: number[][], row: number, colStart: number, colEnd: number) => {
  for (let i = colStart; i <= colEnd; i++) {
    if (grid[row][i] != 0) return false;
  }
  return true;
};

const checkIfCastlingIsPossible = (
  grid: number[][],
  row: number,
  col: number,
  setPiecesInAttack: React.Dispatch<React.SetStateAction<number[][]>>,
  isWhitePieceDown: boolean
) => {
  if (grid[row][col] != 1 && grid[row][col] != -1) return;
  if (!(row == 0 || row == 7)) return;
  if (!(col == 3 || col == 4)) return;
  if (isWhitePieceDown) {
    if (row == 0) {
      if (grid[0][0] === -5 && isPathClear(grid, 0, 1, 3)) {
        setPiecesInAttack(prev => [...prev, [0, 0]]);
      }
      if (grid[0][7] === -5 && isPathClear(grid, 0, 5, 6)) {
        setPiecesInAttack(prev => [...prev, [0, 7]]);
      }
    } else {
      if (grid[7][0] === 5 && isPathClear(grid, 7, 1, 3)) {
        setPiecesInAttack(prev => [...prev, [7, 0]]);
      }
      if (grid[7][7] === 5 && isPathClear(grid, 7, 5, 6)) {
        setPiecesInAttack(prev => [...prev, [7, 7]]);
      }
    }
  } else {
    if (row == 0) {
      if (grid[0][0] === 5 && isPathClear(grid, 0, 1, 3)) {
        setPiecesInAttack(prev => [...prev, [0, 0]]);
      }
      if (grid[0][7] === 5 && isPathClear(grid, 0, 5, 6)) {
        setPiecesInAttack(prev => [...prev, [0, 7]]);
      }
    } else {
      if (grid[7][0] === -5 && isPathClear(grid, 7, 1, 3)) {
        setPiecesInAttack(prev => [...prev, [7, 0]]);
      }
      if (grid[7][7] === -5 && isPathClear(grid, 7, 5, 6)) {
        setPiecesInAttack(prev => [...prev, [7, 7]]);
      }
    }
  }
};
export const handleSquareClick = (
  event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  grid: number[][],
  row: number,
  col: number,
  setGrid: React.Dispatch<React.SetStateAction<number[][]>>,
  movingPieceIndex: { row: number; col: number },
  setMovingPieceIndex: React.Dispatch<
    React.SetStateAction<{
      row: number;
      col: number;
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
  const currentPiece = grid[row][col];
  if (
    validMoves.some(move => move[0] == row && move[1] == col) ||
    piecesInAttack.some(move => move[0] == row && move[1] == col)
  ) {
    if (movingPieceIndex.row == -1) {
      return;
    }
    setTooltipX(event.clientX);
    setTooltipY(event.clientY);
    setIsBlackMove(prev => !prev);
    movePiece(
      grid,
      row,
      col,
      currentPiece,
      movingPieceIndex,
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
    setMovingPieceIndex({ row: row, col: col });
  } else {
    // If the clicked square is not a valid move or attack, reset the moving piece
    if (movingPieceIndex.row != -1) {
      setValidMoves([[]]);
      setPiecesInAttack([[]]);
      setMovingPieceIndex({ row: -1, col: -1 });
    }

    if ((isBlackMove && currentPiece > 0) || (!isBlackMove && currentPiece < 0)) return;
    checkIfCastlingIsPossible(grid, row, col, setPiecesInAttack, isWhitePieceDown);
    setMovingPieceIndex({ row: row, col: col });
    highLight(grid, row, col, setValidMoves, setPiecesInAttack, isWhitePieceDown);
  }
};
