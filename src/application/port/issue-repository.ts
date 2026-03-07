import type { Issue } from "../../domain/model/issue";
import type { IssueId } from "../../domain/value-object";

/**
 * ============================================================
 *  IssueRepository Port (Application Layer)
 * ============================================================
 *
 * 依存性逆転の原則 (DIP) に基づき、アプリケーション層が
 * インターフェースを所有し、インフラ層がこれを実装する。
 *
 *  domain ← application (port) ← infrastructure (adapter)
 *
 * これにより、DBやORMの変更がドメイン・アプリケーション層に波及しない。
 */
export interface IssueRepository {
  /** 集約の永続化 */
  save(issue: Issue): Promise<void>;

  /** IDで集約を取得（存在しない場合 null） */
  findById(id: IssueId): Promise<Issue | null>;

  /** 全件取得（MVPではページネーション省略） */
  findAll(): Promise<Issue[]>;

  /** 集約の削除 */
  delete(id: IssueId): Promise<void>;
}
