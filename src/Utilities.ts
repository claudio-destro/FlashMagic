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

export const MIN_SECTOR = 0; // 2 to protect custom bootloader
export const MAX_SECTOR = SECTOR_ADDRESS.length - MIN_SECTOR;

export const MIN_ROM_ADDRESS = SECTOR_ADDRESS[MIN_SECTOR];
export const MAX_ROM_ADDRESS = SECTOR_ADDRESS[MAX_SECTOR + 1] - 1;

export const LINES_PER_UUENCODED_CHUNK = 20;
export const BYTES_PER_UUENCODED_LINE = 45;

export function addressToSector(addr: number): number {
  if (addr >= MIN_ROM_ADDRESS) {
    for (let i = MIN_SECTOR; i <= MAX_SECTOR; i++) {
      if (addr < SECTOR_ADDRESS[i + 1]) {
        return i;
      }
    }
  }
  throw new RangeError(`ROM address 0x${addr.toString(16)} out of range`);
}

export function sectorToAddress(sect: number): number {
  if (sect >= MIN_SECTOR && sect <= MAX_SECTOR) {
    return SECTOR_ADDRESS[~~sect];
  }
  throw new RangeError(`ROM sector ${sect} out of range`);
}

export function sectorSize(sect: number): number {
  if (sect >= MIN_SECTOR && sect <= MAX_SECTOR) {
    return SECTOR_ADDRESS[sect + 1] - SECTOR_ADDRESS[sect];
  }
  throw new RangeError(`Bad sector ${sect}`);
}

export function alignCount(count: number): number {
		return (count & 3) === 0 ? count : 4 + (count & ~3);
}
