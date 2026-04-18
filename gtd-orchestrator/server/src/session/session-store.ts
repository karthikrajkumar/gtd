/**
 * In-memory session store. Fine for testing.
 */

import type { SessionState } from './types.js';

const sessions = new Map<string, SessionState>();

export const sessionStore = {
  get(id: string): SessionState | undefined {
    return sessions.get(id);
  },

  set(id: string, session: SessionState): void {
    sessions.set(id, session);
  },

  delete(id: string): boolean {
    return sessions.delete(id);
  },

  list(): SessionState[] {
    return Array.from(sessions.values());
  },

  updateStatus(id: string, status: SessionState['status']): void {
    const session = sessions.get(id);
    if (session) session.status = status;
  },
};
