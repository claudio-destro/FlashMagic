'use strict';

import {InSystemProgramming} from './InSystemProgramming';
import * as FlashMemory from './FlashMemory';
import {RAMAddress} from './RAMAddress';
import {ROMBlock} from './ROMBlock';
import {RAMWriter} from './RAMWriter';
import {ROMWriter} from './ROMWriter';

import {EventEmitter} from 'events';
import * as assert from 'assert';
import * as stream from 'stream';

function toBuffer(data: Buffer | String): Buffer {
	return Buffer.isBuffer(data) ? <Buffer>data : new Buffer(<string>data, 'binary');
}

export class LPCProgrammer extends EventEmitter {

	private uploader: RAMWriter;
	private writer: ROMWriter;

	constructor(private isp: InSystemProgramming,
		private destAddr: number,
		private length: number,
		private srcAddr: number = RAMAddress.BASE + 1024 * 10,
		private chunkSize: number = 1024 * 1) {
		super();
		this.uploader = new RAMWriter(isp);
		this.writer = new ROMWriter(isp, destAddr, length);
	}

	program(readable: stream.Readable): LPCProgrammer {
		this.writer.eraseBlock().then(() => this.doProgram(readable));
		return this;
	}

	private doProgram(readable: stream.Readable): void {

		const buffer = new Buffer(this.chunkSize);
		let offset: number;
		let ended: boolean = false;

		let resetBuffer = (): void => {
			offset = 0;
			buffer.fill(0);
			this.uploader.address = new RAMAddress(this.srcAddr);
		};
		resetBuffer();

		let finish = (): void => {
			if (offset) {
				this.emit('chunk', buffer.slice(0, offset));
				this.programBuffer(buffer)
					.then(() => this.emit('end'))
					.catch(error => this.emit('error', error));
			} else {
				this.emit('end');
			}
		};

		readable.on('open', () => this.emit('start'));
		readable.on('error', () => this.emit('error'));

		readable.on('end', () => {
			ended = readable['isPaused'](); // tsd not yet updated
			if (!ended) { // not paused
				finish();
			}
		});

		readable.on('data', (data: Buffer | String) => {
			let chunk = toBuffer(data);
			readable.pause();

			function next(): void {
				if (chunk.length) {
					process.nextTick(loop);
				} else if (ended) {
					finish();
				} else {
					readable.resume();
				}
			}

			let loop = (): void => {
				let written = Math.min(buffer.length - offset, chunk.length);
				chunk.copy(buffer, offset, 0, written);
				offset += written;
				chunk = chunk.slice(written);
				if (offset === buffer.length) {
					this.emit('chunk', buffer);
					this.programBuffer(buffer)
						.then(resetBuffer)
						.then(next)
						.catch(error => this.emit('error', error));
				} else {
					next();
				}
			};

			loop();
		});
	}

	private programBuffer(buffer: Buffer): Promise<void> {
		let ramAddr = this.uploader.address;
		return this.uploader.uploadBuffer(buffer)
			.then(() => {
				return this.writer.copyBlock(ramAddr, buffer.length);
			});
	}
}
