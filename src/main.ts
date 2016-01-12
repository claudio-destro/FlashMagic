'use strict';

import {InSystemProgramming} from "./InSystemProgramming";
import {LPCProgrammer} from './LPCProgrammer';

import * as fs from 'fs';

process.on('uncaughtException', (uncaught) => {
	console.error(uncaught.stack);
	process.exit(1);
});

let file = process.argv[2];
let address = parseInt(process.argv[3]);
let comPort = process.argv[4] || '/dev/tty.usbmodemFD131';

let size = fs.statSync(file).size;
console.log(`About to flash ${size} bytes...`);
let count = 0;

let isp = new InSystemProgramming(comPort);
isp.open().then(() => {
	return isp.sendUnlockCommand();
}).then(() => {
	let writer = new LPCProgrammer(isp, address);
	var f: fs.ReadStream = fs.createReadStream(file);

	writer.writeFile(f)
		// .on('start', () => { })
		.on('error', error => { console.error(error); finished(1); })
		.on('chunk', buffer => count += buffer.length)
		.on('end', () => { finished(); });

	function finished(n: number = 0) {
		f.close();
		console.log(`${count} bytes written`);
		process.exit(n);
	}
});

