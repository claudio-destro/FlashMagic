var Symbol = require('es6-symbol');

import {InSystemProgramming} from './InSystemProgramming';
import * as Utilities from './Utilities';
import {MemoryBlock} from './MemoryBlock';
import {UUDecoder} from './UUDecoder';

const _addressSym = Symbol();

export class MemoryReader {

  constructor(private isp: InSystemProgramming) { }

  readFully(block: MemoryBlock): Promise<Buffer> {
    let count = Utilities.alignCount(block.length);
    return this.isp.sendCommand(`R ${block.address} ${count}`)
      .then(() => this.downloadChunk(block.length));
  }

  private downloadChunk(length: number): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      let uud = new UUDecoder();
      let isp = this.isp;
      let lineCount = 0;
      let index = 0;
      let buffer = new Buffer(0);
      (function loop(): void {
        if (lineCount === Utilities.LINES_PER_UUENCODED_CHUNK || index >= length) {
          isp.assert(new RegExp(uud.checksum.toString()))
            .then(() => isp.sendLine('OK')) // ack
            .then(() => {
              uud.reset();
              lineCount = 0;
              if (index < length) {
                process.nextTick(loop);
              } else {
                resolve(buffer);
              }
            }).catch(error => reject(error));
        } else { // if (index < buffer.length) {
          isp.read().then(data => {
            let b = uud.decode(data);
            buffer = Buffer.concat([buffer, b], buffer.length + b.length);
            index += b.length;
            lineCount++;
            process.nextTick(loop);
          }).catch(error => reject(error));
        }
      })();
    });
  }

}
