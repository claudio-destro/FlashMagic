var Symbol = require('es6-symbol');

import * as Utilities from './Utilities';
import {MemoryBlock} from './MemoryBlock';
import {ROMAddress} from './ROMAddress';

const _addressSym = Symbol();
const _lengthSym = Symbol();

export class ROMBlock implements MemoryBlock {

	get address(): number { return this[_addressSym].address; }
	get sector(): number { return this[_addressSym].sector; }
	get length(): number { return this[_lengthSym]; }

	constructor(addr: ROMAddress, size: number) {
		let n = addr.address;
		if (size < 0) {
			throw new RangeError(`ROM block size ${size} must be >= 0`);
		}
		let m = n + size - 1;
		if (m > Utilities.MAX_ROM_ADDRESS) {
			throw new RangeError(`ROM block [0x${n.toString(16)}...0x${m.toString(16)}] out of address space`);
		}
		this[_addressSym] = addr;
		this[_lengthSym] = size;
	}

	adjust(diff: number): ROMBlock {
		let size = Math.max(0, this.length - diff);
		return ROMBlock.fromAddress(this.address + diff, size);
	}

	containsAddress(addr: number | ROMAddress): boolean {
		return this.address <= addr && addr < this.address + this.length;
	}

	// toString(): string {
	//	return `[0x${this.address.toString(16)}...0x${(this.address + this.size - 1).toString(16)}]`
	// }

	static fromAddress(addr: number, size: number): ROMBlock {
		return new ROMBlock(ROMAddress.fromAddress(addr), size);
	}

	static fromAddressRange(start: number, end: number): ROMBlock {
		return new ROMBlock(ROMAddress.fromAddress(start), end - start + 1);
	}

	static fromSector(sect: number, size: number): ROMBlock {
		return new ROMBlock(ROMAddress.fromSector(sect), size);
	}

	static fromSectorRange(start: number, end: number): ROMBlock {
		let startAddr = ROMAddress.fromSector(start);
		let endAddr = Utilities.sectorToAddress(end) + Utilities.sectorSize(end);
		return new ROMBlock(startAddr, endAddr - startAddr.address);
	}

}
