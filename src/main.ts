// import {RAMAddress} from "./RAMAddress";
// import {ROMAddress} from "./ROMAddress";
import {InSystemProgramming} from "./InSystemProgramming";
// var com = require('serialport');

// var sp = new com.SerialPort('/dev/tty.usbserial-FTBTBAAW', {
// 	baudRate: 115200,
// 	parser: com.parsers.readline('\r\n')
// });
// sp.on('data', (data) => {
// 	console.log(new Date(), data);
// });

var isp = new InSystemProgramming('/dev/tty.usbmodemFD131');
// var isp = new InSystemProgramming('/dev/tty.usbserial-FTBTBAAW');
isp.open().then(() => {
	console.log('open');
	return isp.sendUnlockCommand();
}).then(() => {
	console.log('OKKEJO!');
	return isp.close();
}).catch((err) => {
	console.error(err);
})
// console.log(new RAMAddress(RAMAddress.BASE));
// console.log(ROMAddress.fromAddress(0x31A8));
