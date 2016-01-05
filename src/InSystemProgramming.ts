'use strict';
var com = require('serialport');

var ERRORS: Array<string> = [
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

function nullResponse(code: number) { return code; }

export class InSystemProgramming {

	private serialport;
	private command: (data: string) => void = null;
	private response: (code: number) => number = nullResponse;
	private responseCode: number = -1;

	constructor(path: string, baud?: number) {
		this.serialport = new com.SerialPort(path, {
			baudRate: baud || 115200,
			parser: com.parsers.readline('\r\n')
		}, false);
		this.serialport.on('data', (data: string|Buffer) => {
			const s = data.toString();
			console.info(`---> ${s}`);
			if (this.command === null) {
				if (this.responseCode < 0 && /^\d+$/.test(s)) {
					this.responseCode = this.response(~~s);
				} else {
					console.error(`Dropped "${s}"`);
				}
			} else {
				try {
					this.command(s);
				} finally {
					this.command = null;
				}
			}
		});
	}

	open(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.serialport.open((error: any) => {
				return error ? reject(error) : resolve();
			});
		});
	}

	close(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.serialport.close((error: any) => {
				return error ? reject(error) : resolve();
			});
		});
	}

	send(data: string|number|Buffer): Promise<void> {
		const s = data.toString();
		console.info(`<--- ${s}`);
		return new Promise<void>((resolve, reject) => {
			if (this.command !== null) {
				return reject(new Error('Busy'));
			}
			const to = setTimeout(() => {
				this.command = null;
				reject(new Error('Timed out'));
			}, 100);
			this.command = (data) => {
				clearTimeout(to);
				if (data.toString() !== s) {
					reject(new Error('Mismatch'));
				} else {
					resolve();
				}
			};
			this.serialport.write(s + '\r\n', (error: any) => {
				if (error) return reject(error);
				this.serialport.drain((error: any) => {
					return error ? reject(error) : resolve();
				});
			});
		});
	}

	assertSuccess(): Promise<void> {
		return new Promise<void>((resolve, reject) => {

			var resolver = (rc: number): number => {
				this.responseCode = -1;
				this.response = nullResponse;
				if (rc > 0) {
					reject(new Error(ERRORS[rc]));
				} else {
					resolve();
				}
				return -1;
			};

			let rc = this.responseCode;
			if (rc < 0) {
				const to = setTimeout(() => {
					this.responseCode = -1;
					this.response = nullResponse;
					reject(new Error('Timed out'));
				});
				this.response = resolver;
			} else {
				resolver(rc);
			}
		});
	}

	sendUnlockCommand(): Promise<void> {
		return this.send("U 23130").then(() => {
			return this.assertSuccess();
		});
	}

}
