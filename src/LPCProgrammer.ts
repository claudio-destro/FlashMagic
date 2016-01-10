'use strict';

import {InSystemProgramming} from './InSystemProgramming';
import * as FlashMemory from './FlashMemory';
import {RAMAddress} from './RAMAddress';
import {ROMAddress} from './ROMAddress';
import {RAMWriter} from './RAMWriter';
import {ROMWriter} from './ROMWriter';

import {EventEmitter} from 'events';
import * as assert from 'assert';
import * as stream from 'stream';

class Progress extends EventEmitter { }

function toBuffer(data: Buffer | String): Buffer {
	return Buffer.isBuffer(data) ? <Buffer>data : new Buffer(<string>data, 'binary');
}

export class LPCProgrammer {

	private uploader: RAMWriter;
	private flasher: ROMWriter;

	constructor(private isp: InSystemProgramming,
				private destAddr: number,
				private srcAddr: number = RAMAddress.BASE + 1024 * 10,
				private chunkSize: number = 1024 * 1) {
		this.uploader = new RAMWriter(isp);
		this.flasher = new ROMWriter(isp);
		this.flasher.romAddress = ROMAddress.fromAddress(destAddr);
	}

	writeFile(readable: stream.Readable): EventEmitter {

		const em: EventEmitter = new Progress;
		const buffer = new Buffer(this.chunkSize);
		let offset;
		let ended: boolean = false;

		let resetBuffer = () => {
			offset = 0;
			buffer.fill(0);
			this.uploader.ramAddress = new RAMAddress(this.srcAddr);
		};
		resetBuffer();

		readable.on('open', () => em.emit('start'));
		readable.on('error', () => em.emit('error'));
		readable.on('end', () => ended = true);

		readable.on('data', (data: Buffer | String) => {
			let chunk = toBuffer(data);
			readable.pause();

			let proceed = (): void => {
				console.log('CHI T\' MURRT', ended, offset, chunk.length);
				if (ended) {
					if (offset) {
						em.emit('chunk', buffer.slice(0, offset));
						this.programBuffer(buffer)
							.then(() => em.emit('end'))
							.catch(error => em.emit('error', error));
					} else {
						em.emit('end');
					}
				} else if (chunk.length) {
					process.nextTick(execute);
				} else {
					readable.resume();
				}
			}

			let execute = (): void => {
				let written = Math.min(buffer.length - offset, chunk.length);
				chunk.copy(buffer, offset, 0, written);
				offset += written;
				chunk = chunk.slice(written);
				if (offset === buffer.length) {
					em.emit('chunk', buffer);
					this.programBuffer(buffer)
						.then(resetBuffer)
						.then(proceed)
						.catch(error => em.emit('error', error));
				} else {
					proceed();
				}
			};
			execute(); // start
		});

		return em;
	}

	private programBuffer(buffer: Buffer): Promise<void> {
		let ramAddr = this.uploader.ramAddress;
		return this.uploader.writeBuffer(buffer)
			.then(() => {
				return this.flasher.copyBlock(ramAddr, buffer.length);
			});
	}
}
