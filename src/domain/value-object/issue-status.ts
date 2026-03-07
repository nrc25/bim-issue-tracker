/**
 * 指摘ステータスの状態遷移をドメインルールとしてカプセル化
 *
 *   Open ──→ InProgress ──→ Resolved ──→ Closed
 *     │          │              │
 *     └──────────┴──── Closed ←─┘  (どこからでもCloseは可能)
 */
export const IssueStatus = {
  Open: "Open",
  InProgress: "InProgress",
  Resolved: "Resolved",
  Closed: "Closed",
} as const;

export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus];

/** 許可される遷移マップ（ドメインルール） */
const ALLOWED_TRANSITIONS: Record<IssueStatus, ReadonlySet<IssueStatus>> = {
  [IssueStatus.Open]: new Set([IssueStatus.InProgress, IssueStatus.Closed]),
  [IssueStatus.InProgress]: new Set([IssueStatus.Resolved, IssueStatus.Closed]),
  [IssueStatus.Resolved]: new Set([IssueStatus.Closed, IssueStatus.InProgress]),
  [IssueStatus.Closed]: new Set(), // 終端状態
};

export function canTransition(from: IssueStatus, to: IssueStatus): boolean {
  return ALLOWED_TRANSITIONS[from].has(to);
}

export function assertTransition(from: IssueStatus, to: IssueStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidStatusTransitionError(from, to);
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor(from: IssueStatus, to: IssueStatus) {
    super(`Invalid status transition: ${from} → ${to}`);
    this.name = "InvalidStatusTransitionError";
  }
}
