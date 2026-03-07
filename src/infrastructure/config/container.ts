import { prisma } from "../persistence/prisma-client";
import { PrismaIssueRepository } from "../persistence/repository/prisma-issue-repository";
import { MinioObjectStorage } from "../storage/minio-object-storage";
import { CreateIssueHandler } from "../../application/command/create-issue";
import { TransitionIssueHandler } from "../../application/command/transition-issue";
import { AttachPhotoHandler } from "../../application/command/attach-photo";
import { GetIssuesQueryHandler } from "../../application/query/get-issues";
import { GetIssueByIdQueryHandler } from "../../application/query/get-issue-by-id";

/**
 * ============================================================
 *  Composition Root (簡易DIコンテナ)
 * ============================================================
 *
 * 全ての依存関係をここで組み立てる。
 * Next.js の API Route からはこのモジュール経由でハンドラを取得。
 *
 * 本格的なプロジェクトでは tsyringe / inversify 等の
 * DI コンテナライブラリを使うが、MVP では手動ワイヤリング。
 */

// ─── Adapters (Infrastructure) ──────────────────────────────
const issueRepository = new PrismaIssueRepository(prisma);
const objectStorage = new MinioObjectStorage();

// ─── Command Handlers (Write) ───────────────────────────────
export const createIssueHandler = new CreateIssueHandler(issueRepository);
export const transitionIssueHandler = new TransitionIssueHandler(issueRepository);
export const attachPhotoHandler = new AttachPhotoHandler(
  issueRepository,
  objectStorage
);

// ─── Query Handlers (Read) ──────────────────────────────────
export const getIssuesQuery = new GetIssuesQueryHandler(
  issueRepository,
  objectStorage
);
export const getIssueByIdQuery = new GetIssueByIdQueryHandler(
  issueRepository,
  objectStorage
);
