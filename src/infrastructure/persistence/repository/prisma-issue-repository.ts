import type { PrismaClient } from "@prisma/client";
import type { IssueRepository } from "../../../application/port/issue-repository";
import type { Issue } from "../../../domain/model/issue";
import type { IssueId } from "../../../domain/value-object";
import { IssueMapper } from "../mapper/issue-mapper";

/**
 * ============================================================
 *  PrismaIssueRepository
 * ============================================================
 *
 * IssueRepository ポートの具象実装（Adapter）。
 * Prisma ORM を通じて PostgreSQL に永続化する。
 *
 * ドメイン層・アプリケーション層はこの実装を知らない。
 * 将来 Drizzle や TypeORM に差し替えても上位層は不変。
 */
export class PrismaIssueRepository implements IssueRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(issue: Issue): Promise<void> {
    const data = IssueMapper.toPersistence(issue);

    await this.prisma.$transaction(async (tx) => {
      // Issue 本体の upsert
      await tx.issue.upsert({
        where: { id: data.id },
        create: data,
        update: {
          title: data.title,
          description: data.description,
          status: data.status,
          pinX: data.pinX,
          pinY: data.pinY,
          pinZ: data.pinZ,
          viewerState: data.viewerState,
        },
      });

      // 写真の同期（新規追加分のみ createMany）
      const existingPhotos = await tx.photo.findMany({
        where: { issueId: data.id },
        select: { id: true },
      });
      const existingIds = new Set(existingPhotos.map((p) => p.id));

      const newPhotos = issue.photos
        .filter((p) => !existingIds.has(p.id.value))
        .map((p) => IssueMapper.photoToPersistence(p, data.id));

      if (newPhotos.length > 0) {
        await tx.photo.createMany({ data: newPhotos });
      }
    });
  }

  async findById(id: IssueId): Promise<Issue | null> {
    const record = await this.prisma.issue.findUnique({
      where: { id: id.value },
      include: { photos: true },
    });

    if (!record) return null;
    return IssueMapper.toDomain(record);
  }

  async findAll(): Promise<Issue[]> {
    const records = await this.prisma.issue.findMany({
      include: { photos: true },
      orderBy: { createdAt: "desc" },
    });

    return records.map(IssueMapper.toDomain);
  }

  async delete(id: IssueId): Promise<void> {
    await this.prisma.issue.delete({ where: { id: id.value } });
  }
}
