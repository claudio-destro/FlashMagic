/// <reference path="../typings/index.d.ts" />
import {validateVectorTable} from '../lib/UserCode';
import * as assert from 'assert';

describe('UserCode', () => {
  var buffer = new Buffer(64);

  beforeEach(() => {
    buffer.fill(0);
  });

  function getUInt32At(pos: number): number {
    let n = (buffer[pos + 0] << 0) | (buffer[pos + 1] << 8) | (buffer[pos + 2] << 16) | (buffer[pos + 3] << 24);
    return n >>> 0; // to UInt32
  }

  function setUInt32At(pos: number, num: number): void {
    buffer[pos + 0] = (num >>> 0) & 0xFF;
    buffer[pos + 1] = (num >>> 8) & 0xFF;
    buffer[pos + 2] = (num >>> 16) & 0xFF;
    buffer[pos + 3] = (num >>> 24) & 0xFF;
  }

  describe('validateVectorTable', () => {
    it(`should validate 0`, () => {
      validateVectorTable(buffer, 0x14);
      assert.equal(0, getUInt32At(0x14));
    });

    it(`should validate 0`, () => {
      setUInt32At(0x14, 0x01020304);
      validateVectorTable(buffer, 0x14);
      let buf = new Buffer(64);
      buf.fill(0);
      assert.ok(buf.equals(buffer));
    });

    it(`should validate 0x01020304`, () => {
      setUInt32At(0, 0x01020304);
      validateVectorTable(buffer, 0x14);
      assert.equal(0xFEFDFCFC, getUInt32At(0x14));
    });

    it(`should validate first 32 bytes only`, () => {
      setUInt32At(4, 0x01020304);
      setUInt32At(32, 0x05060708);
      validateVectorTable(buffer, 0x14);
      assert.equal(0xFEFDFCFC, getUInt32At(0x14));
    });

  });

});
