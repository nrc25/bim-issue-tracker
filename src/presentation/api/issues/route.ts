import { NextRequest, NextResponse } from "next/server";
import {
  createIssueHandler,
  getIssuesQuery,
} from "../../../infrastructure/config/container";
import type { CreateIssueCommand } from "../../../application/command/create-issue";

/**
 * GET /api/issues — 指摘一覧 (Query / Read)
 *
 * CQRS の Read 側。Query Handler 経由で DTO を返す。
 * ドメインモデルは API レスポンスに直接露出しない。
 */
export async function GET() {
  try {
    const issues = await getIssuesQuery.execute();
    return NextResponse.json(issues, { status: 200 });
  } catch (error) {
    console.error("GET /api/issues failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/issues — 指摘新規作成 (Command / Write)
 *
 * CQRS の Write 側。Command Handler にコマンド DTO を渡す。
 * バリデーションは Presentation 層で最低限のスキーマチェック、
 * ビジネスルールはドメイン層で検証。
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Presentation層バリデーション（形式チェック）
    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }
    if (body.pinX == null || body.pinY == null || body.pinZ == null) {
      return NextResponse.json(
        { error: "pin coordinates (pinX, pinY, pinZ) are required" },
        { status: 400 }
      );
    }

    const command: CreateIssueCommand = {
      title: body.title,
      description: body.description ?? "",
      pinX: Number(body.pinX),
      pinY: Number(body.pinY),
      pinZ: Number(body.pinZ),
      viewerState: body.viewerState,
    };

    const result = await createIssueHandler.execute(command);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/issues failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create issue";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
