/**
 * ドメインイベントの基底インターフェース
 * CQRS/Event Sourcing への拡張を見据えた設計
 */
export interface DomainEvent {
  readonly eventType: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
}
