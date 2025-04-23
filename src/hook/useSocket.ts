import { useEffect } from 'react';
import socket from '../Socket/socket';
import { Move } from '../types/chess';

export const useSocket = (
  roomId: string | undefined,
  callbacks: {
    onRoomJoined: (data: { isCreator: boolean }) => void;
    onOpponentJoined: () => void;
    onOpponentChoosePieceColor: (color: 'white' | 'black') => void;
    onOpponentMove: (move: Move) => void;
  }
) => {
  useEffect(() => {
    if (!roomId) return;

    const { onRoomJoined, onOpponentJoined, onOpponentChoosePieceColor, onOpponentMove } = callbacks;

    socket.on('roomJoined', onRoomJoined);
    socket.on('opponentJoined', onOpponentJoined);
    socket.on('opponentChoosePieceColor', onOpponentChoosePieceColor);
    socket.on('opponentMove', onOpponentMove);

    socket.emit('joinRoom', roomId);

    return () => {
      socket.off('roomJoined', onRoomJoined);
      socket.off('opponentJoined', onOpponentJoined);
      socket.off('opponentChoosePieceColor', onOpponentChoosePieceColor);
      socket.off('opponentMove', onOpponentMove);
      socket.emit('leaveRoom', roomId);
    };
  }, [roomId, callbacks]);
};
