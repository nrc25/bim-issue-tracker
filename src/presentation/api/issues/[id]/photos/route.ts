import { NextRequest, NextResponse } from "next/server";
import { attachPhotoHandler } from "../../../../../infrastructure/config/container";

type Params = { params: { id: string } };

/**
 * POST /api/issues/:id/photos — 写真アップロード (Command / Write)
 *
 * multipart/form-data で受け取り、MinIO に保存後 Issue に添付。
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "file is required in form data" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await attachPhotoHandler.execute({
      issueId: params.id,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      body: buffer,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(`POST /api/issues/${params.id}/photos failed:`, error);
    const message =
      error instanceof Error ? error.message : "Photo upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
