var Symbol = require('es6-symbol');

const _checksumSym = Symbol();

export class UUDecoder {

  constructor() {
    this[_checksumSym] = 0;
  }

  get checksum(): number {
    return this[_checksumSym];
  }

  reset(): void {
    this[_checksumSym] = 0;
  }

  decode(data: string): Buffer {
    let length = decodeSingle(data.charCodeAt(0));
    let out = new Buffer(length);
    let sum = 0;
    length -= 3;
    let i = 0, j = 1;
    while (i < length) {
      let a = data.charCodeAt(j++);
      let b = data.charCodeAt(j++);
      let c = data.charCodeAt(j++);
      let d = data.charCodeAt(j++);
      let [x, y, z] = decodeQuad(a, b, c, d);
      sum += x + y + z;
      out[i++] = x;
      out[i++] = y;
      out[i++] = z;
    }
    if (i < out.length) {
      let a = data.charCodeAt(j++);
      let b = data.charCodeAt(j++);
      let c = data.charCodeAt(j++);
      let d = data.charCodeAt(j++);
      let [x, y, z] = decodeQuad(a, b, c, d);
      sum += x;
      out[i++] = x;
      if (i < out.length) {
        sum += y;
        out[i++] = y;
        if (i < out.length) {
          sum += z;
          out[i++] = z;
        }
      }
    }
    this[_checksumSym] += sum;
    return out;
  }

}

function decodeSingle(c: number): number {
  return c === 0x60 ? 0 : (c - 32);
}

function decodeQuad(a: number, b: number, c: number, d: number): number[] {
  a = decodeSingle(a);
  b = decodeSingle(b);
  c = decodeSingle(c);
  d = decodeSingle(d);
  return [((a & 0x3F) << 2) | ((b & 0x30) >>> 4),
    ((b & 0x0F) << 4) | ((c & 0x3C) >>> 2),
    ((c & 0x03) << 6) | (d & 0x3F)];
}
