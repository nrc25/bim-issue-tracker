import type {
  Issue as PrismaIssue,
  Photo as PrismaPhoto,
} from "@prisma/client";
import { Issue } from "../../../domain/model/issue";
import { PinLocation, Photo, IssueStatus } from "../../../domain/value-object";

type PrismaIssueWithPhotos = PrismaIssue & { photos: PrismaPhoto[] };

/**
 * ============================================================
 *  IssueMapper
 * ============================================================
 *
 * インフラ層のマッパー。Prisma のレコードとドメインモデルを相互変換。
 * ドメインモデルが Prisma に依存しないようにするための「腐敗防止層」。
 */
export class IssueMapper {
  /**
   * Prisma レコード → ドメインモデル
   */
  static toDomain(record: PrismaIssueWithPhotos): Issue {
    const photos = record.photos.map((p) =>
      Photo.reconstruct(
        p.id,
        p.objectKey,
        p.fileName,
        p.contentType,
        p.uploadedAt
      )
    );

    return Issue.reconstruct({
      id: record.id,
      title: record.title,
      description: record.description,
      status: record.status as IssueStatus,
      pinLocation: PinLocation.reconstruct(
        record.pinX,
        record.pinY,
        record.pinZ,
        record.viewerState ?? undefined
      ),
      photos,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /**
   * ドメインモデル → Prisma の upsert 用データ
   */
  static toPersistence(issue: Issue) {
    return {
      id: issue.id.value,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      pinX: issue.pinLocation.x,
      pinY: issue.pinLocation.y,
      pinZ: issue.pinLocation.z,
      viewerState: issue.pinLocation.viewerState ?? null,
    };
  }

  /**
   * Photo ドメイン → Prisma データ
   */
  static photoToPersistence(photo: Photo, issueId: string) {
    return {
      id: photo.id.value,
      objectKey: photo.objectKey,
      fileName: photo.fileName,
      contentType: photo.contentType,
      issueId,
      uploadedAt: photo.uploadedAt,
    };
  }
}
