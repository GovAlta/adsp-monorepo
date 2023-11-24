import { Request } from 'express';
import { JwtFromRequestFunction } from 'passport-jwt';
import { Socket } from 'socket.io';

export const REQ_SOCKET_PROP = '_socketIO';

/**
 * Extracts from an associated Socket IO instance.
 *
 * Note that this is dependent on a magic property since there's an inversion of abstraction between
 * Socket IO interface and Express request interface in the way we use them.
 *
 * @param {Request} req
 * @returns
 */
export const fromSocketHandshake: JwtFromRequestFunction = function (req: Request) {
  const socket: Socket = req?.[REQ_SOCKET_PROP];

  return socket?.handshake?.auth?.token || null;
};
