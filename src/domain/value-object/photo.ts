import { randomUUID } from "crypto";

/**
 * 写真を表す Value Object（Issueに従属するエンティティ）
 * MinIO上のオブジェクトキーと表示名を保持
 */
export class PhotoId {
  private constructor(private readonly _value: string) {}

  static generate(): PhotoId {
    return new PhotoId(randomUUID());
  }

  static reconstruct(value: string): PhotoId {
    return new PhotoId(value);
  }

  get value(): string { return this._value; }
  equals(other: PhotoId): boolean { return this._value === other._value; }
}

export class Photo {
  private constructor(
    private readonly _id: PhotoId,
    private readonly _objectKey: string,
    private readonly _fileName: string,
    private readonly _contentType: string,
    private readonly _uploadedAt: Date
  ) {}

  static create(objectKey: string, fileName: string, contentType: string): Photo {
    return new Photo(
      PhotoId.generate(),
      objectKey,
      fileName,
      contentType,
      new Date()
    );
  }

  static reconstruct(
    id: string,
    objectKey: string,
    fileName: string,
    contentType: string,
    uploadedAt: Date
  ): Photo {
    return new Photo(
      PhotoId.reconstruct(id),
      objectKey,
      fileName,
      contentType,
      uploadedAt
    );
  }

  get id(): PhotoId { return this._id; }
  get objectKey(): string { return this._objectKey; }
  get fileName(): string { return this._fileName; }
  get contentType(): string { return this._contentType; }
  get uploadedAt(): Date { return this._uploadedAt; }
}
