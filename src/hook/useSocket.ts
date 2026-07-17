import { useEffect, useRef } from 'react';
import socket from '../Socket/socket';
import { CaptureState, ClockState, GameStatus, ServerMovePayload } from '../types/chess';

export type OpponentJoinedPayload = {
  opponentEmail: string;
  opponentDisplayName: string;
};

export const useSocket = (
  roomId: string | undefined,
  joinProfile: { email: string; displayName: string },
  callbacks: {
    onRoomJoined: (data: { isCreator: boolean }) => void;
    onOpponentJoined: (payload: OpponentJoinedPayload) => void;
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
) => {
  const joinedSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const {
      onRoomJoined,
      onOpponentJoined,
      onOpponentChoosePieceColor,
      onMoveAccepted,
      onMoveRejected,
      onOpponentMove,
      onClockUpdate,
      onGameOver,
      onOpponentScore,
      onOpponentResign,
      onOpponentTimeout,
      onOpponentKingKilled,
      onRoomFull,
      onAlreadyInRoom,
    } = callbacks;

    socket.on('roomJoined', onRoomJoined);
    socket.on('opponentJoined', (payload: unknown) => {
      if (typeof payload === 'string') {
        onOpponentJoined({ opponentEmail: payload, opponentDisplayName: '' });
        return;
      }
      if (payload && typeof payload === 'object' && 'opponentEmail' in payload) {
        const p = payload as { opponentEmail?: string; opponentDisplayName?: string };
        onOpponentJoined({
          opponentEmail: p.opponentEmail ?? '',
          opponentDisplayName: p.opponentDisplayName ?? '',
        });
      }
    });
    socket.on('opponentChoosePieceColor', onOpponentChoosePieceColor);
    socket.on('moveAccepted', onMoveAccepted);
    socket.on('moveRejected', onMoveRejected);
    socket.on('newOpponentScore', onOpponentScore);
    socket.on('opponentMove', onOpponentMove);
    socket.on('clockUpdate', onClockUpdate);
    socket.on('gameOver', onGameOver);
    socket.on('opponentResign', onOpponentResign);
    socket.on('opponentTimeout', onOpponentTimeout);
    socket.on('opponentKingKilled', onOpponentKingKilled);
    socket.on('roomFull', onRoomFull);
    socket.on('alreadyInRoom', onAlreadyInRoom);
    const joinSignature = `${roomId}::${joinProfile.email}::${joinProfile.displayName}`;
    if (joinedSignatureRef.current !== joinSignature) {
      joinedSignatureRef.current = joinSignature;
      socket.emit('joinRoom', roomId, {
        email: joinProfile.email,
        displayName: joinProfile.displayName,
      });
    }

    return () => {
      socket.off('roomJoined', onRoomJoined);
      socket.off('opponentJoined');
      socket.off('opponentChoosePieceColor', onOpponentChoosePieceColor);
      socket.off('moveAccepted', onMoveAccepted);
      socket.off('moveRejected', onMoveRejected);
      socket.off('opponentMove', onOpponentMove);
      socket.off('clockUpdate', onClockUpdate);
      socket.off('gameOver', onGameOver);
      socket.off('newOpponentScore', onOpponentScore);
      socket.off('opponentResign', onOpponentResign);
      socket.off('opponentTimeout', onOpponentTimeout);
      socket.off('opponentKingKilled', onOpponentKingKilled);
      socket.off('alreadyInRoom', onAlreadyInRoom);
      socket.off('roomFull', onRoomFull);
    };
  }, [roomId, joinProfile.email, joinProfile.displayName, callbacks]);
};
