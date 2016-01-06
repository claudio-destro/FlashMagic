'use strict';
import {InSystemProgramming} from "./InSystemProgramming";
import {LPCProgrammer} from "./LPCProgrammer";

var isp = new InSystemProgramming('/dev/tty.usbmodemFD131');
var lpc = new LPCProgrammer(isp, 0x00070000);
isp.open().then(() => {
	return lpc.eraseBlock(512);
}).then(() => {
	console.info('Done');
	isp.close();
	process.exit();
}).catch((error) => {
	console.error(error);
	isp.close();
	process.exit(1);
});

