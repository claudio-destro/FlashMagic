'use strict';
var Symbol = require('es6-symbol');

import {InSystemProgramming} from './InSystemProgramming';
import * as FlashMemory from './FlashMemory';
import {RAMAddress} from './RAMAddress';
import {ROMAddress} from './ROMAddress';

const _addressSym = Symbol();

export class ROMWriter {

	set romAddress(address: ROMAddress) { this[_addressSym] = address; }
	get romAddress(): ROMAddress { return this[_addressSym]; }

	get address(): number { return this.romAddress.address; }
	get sector(): number { return this.romAddress.sector; }

	constructor(private isp: InSystemProgramming) { }

	eraseBlock(count: number): Promise<void> {
		const endSect = FlashMemory.addressToSector(this.address + count - 1);
		return this.isp.sendUnlockCommand()
			.then(() => {
				return this.isp.sendCommand(`P ${this.sector} ${endSect}`);
			}).then(() => {
				return this.isp.sendCommand(`E ${this.sector} ${endSect}`);
			});
	}

	copyBlock(srcAddr: RAMAddress, count: number): Promise<void> {
		const endSect = FlashMemory.addressToSector(this.address + count - 1);
		return this.isp.sendUnlockCommand()
			.then(() => {
				return this.isp.sendCommand(`P ${this.sector} ${endSect}`);
			}).then(() => {
				return this.isp.sendCommand(`C ${this.address} ${srcAddr} ${count}`);
			}).then(() => {
				this.romAddress = this.romAddress.increment(count);
			});
	}

}
