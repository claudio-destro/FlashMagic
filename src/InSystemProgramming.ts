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

const UNLOCK_CODE = 0x5A5A;

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

  private echo: boolean = true;

	constructor(private path: string, baud: number = 115200) {
    this.reinitialize(baud, 1);
  }

	private reinitialize(baud: number, stop: number) {
   	this.serialport = new com.SerialPort(this.path, {
			baudRate: baud,
      stopBits: stop,
      parity: 'none',
			parser: com.parsers.readline('\r\n')
		}, false); // open later
		this.serialport.on('data', (data: Buffer | String) => {
			const s = data.toString();
			console.log(`---> ${s}`);
			try {
				this.queue.push(s);
			} finally {
				this.queue = LINE_QUEUE; // Reset strategy
			}
		});
	}

	open(): Promise<InSystemProgramming> {
		return new Promise<InSystemProgramming>((resolve, reject) => {
			this.serialport.open((error: any) => {
				return error ? reject(error) : resolve(this);
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

	write(data: string): Promise<InSystemProgramming> {
		console.log(`<--- ${data.trim()}`); // trim EOL
		this.queue.drain(); // XXX
		return new Promise<InSystemProgramming>((resolve, reject) => {
			this.serialport.write(data, (error: any) => {
				if (error) {
          return reject(error);
        }
				this.serialport.drain((error: any) => {
          return error ? reject(error) : resolve(this);
				});
			});
		});
	}

	writeln(data: string): Promise<InSystemProgramming> {
    return this.write(data + '\r\n');
	}

	close(): Promise<InSystemProgramming> {
		return new Promise<InSystemProgramming>((resolve, reject) => {
			this.serialport.close((error: any) => {
				return error ? reject(error) : resolve(this);
			});
		});
	}

	///////////////
	// UTILITIES //
	///////////////

	sendLine(data: string): Promise<InSystemProgramming> {
    let p = this.writeln(data);
    if (this.echo) {
      p = p.then(() => {
        return this.read();
      }).then((ack) => {
        if (ack !== data) throw new Error(`Not acknowledged: ${JSON.stringify(ack)}`);
        return this;
      });
    }
    return p;
	}

	sendCommand(data: string): Promise<InSystemProgramming> {
		return this.sendLine(data).then(() => this.assertSuccess());
	}

	assertSuccess(): Promise<InSystemProgramming> {
		return this.read().then((data) => {
			if (!(/^\d+$/.test(data))) {
				throw new TypeError(`Not a number: ${JSON.stringify(data)}`);
			}
			let rc = ~~data;
			if (rc > 0) {
				throw new Error(ERRORS[rc]);
			}
			return this;
		});
	}

  assert(ack: string): Promise<InSystemProgramming> {
		return this.read().then((data) => {
			if (data !== ack) {
				throw new Error(`Not "${ack}": ${JSON.stringify(data)}`);
			}
			return this;
		});
  }

	/////////////
	// HELPERS //
	/////////////

	unlock(): Promise<InSystemProgramming> {
		return this.sendCommand(`U ${UNLOCK_CODE}`);
	}

  setEcho(echo: boolean): Promise<InSystemProgramming> {
    return this.sendCommand(`A ${ echo ? 1 : 0 }`)
        .then(() => {
          this.echo = echo;
          return this;
        });
  }

  setBaudRate(baud: number, stop: number = 1): Promise<InSystemProgramming> {
    return this.sendCommand(`B ${baud} ${stop}`)
        .then(() => this.close())
        .then(() => this.reinitialize(baud, stop))
        .then(() => this.open());
  }

  readPartIdentification(): Promise<string> {
    return this.sendCommand('J').then(() => this.read());
  }

  readBootcodeVersion(): Promise<string> {
    return this.sendCommand('K').then(() => this.read());
  }

	static makeAndOpen(path: string, baud: number = 115200): Promise<InSystemProgramming> {
		return new InSystemProgramming(path, baud).open();
	}
}
