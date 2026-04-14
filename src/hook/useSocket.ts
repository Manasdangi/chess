import { useEffect, useRef } from 'react';
import socket from '../Socket/socket';
import { Move } from '../types/chess';

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
    onOpponentMove: (move: Move) => void;
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
      onOpponentMove,
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
    socket.on('newOpponentScore', onOpponentScore);
    socket.on('opponentMove', onOpponentMove);
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
      socket.off('opponentMove', onOpponentMove);
      socket.off('newOpponentScore', onOpponentScore);
      socket.off('opponentResign', onOpponentResign);
      socket.off('opponentTimeout', onOpponentTimeout);
      socket.off('opponentKingKilled', onOpponentKingKilled);
      socket.off('alreadyInRoom', onAlreadyInRoom);
      socket.off('roomFull', onRoomFull);
    };
  }, [roomId, joinProfile.email, joinProfile.displayName, callbacks]);
};
