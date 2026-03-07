import { NextRequest, NextResponse } from "next/server";
import { getIssueByIdQuery } from "../../../../../infrastructure/config/container";

type Params = { params: { id: string } };

/**
 * GET /api/issues/:id — 指摘詳細 (Query / Read)
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const issue = await getIssueByIdQuery.execute(params.id);

    if (!issue) {
      return NextResponse.json(
        { error: "Issue not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(issue, { status: 200 });
  } catch (error) {
    console.error(`GET /api/issues/${params.id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to fetch issue" },
      { status: 500 }
    );
  }
}
