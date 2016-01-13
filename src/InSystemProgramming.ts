'use strict';
var com = require('serialport');

const ERRORS: Array<string> = [
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

interface DataQueue<T> {
	push(data: T): void;
	pop(): T;
	drain(): void;
}

class LineQueue implements DataQueue<string> {
	private queue: string[] = [];
	drain(): void { this.queue.length = 0; }
	pop(): string { return this.queue.shift(); }
	push(data: string): void { this.queue.push(data); }
}

const LINE_QUEUE = new LineQueue;

export class InSystemProgramming {

	private serialport;

	private queue: DataQueue<string> = LINE_QUEUE;

	constructor(path: string, baud: number = 115200) {

		this.serialport = new com.SerialPort(path, {
			baudRate: baud,
			parser: com.parsers.readline('\r\n')
		}, false); // open later

		this.serialport.on('data', (data: Buffer | String) => {
			const s = data.toString();
			console.info(`---> ${s}`);
			try {
				this.queue.push(s);
			} finally {
				this.queue = LINE_QUEUE; // Reset strategy
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

	read(timeout: number = 1000): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let s = this.queue.pop();
			if (s) {
				return resolve(s);
			}
			((to): void => {
				// Temporary change queue strategy
				this.queue = {
					push: (data: string): void => {
						// XXX cannot reset strategy here because of "this"
						clearTimeout(to);
						resolve(data);
					},
					pop: (): string => { throw new Error('Not implemented'); },
					drain: (): void => { throw new Error('Not implemented'); }
				};
			})(setTimeout(() => {
				try {
					reject(new Error(`Timed out: > ${timeout}ms`));
				} finally {
					this.queue = LINE_QUEUE;
				}
			}, timeout));
		});
	}

	write(data: string): Promise<void> {
		console.info(`<--- ${data}`);
		this.queue.drain(); // XXX
		return new Promise<void>((resolve, reject) => {
			this.serialport.write(data + '\r\n', (error: any) => {
				if (error) throw error;
				this.serialport.drain((error: any) => {
					if (error) throw error;
					resolve();
				});
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

	///////////////
	// UTILITIES //
	///////////////

	sendLine(data: string): Promise<string | void> {
		return this.write(data).then(() => {
			return this.read().then((ack) => {
				if (ack !== data) throw new Error(`Not acknowledged: ${JSON.stringify(ack)}`);
			});
		});
	}

	sendCommand(data: string): Promise<string | void> {
		return this.sendLine(data).then(() => this.assertSuccess());
	}

	assertSuccess(): Promise<string | void> {
		return this.read().then((data) => {
			if (!(/^\d+$/.test(data))) {
				throw new TypeError(`Not a number: ${JSON.stringify(data)}`);
			}
			let rc = ~~data;
			if (rc > 0) {
				throw new Error(ERRORS[rc]);
			}
		});
	}

	assertOK(): Promise<string | void> {
		return this.read().then((data) => {
			if (data !== 'OK') {
				throw new Error(`Not "OK": ${JSON.stringify(data)}`);
			}
		});
	}

	/////////////
	// HELPERS //
	/////////////

	sendUnlockCommand(): Promise<string | void> {
		return this.sendCommand("U 23130");
	}

}
