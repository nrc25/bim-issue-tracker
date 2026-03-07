/**
 * オブジェクトストレージの抽象ポート
 * MinIO / S3 / Azure Blob 等の差し替えを可能にする
 */
export interface ObjectStorage {
  /** ファイルをアップロードし、オブジェクトキーを返す */
  upload(params: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<string>;

  /** 一時的な署名付きURLを返す */
  getPresignedUrl(key: string, expiresInSec?: number): Promise<string>;

  /** オブジェクトの削除 */
  delete(key: string): Promise<void>;
}
