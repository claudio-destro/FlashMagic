/// <reference path="../typings/index.d.ts" />
import {UUEncoder} from '../lib/UUEncoder';
import * as assert from 'assert';

// http://www.opensource.apple.com/source/tcl/tcl-20/tcl_ext/tcllib/tcllib/modules/base64/uuencode.test

describe('UUEncoder', () => {
  var encoder = new UUEncoder();

  beforeEach(function() {
    encoder.reset();
  });

  describe('uuencode', () => {

    function encode(data: string, expected: string, dropLength: boolean = false): string {
      let input = new Buffer(data);
      let output = encoder.encode(input, 0, input.length);
      assert.equal(output.slice(dropLength ? 1 : 0), expected);
      return output;
    }

    it(`should encode "ABC"`, () => { encode('ABC', '04)#', true); });
    it(`should encode "x" x 102`, () => {
      let inp = ''; for (let i = 0; i < 102; i++, inp += 'x');
      let out = ''; for (let i = 0; i < 34; i++, out += `>'AX`);
      encode(inp, out, true);
    });
    it(`should encode "The cat sat on the mat."`, () => {
      encode('The cat sat on the mat.', '75&AE(&-A="!S870@;VX@=&AE(&UA="X`');
    });
    it(`should encode "-BC"`, () => {
      encode('-BC', '+4)#', true);
    });
  });

});
