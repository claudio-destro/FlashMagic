'use strict';
// import {InSystemProgramming} from "./InSystemProgramming";
// import {LPCProgrammer} from "./LPCProgrammer";

// var isp = new InSystemProgramming('/dev/tty.usbmodemFD131');
// var lpc = new LPCProgrammer(isp, 0x00070000);
// isp.open().then(() => {
// 	return lpc.eraseBlock(512);
// }).then(() => {
// 	console.info('Done');
// 	isp.close();
// 	process.exit();
// }).catch((error) => {
// 	console.error(error);
// 	isp.close();
// 	process.exit(1);
// });

import {InSystemProgramming} from "./InSystemProgramming";
import {RAMAddress} from './RAMAddress';
import {RAMWriter} from './RAMWriter';

import * as fs from 'fs';

let path = process.argv[2];
let count = fs.statSync(path).size;
console.log(`About to flash ${count} bytes...`);

let isp = new InSystemProgramming('/dev/tty.usbmodemFD131');
isp.open().then(() => {
	return isp.sendUnlockCommand();
}).then(() => {
	let writer = new RAMWriter(isp);
	writer.address = new RAMAddress(RAMAddress.BASE + 1024 * 10); // Do not overwrite bootloader's memory...
	var f: fs.ReadStream = fs.createReadStream(path);

	writer.writeFile(f)
		.on('start', () => { })
		.on('error', error => { console.error(error); finished(1); })
		.on('chunk', buffer => console.log(`${100 * ~~(buffer.length / count)}%`))
		.on('end', () => { finished(); });

	function finished(n?: number) {
		f.close();
		isp.close()
			.then(() => process.exit(n))
			.catch(() => process.exit(n));
	}
});

