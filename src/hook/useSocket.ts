import { useEffect } from 'react';
import socket from '../Socket/socket';
import { Move } from '../types/chess';

export const useSocket = (
  roomId: string | undefined,
  userId: string,
  callbacks: {
    onRoomJoined: (data: { isCreator: boolean }) => void;
    onOpponentJoined: (email: string) => void;
    onOpponentChoosePieceColor: (color: 'white' | 'black') => void;
    onOpponentMove: (move: Move) => void;
    onOpponentScore: (score: number[], color: 'white' | 'black') => void;
    onOpponentResign: () => void;
    onOpponentTimeout: () => void;
    onOpponentKingKilled: () => void;
    onRoomFull: () => void;
    onAlreadyInRoom: () => void;
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
      onOpponentKingKilled,
      onRoomFull,
      onAlreadyInRoom,
    } = callbacks;

    socket.on('roomJoined', onRoomJoined);
    socket.on('opponentJoined', onOpponentJoined);
    socket.on('opponentChoosePieceColor', onOpponentChoosePieceColor);
    socket.on('newOpponentScore', onOpponentScore);
    socket.on('opponentMove', onOpponentMove);
    socket.on('opponentResign', onOpponentResign);
    socket.on('opponentTimeout', onOpponentTimeout);
    socket.on('opponentKingKilled', onOpponentKingKilled);
    socket.on('roomFull', onRoomFull);
    socket.on('alreadyInRoom', onAlreadyInRoom);
    socket.emit('joinRoom', roomId, userId);

    return () => {
      socket.off('roomJoined', onRoomJoined);
      socket.off('opponentJoined', onOpponentJoined);
      socket.off('opponentChoosePieceColor', onOpponentChoosePieceColor);
      socket.off('opponentMove', onOpponentMove);
      socket.off('newOpponentScore', onOpponentScore);
      socket.off('opponentResign', onOpponentResign);
      socket.off('opponentTimeout', onOpponentTimeout);
      socket.off('opponentKingKilled', onOpponentKingKilled);
      socket.off('alreadyInRoom', onAlreadyInRoom);
      socket.off('roomFull', onRoomFull);
    };
  }, [roomId, callbacks]);
};
