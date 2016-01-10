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

let count = fs.statSync(file).size;
console.log(`About to flash ${count} bytes...`);

let isp = new InSystemProgramming(comPort);
isp.open().then(() => {
	return isp.sendUnlockCommand();
}).then(() => {
	let writer = new LPCProgrammer(isp, address);
	var f: fs.ReadStream = fs.createReadStream(file);

	writer.writeFile(f)
		// .on('start', () => { })
		.on('error', error => { console.error(error); finished(1); })
		// .on('chunk', buffer => console.log(`${100 * ~~(buffer.length / count)}%`))
		.on('end', () => { finished(); });

	function finished(n?: number) {
		f.close();
		process.exit(n);
	}
});

