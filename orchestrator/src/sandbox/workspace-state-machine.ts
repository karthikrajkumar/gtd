export type SandboxStatus =
  | 'SANDBOX_ACTIVE'
  | 'READY_FOR_HANDOVER'
  | 'HANDOVER_IN_PROGRESS'
  | 'HANDED_OVER'
  | 'ARCHIVED';

/**
 * Valid workspace state transitions.
 *
 * Mirrors the lifecycle from HOLISTIC_PLAN.md §7.1:
 *   SANDBOX_ACTIVE -> READY_FOR_HANDOVER -> HANDOVER_IN_PROGRESS
 *     -> HANDED_OVER -> ARCHIVED
 *
 * Additional transitions:
 *   - SANDBOX_ACTIVE -> ARCHIVED (timeout / forced teardown)
 *   - HANDOVER_IN_PROGRESS -> READY_FOR_HANDOVER (failed push, rollback)
 */
const TRANSITIONS: Record<SandboxStatus, SandboxStatus[]> = {
  SANDBOX_ACTIVE: ['READY_FOR_HANDOVER', 'ARCHIVED'],
  READY_FOR_HANDOVER: ['HANDOVER_IN_PROGRESS', 'SANDBOX_ACTIVE', 'ARCHIVED'],
  HANDOVER_IN_PROGRESS: ['HANDED_OVER', 'READY_FOR_HANDOVER', 'ARCHIVED'],
  HANDED_OVER: ['ARCHIVED'],
  ARCHIVED: [],
};

export class WorkspaceStateMachineError extends Error {
  constructor(
    public readonly from: SandboxStatus,
    public readonly to: SandboxStatus,
  ) {
    super(`Invalid workspace transition: ${from} -> ${to}`);
    this.name = 'WorkspaceStateMachineError';
  }
}

export function canTransition(from: SandboxStatus, to: SandboxStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: SandboxStatus, to: SandboxStatus): void {
  if (!canTransition(from, to)) {
    throw new WorkspaceStateMachineError(from, to);
  }
}

export function getValidTransitions(from: SandboxStatus): SandboxStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function isTerminal(status: SandboxStatus): boolean {
  return status === 'ARCHIVED';
}

export function isHandoverReady(status: SandboxStatus): boolean {
  return status === 'READY_FOR_HANDOVER';
}
