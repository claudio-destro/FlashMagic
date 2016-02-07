var Symbol = require('es6-symbol');

import {InSystemProgramming} from './InSystemProgramming';
import * as Utilities from './Utilities';
import {RAMAddress} from './RAMAddress';
import {ROMAddress} from './ROMAddress';
import {UUEncoder} from './UUEncoder';

const _addressSym = Symbol();

export class RAMWriter {

	set address(address: RAMAddress) { this[_addressSym] = address; }
	get address(): RAMAddress { return this[_addressSym]; }

	constructor(private isp: InSystemProgramming) { }

	writeToRAM(buffer: Buffer): Promise<RAMWriter> {
    let ret: Promise<any> = this.isp.sendCommand(`W ${this.address} ${buffer.length}`)
        .then(() => this.uploadChunk(buffer));
    if (process.env['ISP'] === 'legacy') {
      // XXX our custom bootloader sends a CMD_SUCCESS after every write ;(
      ret = ret.then(() => this.isp.assertSuccess());
    }
    return ret.then(() => {
      this.address = this.address.increment(buffer.length);
      return this;
    });
	}

	private uploadChunk(buffer: Buffer): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let uue = new UUEncoder();
			let isp = this.isp;
			let lineCount = 0;
			let index = 0;
			(function loop(): void {
				if (lineCount === Utilities.LINES_PER_UUENCODED_CHUNK || index >= buffer.length) {
					isp.sendLine(uue.checksum.toString()).then(() => {
						uue.reset();
						lineCount = 0;
						return isp.assert('OK');
					}).then(() => {
						if (index < buffer.length) {
							process.nextTick(loop);
						} else {
							resolve();
						}
					}).catch(error => reject(error));
				} else { // if (index < buffer.length) {
					let count = Math.min(Utilities.BYTES_PER_UUENCODED_LINE, buffer.length - index);
					isp.sendLine(uue.encode(buffer, index, count)).then(() => {
						index += count;
						lineCount++;
						process.nextTick(loop);
					}).catch(error => reject(error));
				}
			})();
		});
	}

}
