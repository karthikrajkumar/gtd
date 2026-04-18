/**
 * WebSocket Manager — handles connections and per-session subscriptions.
 */

import type { WebSocket } from 'ws';
import type { ServerMessage, ClientMessage } from './ws-protocol.js';

interface WsConnection {
  socket: WebSocket;
  sessionId: string | null;
}

export class WsManager {
  private connections = new Map<WebSocket, WsConnection>();

  /** Register a new WebSocket connection */
  register(socket: WebSocket): void {
    const conn: WsConnection = { socket, sessionId: null };
    this.connections.set(socket, conn);

    socket.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString()) as ClientMessage;
        this.handleMessage(conn, msg);
      } catch {
        // Ignore malformed messages
      }
    });

    socket.on('close', () => {
      this.connections.delete(socket);
    });
  }

  /** Send a message to all connections subscribed to a session */
  send(sessionId: string, message: ServerMessage): void {
    const json = JSON.stringify(message);
    for (const conn of this.connections.values()) {
      if (conn.sessionId === sessionId && conn.socket.readyState === 1) {
        conn.socket.send(json);
      }
    }
  }

  /** Broadcast to all connections (for global events) */
  broadcast(message: ServerMessage): void {
    const json = JSON.stringify(message);
    for (const conn of this.connections.values()) {
      if (conn.socket.readyState === 1) {
        conn.socket.send(json);
      }
    }
  }

  /** Handle incoming client message */
  private handleMessage(conn: WsConnection, msg: ClientMessage): void {
    switch (msg.type) {
      case 'subscribe':
        conn.sessionId = msg.sessionId;
        break;
      case 'chat':
        // Chat messages are handled via the onChat callback
        this.chatHandler?.(msg.sessionId, msg.content);
        break;
    }
  }

  /** Register a handler for chat messages received via WebSocket */
  private chatHandler?: (sessionId: string, content: string) => void;

  onChat(handler: (sessionId: string, content: string) => void): void {
    this.chatHandler = handler;
  }
}
