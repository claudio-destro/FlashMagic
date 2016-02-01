const RETURN_CODES: Array<string> = [
	/*  0 */ 'Command is executed successfully',
	/*  1 */ 'Invalid command',
	/*  2 */ 'Source address is not on a word boundary',
	/*  3 */ 'Destination address is not on a correct boundary',
	/*  4 */ 'Source address is not mapped in the memory map',
	/*  5 */ 'Destination address is not mapped in the memory map',
	/*  6 */ 'Byte count is not multiple of 4 or is not a permitted value',
	/*  7 */ 'Sector number is invalid',
	/*  8 */ 'Sector is not blank',
	/*  9 */ 'Command to prepare sector for write operation was not executed',
	/* 10 */ 'Source and destination data is not same',
	/* 11 */ 'Flash programming hardware interface is busy',
	/* 12 */ 'Insufficient number of parameters or invalid parameter',
	/* 13 */ 'Address is not on word boundary',
	/* 14 */ 'Address is not mapped in the memory map',
	/* 15 */ 'Command is locked',
	/* 16 */ 'Unlock code is invalid',
	/* 17 */ 'Invalid baud rate setting',
	/* 18 */ 'Invalid stop bit setting',
	/* 19 */ 'Code read protection enabled'
];

export function rethrow(rc: number): void {
  rc = ~~rc;
  if (rc) {
    throw new Error(RETURN_CODES[rc]);
  }
}
