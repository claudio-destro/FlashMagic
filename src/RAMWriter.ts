var Symbol = require('es6-symbol');

import {InSystemProgramming} from './InSystemProgramming';
import * as FlashMemory from './FlashMemory';
import {RAMAddress} from './RAMAddress';
import {ROMAddress} from './ROMAddress';
import {UUEncoder} from './UUEncoder';

const LINES_PER_CHUNK = 20;
const BYTES_PER_LINE = 45;

const _addressSym = Symbol();

export class RAMWriter {

	set address(address: RAMAddress) { this[_addressSym] = address; }
	get address(): RAMAddress { return this[_addressSym]; }

	constructor(private isp: InSystemProgramming) { }

	writeToRAM(buffer: Buffer): Promise<RAMWriter> {
		return this.isp.sendCommand(`W ${this.address} ${buffer.length}`)
			.then(() => {
				return this.uploadChunk(buffer);
			}).then(() => {
				return this.isp.assertSuccess();
			}).then(() => {
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
				if (lineCount === LINES_PER_CHUNK || index >= buffer.length) {
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
					let count = Math.min(BYTES_PER_LINE, buffer.length - index);
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
