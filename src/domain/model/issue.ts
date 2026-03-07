import {
  IssueId,
  IssueStatus,
  PinLocation,
  Photo,
  assertTransition,
} from "../value-object";
import type { DomainEvent } from "../event/domain-event";
import {
  IssueCreatedEvent,
  IssueStatusChangedEvent,
  PhotoAttachedEvent,
} from "../event/issue-events";

/**
 * ============================================================
 *  Issue Aggregate Root
 * ============================================================
 *
 * 集約ルート (Aggregate Root) としての Issue。
 * - 状態遷移のバリデーションをドメイン層で完結
 * - 写真 (Photo) は Issue に従属するエンティティとして管理
 * - ドメインイベントを蓄積し、アプリケーション層で発行する
 *
 * 設計意図:
 *   コンストラクタを private にして create / reconstruct のみ公開。
 *   これにより「新規作成」と「永続化層からの復元」を明確に区別し、
 *   不正な状態のオブジェクト生成を防止する。
 */
export class Issue {
  private _domainEvents: DomainEvent[] = [];

  // ─── private constructor ──────────────────────────────────
  private constructor(
    private readonly _id: IssueId,
    private _title: string,
    private _description: string,
    private _status: IssueStatus,
    private _pinLocation: PinLocation,
    private _photos: Photo[],
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  // ─── Factory: 新規作成 ────────────────────────────────────
  static create(params: {
    title: string;
    description: string;
    pinLocation: PinLocation;
  }): Issue {
    if (!params.title || params.title.trim().length === 0) {
      throw new Error("Issue title is required");
    }

    const now = new Date();
    const issue = new Issue(
      IssueId.generate(),
      params.title.trim(),
      params.description?.trim() ?? "",
      IssueStatus.Open,
      params.pinLocation,
      [],
      now,
      now
    );

    issue.addEvent(
      new IssueCreatedEvent(issue._id.value, issue._title, now)
    );

    return issue;
  }

  // ─── Factory: 永続化層からの復元 ──────────────────────────
  static reconstruct(params: {
    id: string;
    title: string;
    description: string;
    status: IssueStatus;
    pinLocation: PinLocation;
    photos: Photo[];
    createdAt: Date;
    updatedAt: Date;
  }): Issue {
    return new Issue(
      IssueId.reconstruct(params.id),
      params.title,
      params.description,
      params.status,
      params.pinLocation,
      params.photos,
      params.createdAt,
      params.updatedAt
    );
  }

  // ─── Domain Behavior: ステータス遷移 ─────────────────────
  transition(to: IssueStatus): void {
    assertTransition(this._status, to);
    const from = this._status;
    this._status = to;
    this._updatedAt = new Date();

    this.addEvent(
      new IssueStatusChangedEvent(this._id.value, from, to, this._updatedAt)
    );
  }

  // ─── Domain Behavior: 写真添付 ────────────────────────────
  attachPhoto(photo: Photo): void {
    if (this._photos.length >= 10) {
      throw new Error("Cannot attach more than 10 photos to a single issue");
    }
    this._photos.push(photo);
    this._updatedAt = new Date();

    this.addEvent(
      new PhotoAttachedEvent(this._id.value, photo.id.value, this._updatedAt)
    );
  }

  // ─── Domain Behavior: 基本情報更新 ────────────────────────
  updateDetails(title: string, description: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error("Issue title is required");
    }
    this._title = title.trim();
    this._description = description?.trim() ?? "";
    this._updatedAt = new Date();
  }

  // ─── Accessors (Readonly) ─────────────────────────────────
  get id(): IssueId { return this._id; }
  get title(): string { return this._title; }
  get description(): string { return this._description; }
  get status(): IssueStatus { return this._status; }
  get pinLocation(): PinLocation { return this._pinLocation; }
  get photos(): ReadonlyArray<Photo> { return this._photos; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // ─── Domain Events ────────────────────────────────────────
  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  clearEvents(): void {
    this._domainEvents = [];
  }

  private addEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }
}
