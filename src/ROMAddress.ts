var Symbol = require('es6-symbol');

import * as Utilities from './Utilities';

const _addressSym = Symbol();
const _sectorSym = Symbol();

export class ROMAddress {

  static get BASE() { return 0; }
  static get SIZE() { return Utilities.MAX_ROM_ADDRESS + 1; } // 504 KB

  get address(): number { return this[_addressSym]; }
  get sector(): number { return this[_sectorSym]; }

  constructor(addr: number, sect: number) {
    addr = ~~addr; // toInteger
    sect = ~~sect; // toInteger
    if (addr & 3) {
      throw new RangeError(`ROM address 0x${addr.toString(16)} must be aligned`);
    }
    if (addr < ROMAddress.BASE || addr >= ROMAddress.BASE + ROMAddress.SIZE) {
      throw new RangeError(`ROM address 0x${addr.toString(16)} out of range`);
    }
    if (sect < 0 || sect > Utilities.MAX_SECTOR) {
      throw new RangeError(`ROM sector ${sect} out of range`);
    }
    if (Utilities.addressToSector(addr) !== sect) {
      throw new RangeError(`ROM address 0x${addr.toString(16)} / sector ${sect} mismatch`);
    }
    this[_addressSym] = addr;
    this[_sectorSym] = sect;
  }

  increment(diff: number): ROMAddress {
    return ROMAddress.fromAddress(this[_addressSym] + diff);
  }

  valueOf(): number {
    return this.address;
  }

  static fromAddress(addr: number): ROMAddress {
    let sect = Utilities.addressToSector(addr);
    return new ROMAddress(addr, sect);
  }

  static fromSector(sect: number): ROMAddress {
    let addr = Utilities.sectorToAddress(sect);
    return new ROMAddress(addr, sect);
  }
}
