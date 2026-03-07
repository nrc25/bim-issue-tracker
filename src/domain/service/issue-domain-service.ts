import type { Issue } from "../model/issue";
import { IssueStatus } from "../value-object";

/**
 * ドメインサービス: Issue に関する集約横断のビジネスロジック
 *
 * 単一の集約で完結しないドメインロジックをここに配置する。
 * MVP段階ではシンプルだが、将来の拡張（重複検知、自動アサイン等）に備える。
 */
export class IssueDomainService {
  /**
   * 指摘が全て解決済みかどうかを判定
   */
  static allResolved(issues: Issue[]): boolean {
    return issues.every(
      (i) =>
        i.status === IssueStatus.Resolved || i.status === IssueStatus.Closed
    );
  }

  /**
   * 同一座標の近傍にすでに指摘が存在するかチェック（重複防止）
   */
  static hasDuplicateNearby(
    existing: Issue[],
    x: number,
    y: number,
    z: number,
    threshold = 0.5
  ): boolean {
    return existing.some((issue) => {
      const loc = issue.pinLocation;
      const dist = Math.sqrt(
        (loc.x - x) ** 2 + (loc.y - y) ** 2 + (loc.z - z) ** 2
      );
      return dist < threshold;
    });
  }
}
