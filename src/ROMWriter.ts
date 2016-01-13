'use strict';
var Symbol = require('es6-symbol');

import {InSystemProgramming} from './InSystemProgramming';
import * as FlashMemory from './FlashMemory';
import {RAMAddress} from './RAMAddress';
import {ROMBlock} from './ROMBlock';

const _blockSym = Symbol();

export class ROMWriter {

	set romBlock(block: ROMBlock) { this[_blockSym] = block; }
	get romBlock(): ROMBlock { return this[_blockSym]; }

	get address(): number { return this.romBlock.address; }
	get sector(): number { return this.romBlock.sector; }
	get size(): number { return this.romBlock.size; }

	constructor(private isp: InSystemProgramming) { }

	eraseBlocks(): Promise<void> {
		const endSect = FlashMemory.addressToSector(this.address + this.size - 1);
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
				this.romBlock = this.romBlock.increment(count);
			});
	}

}
