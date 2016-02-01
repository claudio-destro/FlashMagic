import {InSystemProgramming} from './InSystemProgramming';
import * as ReturnCode from './ReturnCode';
import * as FlashMemory from './FlashMemory';
import {MemoryReader} from './MemoryReader';
import {RAMAddress} from './RAMAddress';
import {RAMWriter} from './RAMWriter';

import * as fs from 'fs';
var dump = require('buffer-hexdump');

const COPY_BIN = readBin('./copy.bin');
const COPY_ORG = RAMAddress.BASE + 0x4000;
const COMMAND_OFFSET = 0x58;

export class InApplicationProgramming {

  private code: Buffer = new Buffer(COPY_BIN);

  constructor(private isp: InSystemProgramming, ...args: number[]) {
    if (args.length !== 4) {
      throw new RangeError(`Illegal arguments`);
    }
    if (args[0] < 50 || args[0] > 57) {
      throw new RangeError(`Illegal command ${args[0]}`);
    }
    args.push(isp.cclk); // XXX

    let i = COMMAND_OFFSET;
    for (let n of args) {
      this.code[i++] = (n >>> 0) & 0xFF;
      this.code[i++] = (n >>> 8) & 0xFF;
      this.code[i++] = (n >>> 16) & 0xFF;
      this.code[i++] = (n >>> 24) & 0xFF;
    }
  }

  uploadCode(): Promise<RAMWriter> {
    let w = new RAMWriter(this.isp);
    w.address = new RAMAddress(COPY_ORG);
    return w.writeToRAM(this.code);
  }

  execute(): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      this.isp.sendCommand(`G ${COPY_ORG} A`)
        .then(() => delay(100))
        .then(() => {
          let r = new MemoryReader(this.isp);
          return r.readFully({ address: COPY_ORG + COMMAND_OFFSET, length: 16 });
        })
        .then(buffer => {
          let rc = ((buffer[0] & 0xFF) << 0)
                 | ((buffer[1] & 0xFF) << 8)
                 | ((buffer[2] & 0xFF) << 16)
                 | ((buffer[3] & 0xFF) << 24);
          ReturnCode.rethrow(rc);
          resolve(buffer);
        })
        .catch(error => reject(error));
    });
  }
}

function readBin(path): Buffer {
  let buffer = fs.readFileSync(path);
  let n = FlashMemory.alignCount(buffer.length);
  let spacer = new Buffer(n - buffer.length);
  spacer.fill(0);
  return Buffer.concat([buffer, spacer]);
}

function delay(time) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, time);
  });
}
