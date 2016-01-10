'use strict';
var Symbol = require('es6-symbol');

const _addressSym = Symbol();

export class RAMAddress {

	static get BASE() { return 0x40000000; }
	static get SIZE() { return 32 * 1024; } // 32 KB

	get address(): number { return this[_addressSym]; }

	constructor(addr: number) {
		addr = ~~addr; // toInteger
		if (addr & 3) {
			throw new RangeError(`RAM address 0x${addr.toString(16)} must be aligned`);
		}
		if (addr < RAMAddress.BASE || addr >= RAMAddress.BASE + RAMAddress.SIZE) {
			throw new RangeError(`RAM address 0x${addr.toString(16)} out of range`);
		}
		this[_addressSym] = addr;
	}

	increment(diff: number): RAMAddress {
		return new RAMAddress(this[_addressSym] + diff);
	}

	valueOf(): number {
		return this.address;
	}
}
