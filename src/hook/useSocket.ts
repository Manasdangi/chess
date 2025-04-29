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
    onOpponentScore: (score: number[], color: string) => void;
    onOpponentResign: (email: string) => void;
    onOpponentTimeout: (email: string) => void;
  }
) => {
  useEffect(() => {
    if (!roomId) return;

    const {
      onRoomJoined,
      onOpponentJoined,
      onOpponentChoosePieceColor,
      onOpponentMove,
      onOpponentScore,
      onOpponentResign,
      onOpponentTimeout,
    } = callbacks;

    socket.on('roomJoined', onRoomJoined);
    socket.on('opponentJoined', onOpponentJoined);
    socket.on('opponentChoosePieceColor', onOpponentChoosePieceColor);
    socket.on('newOpponentScore', onOpponentScore);
    socket.on('opponentMove', onOpponentMove);
    socket.on('opponentResign', onOpponentResign);
    socket.on('opponentTimeout', onOpponentTimeout);
    socket.emit('joinRoom', roomId);

    return () => {
      socket.off('roomJoined', onRoomJoined);
      socket.off('opponentJoined', onOpponentJoined);
      socket.off('opponentChoosePieceColor', onOpponentChoosePieceColor);
      socket.off('opponentMove', onOpponentMove);
      socket.off('newOpponentScore', onOpponentScore);
      socket.off('opponentResign', onOpponentResign);
      socket.off('opponentTimeout', onOpponentTimeout);
    };
  }, [roomId, callbacks]);
};
