'use strict';
var Symbol = require('es6-symbol');

import {InSystemProgramming} from './InSystemProgramming';
import {FlashMemory} from './FlashMemory';
import {RAMAddress} from './RAMAddress';
import {ROMAddress} from './ROMAddress';
import {UUEncoder} from './UUEncoder';

import {EventEmitter} from 'events';
import * as assert from 'assert';
import * as stream from 'stream';

const _addressSym = Symbol();

function toBuffer(data: Buffer | String): Buffer {
	return Buffer.isBuffer(data) ? <Buffer>data : new Buffer(<string>data, 'binary');
}

class Progress extends EventEmitter {}

function nextTick(cb: Function): void { process.nextTick(cb); } // setTimeout;

export class RAMWriter {

	static get LINES_PER_CHUNK() { return 20; }
	static get BYTES_PER_LINE() { return 45; }

	static alignCount(count: number): number {
		count = ~~count;
		if ((count & 3) === 0) {
			return count;
		}
		return 4 + (count & ~3);
	}

	constructor(private isp: InSystemProgramming) {	}

	set address(address: RAMAddress) { this[_addressSym] = address; }
	get address(): RAMAddress { return this[_addressSym]; }

	writeBuffer(buffer: Buffer): Promise<void> {
		assert((buffer.length & 3) === 0);
		assert(this.address.address > (RAMAddress.BASE + 1024));
		return this.isp.sendCommand(`W ${this.address} ${buffer.length}`)
			.then(() => {
				return this.uploadChunk(buffer);
			}).then(() => {
				return this.isp.assertSuccess();
			}).then(() => {
				this[_addressSym] = this.address.increment(buffer.length);
			});
	}

	private uploadChunk(buffer: Buffer): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let uue = new UUEncoder();
			let isp = this.isp;
			let lineCount = 0;
			let index = 0;
			(function loop() {
				if (lineCount === RAMWriter.LINES_PER_CHUNK || index >= buffer.length) {
					isp.sendLine(uue.checksum.toString()).then(() => {
						uue.reset();
						lineCount = 0;
						return isp.assertOK();
					}).then(() => {
						if (index < buffer.length) {
							nextTick(loop);
						} else {
							resolve();
						}
					}).catch((error) => {
						reject(error);
					});
				} else { // if (index < buffer.length) {
					let count = Math.min(RAMWriter.BYTES_PER_LINE, buffer.length - index);
					isp.sendLine(uue.encode(buffer, index, count)).then(() => {
						index += count;
						lineCount++;
						nextTick(loop);
					}).catch((error) => {
						reject(error);
					});
				}
			})();
		});
	}

	writeFile(readable: stream.Readable, chunkSize: number = 1024): EventEmitter {

		const writer: RAMWriter = this;
		const em: EventEmitter = new Progress;

		const buffer = new Buffer(RAMWriter.alignCount(chunkSize));
		let offset = 0;
		buffer.fill(0);

		readable.on('open', () => em.emit('start'));

		readable.on('data', (data: Buffer | String) => {
			let chunk = toBuffer(data);
			readable.pause();

			function proceed(): void {
				if (chunk.length) {
					nextTick(execute);
				} else {
					readable.resume();
				}
			}

			let execute = () => {
				let written = Math.min(buffer.length - offset, chunk.length);
				chunk.copy(buffer, offset, 0, written);
				offset += written;
				chunk = chunk.slice(written);
				if (offset === buffer.length) {
					offset = 0;
					buffer.fill(0);
					em.emit('chunk', buffer);
					writer.writeBuffer(buffer)
						.then(proceed)
						.catch(error => em.emit('error', error));
				} else {
					proceed();
				}
			}

			execute(); // start
		});

		readable.on('end', () => {
			if (offset) {
				em.emit('chunk', buffer.slice(0, offset));
				writer.writeBuffer(buffer)
					.then(() => em.emit('end'))
					.catch(error => em.emit('error', error));
			}
		});

		return em;
	}

}
