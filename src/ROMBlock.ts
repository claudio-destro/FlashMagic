var Symbol = require('es6-symbol');

import * as FlashMemory from './FlashMemory';
import {ROMAddress} from './ROMAddress';

const _addressSym = Symbol();
const _sizeSym = Symbol();

export class ROMBlock {

	get address(): number { return this[_addressSym].address; }
	get sector(): number { return this[_addressSym].sector; }
	get size(): number { return this[_sizeSym]; }

	constructor(addr: ROMAddress, size: number) {
		let n = addr.address;
		if (size < 0) {
			throw new RangeError(`ROM block size ${size} must be >= 0`);
		}
		let m = n + size - 1;
		if (m > FlashMemory.MAX_ADDRESS) {
			throw new RangeError(`ROM block [0x${n.toString(16)}...0x${m.toString(16)}] out of address space`);
		}
		this[_addressSym] = addr;
		this[_sizeSym] = size;
	}

	increment(diff: number): ROMBlock {
		return ROMBlock.fromAddress(this.address + diff, this.size - diff);
	}

	containsAddress(addr: number | ROMAddress): boolean {
		return this.address <= addr && addr < this.address + this.size;
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
		let endAddr = FlashMemory.sectorToAddress(end) + FlashMemory.sectorSize(end);
		return new ROMBlock(startAddr, endAddr - startAddr.address);
	}

}

// var x = ROMBlock.fromAddress(0x7d000, 0x7e000-0x7d000);
// console.log(x.increment(0x1000-4).toString());
