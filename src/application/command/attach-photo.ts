import { IssueId } from "../../domain/value-object";
import { Photo } from "../../domain/value-object";
import type { IssueRepository } from "../port/issue-repository";
import type { ObjectStorage } from "../port/object-storage";

export interface AttachPhotoCommand {
  issueId: string;
  fileName: string;
  contentType: string;
  body: Buffer;
}

export interface AttachPhotoResult {
  photoId: string;
  objectKey: string;
  presignedUrl: string;
}

/**
 * 写真アップロード → MinIO保存 → Issue集約に添付
 */
export class AttachPhotoHandler {
  constructor(
    private readonly issueRepo: IssueRepository,
    private readonly storage: ObjectStorage
  ) {}

  async execute(cmd: AttachPhotoCommand): Promise<AttachPhotoResult> {
    const issueId = IssueId.reconstruct(cmd.issueId);
    const issue = await this.issueRepo.findById(issueId);

    if (!issue) {
      throw new Error(`Issue not found: ${cmd.issueId}`);
    }

    // MinIO にアップロード
    const objectKey = `issues/${cmd.issueId}/${Date.now()}_${cmd.fileName}`;
    await this.storage.upload({
      key: objectKey,
      body: cmd.body,
      contentType: cmd.contentType,
    });

    // ドメインモデルに写真を添付
    const photo = Photo.create(objectKey, cmd.fileName, cmd.contentType);
    issue.attachPhoto(photo);

    await this.issueRepo.save(issue);
    issue.clearEvents();

    const presignedUrl = await this.storage.getPresignedUrl(objectKey);

    return {
      photoId: photo.id.value,
      objectKey,
      presignedUrl,
    };
  }
}
