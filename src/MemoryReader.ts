var Symbol = require('es6-symbol');

import {InSystemProgramming} from './InSystemProgramming';
import {MemoryBlock} from './MemoryBlock';
import {UUDecoder} from './UUDecoder';

const LINES_PER_CHUNK = 20;
const BYTES_PER_LINE = 45;

const _addressSym = Symbol();

export class MemoryReader {

	constructor(private isp: InSystemProgramming) { }

	readFully(block: MemoryBlock): Promise<Buffer> {
    let count = block.length;
		count = (count & 3) === 0 ? count : 4 + (count & ~3);
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
				if (lineCount === LINES_PER_CHUNK || index >= length) {
          isp.assert(uud.checksum.toString())
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
            buffer = Buffer.concat([buffer, b], length);
            index += b.length;
            lineCount++;
            process.nextTick(loop);
					}).catch(error => reject(error));
				}
			})();
		});
	}

}
