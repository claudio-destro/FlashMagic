'use strict';

import {InSystemProgramming} from "./InSystemProgramming";

function ping(comPort) {
	let isp = new InSystemProgramming(comPort);
	isp.open().then(loop).catch(error => console.error(error));

	let count = 0;
	function loop(): void {
		let start = Date.now();
		isp.sendUnlockCommand().then(() => {
			console.log(`PING seq=${count++} time=${Date.now() - start} ms`);
			setTimeout(loop, 1000);
		}).catch(error => {
			console.error(error);
			setTimeout(loop, 1000);
		});
	}
}

ping(process.argv[2] || '/dev/tty.usbmodemFD131');
