/// <reference path="../typings/index.d.ts" />
import {UUDecoder} from '../lib/UUDecoder';
import * as assert from 'assert';

// http://www.opensource.apple.com/source/tcl/tcl-20/tcl_ext/tcllib/tcllib/modules/base64/uuencode.test

describe('UUDecoder', () => {
  var decoder = new UUDecoder();

  beforeEach(function () {
    decoder.reset();
  });

  describe('uudecode', () => {

    function decode(data: string, expected: string, addLength: boolean): string {
      if (addLength) data = String.fromCharCode(expected.length + 32) + data;
      let output = decoder.decode(data).toString('utf8');
      assert.equal(output, expected);
      return output;
    }

    it(`should decode "ABC"`, () => { decode('04)#', 'ABC', true); });
    it(`should decode "x" x 102`, () => {
      let inp = ''; for (let i = 0; i < 102; i++, inp += 'x');
      let out = ''; for (let i = 0; i < 34; i++, out += `>'AX`);
      decode(out, inp, true);
    });
    it(`should decode "The cat sat on the mat."`, () => {
      decode('75&AE(&-A="!S870@;VX@=&AE(&UA="X`', 'The cat sat on the mat.', false);
    });
    it(`should decode "5BC"`, () => {
      decode('-4)#', '5BC', true);
    });
  });

});
