'use strict';

import {InSystemProgramming} from "./InSystemProgramming";
import {LPCProgrammer} from './LPCProgrammer';

import * as path from 'path';
import * as fs from 'fs';

export function programFile(isp: InSystemProgramming, path: string, address: number): Promise<void> {
	return isp.sendUnlockCommand().then(() => {
		let size = fs.statSync(path).size;
		let count = 0;
		let programmer = new LPCProgrammer(isp, address, size);
		return new Promise<void>((resolve, reject) => {
			let stream = fs.createReadStream(path);
			programmer.program(stream)
				.on('start', () => console.log(`About to flash ${size} bytes...`))
				.on('chunk', buffer => count += buffer.length)
				.on('error', error => reject(error))
				.on('end', () => {
					console.log(`${path}: ${count} bytes written`);
					stream.close();
					resolve();
				});
		});
	});
}

var base = process.argv[2];
var comPort = process.argv[3] || '/dev/tty.usbmodemFD131';

InSystemProgramming.makeAndOpen(comPort)
	.then((isp) => {
		return programFile(isp, path.resolve(base, 'mas-cu.bin'), 0x2000)
			.then(() => programFile(isp, path.resolve(base, 'sats.bin'), 0x7D000))
			.then(() => programFile(isp, path.resolve(base, 'lang.bin'), 0x78000));

	})
	.then(() => {
		process.exit();
	})
	.catch(error => {
		console.error(error);
		process.exit(1);
	});
