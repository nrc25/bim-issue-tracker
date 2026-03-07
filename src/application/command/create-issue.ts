import { Issue } from "../../domain/model/issue";
import { PinLocation } from "../../domain/value-object";
import type { IssueRepository } from "../port/issue-repository";

// ─── Command DTO ────────────────────────────────────────────
export interface CreateIssueCommand {
  title: string;
  description: string;
  pinX: number;
  pinY: number;
  pinZ: number;
  viewerState?: string;
}

// ─── Result DTO ─────────────────────────────────────────────
export interface CreateIssueResult {
  id: string;
  status: string;
  createdAt: string;
}

/**
 * ============================================================
 *  CreateIssueHandler (Command Handler)
 * ============================================================
 *
 * CQRS の Write 側。ドメインモデルを生成し永続化する。
 * - 入力は DTO (CreateIssueCommand) で受け取る
 * - ドメインオブジェクトの生成はファクトリ経由
 * - Repository はポート経由で注入（DI）
 */
export class CreateIssueHandler {
  constructor(private readonly issueRepo: IssueRepository) {}

  async execute(cmd: CreateIssueCommand): Promise<CreateIssueResult> {
    const pinLocation = PinLocation.create(
      cmd.pinX,
      cmd.pinY,
      cmd.pinZ,
      cmd.viewerState
    );

    const issue = Issue.create({
      title: cmd.title,
      description: cmd.description,
      pinLocation,
    });

    await this.issueRepo.save(issue);

    // ドメインイベントの発行（将来はイベントバスに委譲）
    issue.clearEvents();

    return {
      id: issue.id.value,
      status: issue.status,
      createdAt: issue.createdAt.toISOString(),
    };
  }
}
