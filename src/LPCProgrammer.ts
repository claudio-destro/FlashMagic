'use strict';

import {InSystemProgramming} from './InSystemProgramming';
import {FlashMemory} from './FlashMemory';
import {RAMAddress} from './RAMAddress';
import {ROMAddress} from './ROMAddress';

import * as fs from 'fs';

export class LPCProgrammer {

	private flashAddress: ROMAddress;
	private bufferAddress: RAMAddress;
	private bufferSize: number;

	constructor(private isp: InSystemProgramming,
				dst: number,
				src: number = RAMAddress.BASE + 1024 * 10,
				len: number = 1024 * 1) {
		this.flashAddress = ROMAddress.fromAddress(dst);
		this.bufferAddress = new RAMAddress(src);
		this.bufferSize = ~~len;
	}

	program(inp: fs.ReadStream, count: number): Promise<void> {
		return null;
	}

	eraseBlock(count: number): Promise<void> {
		let dstAddr = this.flashAddress.address;
		let startSect = this.flashAddress.sector;
		let endSect = FlashMemory.addressToSector(dstAddr + count - 1);
		return this.isp.sendUnlockCommand()
			.then(() => {
				return this.isp.sendLine(`P ${startSect} ${endSect}`);
			}).then(() => {
				return this.isp.sendLine(`E ${startSect} ${endSect}`);
			});
	}

// 	public void program(InputStream in, int count) throws IOException {
// 		final FlashWriter writer = new FlashWriter(isp, bufferAddress);
// 		writer.setAddress(flashAddress);
// 		eraseBlock(count);
// 		while (count > 0) {
// 			final int chunkSize = Math.min(bufferSize, count);
// 			final int written = writer.writeToRAM(in, chunkSize);
// 			count -= writer.copyRAMToFlash(written);
// 		}
// 	}

}
