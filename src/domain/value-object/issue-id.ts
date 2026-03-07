import { randomUUID } from "crypto";

/**
 * Issue の識別子を表す Value Object
 * 不変であり、等価性はIDの値で判定する
 */
export class IssueId {
  private constructor(private readonly _value: string) {
    if (!_value || _value.trim().length === 0) {
      throw new Error("IssueId cannot be empty");
    }
  }

  static generate(): IssueId {
    return new IssueId(randomUUID());
  }

  static reconstruct(value: string): IssueId {
    return new IssueId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: IssueId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
