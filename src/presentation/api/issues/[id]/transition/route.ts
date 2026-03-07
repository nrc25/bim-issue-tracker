import { NextRequest, NextResponse } from "next/server";
import { transitionIssueHandler } from "../../../../../infrastructure/config/container";
import { IssueStatus, InvalidStatusTransitionError } from "../../../../../domain/value-object";

type Params = { params: { id: string } };

/**
 * POST /api/issues/:id/transition — ステータス遷移 (Command / Write)
 *
 * ドメイン層の状態遷移ルールに違反した場合は 422 を返す。
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();

    if (!body.toStatus) {
      return NextResponse.json(
        { error: "toStatus is required" },
        { status: 400 }
      );
    }

    const validStatuses = Object.values(IssueStatus);
    if (!validStatuses.includes(body.toStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await transitionIssueHandler.execute({
      issueId: params.id,
      toStatus: body.toStatus as IssueStatus,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof InvalidStatusTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error(`POST /api/issues/${params.id}/transition failed:`, error);
    const message =
      error instanceof Error ? error.message : "Transition failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
