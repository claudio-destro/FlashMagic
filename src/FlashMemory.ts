const SECTOR_ADDRESS = new Uint32Array([
	// 4KB [0...7]
	0x00000000, 0x00001000, 0x00002000, 0x00003000,
	0x00004000, 0x00005000, 0x00006000, 0x00007000,
	// 8KB [8...21]
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

export class FlashMemory {

	static addressToSector(addr: number): number {
		if (addr >= 0) {
			for (let i = 0; i < SECTOR_ADDRESS.length - 1; i++) {
				if (addr < SECTOR_ADDRESS[i + 1]) {
					return i;
				}
			}
		}
		throw new TypeError(`Bad address 0x${addr.toString(16)}`);
	}

	static sectorToAddress(sect: number): number {
		if (sect > 0 && sect < SECTOR_ADDRESS.length - 1) {
			return SECTOR_ADDRESS[sect];
		}
		throw new TypeError(`Bad sector ${sect}`);
	}

}
