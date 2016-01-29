var Symbol = require('es6-symbol');

const _checksumSym = Symbol();

export class UUEncoder {

  constructor() {
    this[_checksumSym] = 0;
  }

  get checksum(): number {
    return this[_checksumSym];
  }

  reset(): void {
    this[_checksumSym] = 0;
  }

  encode(data: Buffer | Uint8Array, offset: number, length: number): string {
    let out = encodeSingle(length);
    let sum = 0;
    const n = ~~(length / 3) * 3;
    const m = n + offset;
    let i = offset;
    while (i < m) {
      let a = data[i++];
      let b = data[i++];
      let c = data[i++];
      out += encodeTriple(a, b, c);
      sum += a + b + c;
    }
    if (n < length) {
      let a = data[i++];
      let b = (n + 1 < length) ? data[i] : 0;
      out += encodeTriple(a, b, 0);
      sum += a + b;
    }
    this[_checksumSym] += sum;
    return out;
  }

}

function encodeSingle(b: number): string {
  return String.fromCharCode(b ? (b + 32) : 0x60);
}

function encodeTriple(a: number, b: number, c: number): string {
  return encodeSingle((a >>> 2) & 0x3F) +
    encodeSingle(((a << 4) & 0x30) | ((b >>> 4) & 0x0F)) +
    encodeSingle(((b << 2) & 0x3C) | ((c >>> 6) & 0x03)) +
    encodeSingle(c & 0x3F);
}
