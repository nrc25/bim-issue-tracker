import type { DomainEvent } from "./domain-event";
import type { IssueStatus } from "../value-object";

export class IssueCreatedEvent implements DomainEvent {
  readonly eventType = "issue.created";
  constructor(
    readonly aggregateId: string,
    readonly title: string,
    readonly occurredAt: Date
  ) {}
}

export class IssueStatusChangedEvent implements DomainEvent {
  readonly eventType = "issue.status_changed";
  constructor(
    readonly aggregateId: string,
    readonly from: IssueStatus,
    readonly to: IssueStatus,
    readonly occurredAt: Date
  ) {}
}

export class PhotoAttachedEvent implements DomainEvent {
  readonly eventType = "issue.photo_attached";
  constructor(
    readonly aggregateId: string,
    readonly photoId: string,
    readonly occurredAt: Date
  ) {}
}
