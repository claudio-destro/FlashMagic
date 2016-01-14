'use strict';

import {InSystemProgramming} from "./InSystemProgramming";
import {LPCProgrammer} from './LPCProgrammer';

import * as fs from 'fs';

class Programmer {

	constructor(private isp: InSystemProgramming) { }

	programFile(path: string, addr: number): Promise<void> {
		let stream = fs.createReadStream(file);
		return this.isp.open()
			.then(() => {
				return this.isp.sendUnlockCommand();
			})
			.then(() => {
				let size = fs.statSync(file).size;
				let count = 0;
				let programmer = new LPCProgrammer(this.isp, address, size);
				return new Promise<void>((resolve, reject) => {
					programmer.program(stream)
						.on('start', () => console.log(`About to flash ${size} bytes...`))
						.on('error', error => { console.error(error); finished(1); })
						.on('chunk', buffer => count += buffer.length)
						.on('end', finished);

					function finished(n: number = 0): void {
						console.log(`${count} bytes written.`);
						if (n) reject(); else resolve();
					}
				});
			})
			.then(() => {
				stream.close();
				return this.isp.close();
			})
			.catch(error => {
				console.error(error);
				stream.close();
				this.isp.close();
			});
	}
}


let file = process.argv[2];
let address = parseInt(process.argv[3]);
let comPort = process.argv[4] || '/dev/tty.usbmodemFD131';

let p = new Programmer(new InSystemProgramming(comPort));
p.programFile(file, address);
