import type { IssueRepository } from "../port/issue-repository";
import type { ObjectStorage } from "../port/object-storage";

// ─── Read Model (DTO) ───────────────────────────────────────
export interface IssueReadModel {
  id: string;
  title: string;
  description: string;
  status: string;
  pin: { x: number; y: number; z: number; viewerState?: string };
  photos: {
    id: string;
    fileName: string;
    url: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

/**
 * ============================================================
 *  GetIssuesQueryHandler (Query Handler)
 * ============================================================
 *
 * CQRS の Read 側。
 * - ドメインモデルを直接返さず、Read 用 DTO に変換する
 * - 将来的にはリードレプリカや非正規化テーブルに切り替え可能
 * - 写真URLは署名付きURLを動的に生成
 */
export class GetIssuesQueryHandler {
  constructor(
    private readonly issueRepo: IssueRepository,
    private readonly storage: ObjectStorage
  ) {}

  async execute(): Promise<IssueReadModel[]> {
    const issues = await this.issueRepo.findAll();

    const results: IssueReadModel[] = [];

    for (const issue of issues) {
      const photos = await Promise.all(
        issue.photos.map(async (p) => ({
          id: p.id.value,
          fileName: p.fileName,
          url: await this.storage.getPresignedUrl(p.objectKey),
        }))
      );

      results.push({
        id: issue.id.value,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        pin: issue.pinLocation.toJSON(),
        photos,
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString(),
      });
    }

    return results;
  }
}
