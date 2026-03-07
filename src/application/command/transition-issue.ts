import { IssueId, IssueStatus } from "../../domain/value-object";
import type { IssueRepository } from "../port/issue-repository";

export interface TransitionIssueCommand {
  issueId: string;
  toStatus: IssueStatus;
}

export interface TransitionIssueResult {
  id: string;
  fromStatus: string;
  toStatus: string;
  updatedAt: string;
}

/**
 * ステータス遷移コマンドハンドラ
 * ドメインモデルの transition() に委譲し、ビジネスルールを保護する
 */
export class TransitionIssueHandler {
  constructor(private readonly issueRepo: IssueRepository) {}

  async execute(cmd: TransitionIssueCommand): Promise<TransitionIssueResult> {
    const issueId = IssueId.reconstruct(cmd.issueId);
    const issue = await this.issueRepo.findById(issueId);

    if (!issue) {
      throw new Error(`Issue not found: ${cmd.issueId}`);
    }

    const fromStatus = issue.status;
    issue.transition(cmd.toStatus);

    await this.issueRepo.save(issue);
    issue.clearEvents();

    return {
      id: issue.id.value,
      fromStatus,
      toStatus: issue.status,
      updatedAt: issue.updatedAt.toISOString(),
    };
  }
}
