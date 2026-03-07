/**
 * APS Viewer 上のピン位置を表す Value Object
 * 3D空間座標 + カメラ視点情報を保持
 */
export class PinLocation {
  private constructor(
    private readonly _x: number,
    private readonly _y: number,
    private readonly _z: number,
    private readonly _viewerState?: string // APS Viewer のカメラ状態JSON
  ) {}

  static create(x: number, y: number, z: number, viewerState?: string): PinLocation {
    return new PinLocation(x, y, z, viewerState);
  }

  static reconstruct(x: number, y: number, z: number, viewerState?: string): PinLocation {
    return new PinLocation(x, y, z, viewerState);
  }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get z(): number { return this._z; }
  get viewerState(): string | undefined { return this._viewerState; }

  toJSON(): { x: number; y: number; z: number; viewerState?: string } {
    return {
      x: this._x,
      y: this._y,
      z: this._z,
      ...(this._viewerState ? { viewerState: this._viewerState } : {}),
    };
  }

  equals(other: PinLocation): boolean {
    return this._x === other._x && this._y === other._y && this._z === other._z;
  }
}
