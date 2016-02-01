var Symbol = require('es6-symbol');

import {InSystemProgramming} from './InSystemProgramming';
import * as FlashMemory from './FlashMemory';
import {MemoryBlock} from './MemoryBlock';
import {RAMAddress} from './RAMAddress';
import {ROMBlock} from './ROMBlock';

const _blockSym = Symbol();

export class ROMWriter implements MemoryBlock {

  set block(block: ROMBlock) { this[_blockSym] = block; }
  get block(): ROMBlock { return this[_blockSym]; }

  get address(): number { return this.block.address; }
  get sector(): number { return this.block.sector; }
  get length(): number { return this.block.length; }

  constructor(private isp: InSystemProgramming, addr?: number, size?: number) {
    if ((addr !== void 0) && size) {
      this[_blockSym] = ROMBlock.fromAddress(addr, size);
    }
  }

  eraseBlock(): Promise<ROMWriter> {
    const endSect = FlashMemory.addressToSector(this.address + this.length - 1);
    return this.isp.unlock()
      .then(() => this.isp.sendCommand(`P ${this.sector} ${endSect}`))
      .then(() => this.isp.sendCommand(`E ${this.sector} ${endSect}`))
      .then(() => this);
  }

  copyRAMToFlash(srcAddr: RAMAddress, count: number): Promise<ROMWriter> {
    const endSect = FlashMemory.addressToSector(this.address + count - 1);
		return this.isp.unlock()
			.then(() => this.isp.sendCommand(`P ${this.sector} ${endSect}`))
      .then(() => this.isp.sendCommand(`C ${this.address} ${srcAddr} ${count}`))
      .then(() => { this.block = this.increment(count); return this; });
  }

  // adjust block avoiding overflows and misalignments
  private increment(count: number): ROMBlock {
    // count = Math.min(count, this.size);
    count = FlashMemory.alignCount(count);
    return this.block.adjust(count);
  }
}
