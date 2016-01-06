// 'use strict';

// import {InSystemProgramming} from './InSystemProgramming';
// import {FlashMemory} from './FlashMemory';
// import {RAMAddress} from './RAMAddress';
// import {ROMAddress} from './ROMAddress';

// import * as fs from 'fs';

// export class FlashWriter {

// 	private flashAddress: ROMAddress;

// 	constructor(private isp: InSystemProgramming, private bufferAddress: RAMAddress) {
// 	}

// 	set address(address: ROMAddress): void {
// 		this.flashAddress = address;
// 	}

// 	writeToRAM(inp: fs.ReadStream, length: number) {
// 		final RAMWriter loader = new RAMWriter(isp);
// 		loader.setAddress(bufferAddress);
// 		return loader.writeToRAM(in, length);
// 	}

// 	public int copyRAMToFlash(int length) throws IOException {
// 		program(length);
// 		return length;
// 	}

// 	private void program(int count) throws IOException {
// 		long ramAddress = bufferAddress.getAddress();
// 		while (count > 0) {
// 			final int n = alignCount(count);
// 			programChunk(ramAddress, n);
// 			final int incr = Math.min(n, count);
// 			flashAddress = flashAddress.increment(incr);
// 			ramAddress += incr;
// 			count -= incr;
// 		}
// 	}

// 	private void programChunk(long srcAddr, int count) throws IOException {
// 		final long dstAddr = flashAddress.getAddress();
// 		final int startSect = flashAddress.getSector();
// 		final int endSect = FlashMemory.addressToSector(dstAddr + count - 1);
// 		isp.sendUnlockCommand();
// 		isp.sendCommand("P " + startSect + " " + endSect);
// 		isp.sendCommand("C " + dstAddr + " " + srcAddr + " " + count);
// 	}

// 	private static final int alignCount(int count) {
// 		if (count <=  256) return 256;
// 		if (count <=  512) return 512;
// 		if (count <= 1024) return 1024;
// 		return 4096;
// 	}

// }
