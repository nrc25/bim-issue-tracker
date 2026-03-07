import { Client } from "minio";
import type { ObjectStorage } from "../../application/port/object-storage";

const BUCKET_NAME = process.env.MINIO_BUCKET ?? "issue-photos";

/**
 * MinIO を用いた ObjectStorage ポートの具象実装
 */
export class MinioObjectStorage implements ObjectStorage {
  private client: Client;

  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
      port: Number(process.env.MINIO_PORT ?? 9000),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
    });
  }

  async upload(params: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<string> {
    // バケットが存在しなければ作成
    const exists = await this.client.bucketExists(BUCKET_NAME);
    if (!exists) {
      await this.client.makeBucket(BUCKET_NAME, "us-east-1");
    }

    await this.client.putObject(
      BUCKET_NAME,
      params.key,
      params.body,
      params.body.length,
      { "Content-Type": params.contentType }
    );

    return params.key;
  }

  async getPresignedUrl(
    key: string,
    expiresInSec: number = 3600
  ): Promise<string> {
    return this.client.presignedGetObject(BUCKET_NAME, key, expiresInSec);
  }

  async delete(key: string): Promise<void> {
    await this.client.removeObject(BUCKET_NAME, key);
  }
}
