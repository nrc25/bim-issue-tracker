import { IssueId } from "../../domain/value-object";
import type { IssueRepository } from "../port/issue-repository";
import type { ObjectStorage } from "../port/object-storage";
import type { IssueReadModel } from "./get-issues";

/**
 * 単一Issueの読み取りクエリ
 */
export class GetIssueByIdQueryHandler {
  constructor(
    private readonly issueRepo: IssueRepository,
    private readonly storage: ObjectStorage
  ) {}

  async execute(id: string): Promise<IssueReadModel | null> {
    const issueId = IssueId.reconstruct(id);
    const issue = await this.issueRepo.findById(issueId);

    if (!issue) return null;

    const photos = await Promise.all(
      issue.photos.map(async (p) => ({
        id: p.id.value,
        fileName: p.fileName,
        url: await this.storage.getPresignedUrl(p.objectKey),
      }))
    );

    return {
      id: issue.id.value,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      pin: issue.pinLocation.toJSON(),
      photos,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
    };
  }
}
