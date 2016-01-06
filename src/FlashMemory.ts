'use strict';

const SECTOR_ADDRESS = new Uint32Array([
	// 4KB [0...7]
	0x00000000, 0x00001000, 0x00002000, 0x00003000,
	0x00004000, 0x00005000, 0x00006000, 0x00007000,
	// 32KB [8...21]
	0x00008000, 0x00010000, 0x00018000, 0x00020000,
	0x00028000, 0x00030000, 0x00038000, 0x00040000,
	0x00048000, 0x00050000, 0x00058000, 0x00060000,
	0x00068000, 0x00070000,
	// 4KB [22..27]
	0x00078000, 0x00079000, 0x0007A000, 0x0007B000,
	0x0007C000, 0x0007D000,
	// EOF - 28th sector - Boot
	0x0007E000
]);

const MIN_SECTOR = 2;
const MAX_SECTOR = SECTOR_ADDRESS.length - 2;

export class FlashMemory {

	static get MIN_ADDRESS() { return SECTOR_ADDRESS[MIN_SECTOR]; }
	static get MAX_ADDRESS() { return SECTOR_ADDRESS[MAX_SECTOR + 1] - 1; }

	static get MIN_SECTOR() { return MIN_SECTOR; }
	static get MAX_SECTOR() { return MAX_SECTOR; }

	static addressToSector(addr: number): number {
		if (addr >= FlashMemory.MIN_ADDRESS) {
			for (let i = MIN_SECTOR; i <= MAX_SECTOR; i++) {
				if (addr < SECTOR_ADDRESS[i + 1]) {
					return i;
				}
			}
		}
		throw new TypeError(`Bad address 0x${addr.toString(16)}`);
	}

	static sectorToAddress(sect: number): number {
		if (sect >= MIN_SECTOR && sect <= MAX_SECTOR) {
			return SECTOR_ADDRESS[~~sect];
		}
		throw new TypeError(`Bad sector ${sect}`);
	}

	static sectorSize(sect: number): number {
		if (sect >= MIN_SECTOR && sect <= MAX_SECTOR) {
			return SECTOR_ADDRESS[sect + 1] - SECTOR_ADDRESS[sect];
		}
		throw new TypeError(`Bad sector ${sect}`);
	}

}

// console.log(`Address [0x${FlashMemory.MIN_ADDRESS.toString(16)}...0x${FlashMemory.MAX_ADDRESS.toString(16)}]
// Sector [${FlashMemory.MIN_SECTOR}...${FlashMemory.MAX_SECTOR}]`);

// console.log(FlashMemory.addressToSector(0x0007DFFF));
// var n = FlashMemory.addressToSector(0x0007D000);
// console.log(n + ' ' + (FlashMemory.sectorSize(n) / 1024) + 'KB');

// console.log('0x' + FlashMemory.sectorToAddress(27).toString(16));
// console.log('0x' + FlashMemory.sectorToAddress(2).toString(16));
