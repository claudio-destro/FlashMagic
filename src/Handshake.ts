import {InSystemProgramming} from './InSystemProgramming';

const ECHO = false;
const INITIAL_BAUDRATE = 115200;
const INITIAL_VERBOSITY = true;
const SYNCHRONIZED = 'Synchronized';
const SYNC_REGEXP = new RegExp(`^\\?*${SYNCHRONIZED}`);

function handshake(isp: InSystemProgramming, count: number): Promise<InSystemProgramming> {
  isp.verbose = INITIAL_VERBOSITY;
  return new Promise<InSystemProgramming>((resolve, reject) => {
    console.log(`Sync'ing...`);
    (function synchronize() {
      isp.write('?')
        .then(() => isp.read(20))
        .then(ack => {
          if (!ack.match(SYNC_REGEXP)) {
            throw new RangeError('Not synchronized');
          }
          return isp.writeln(SYNCHRONIZED);
        })
        .then(isp => isp.assert(SYNCHRONIZED))
        .then(isp => isp.assert('OK'))
        .then(isp => isp.sendLine(isp.cclk.toString(10)))
        .then(isp => isp.assert('OK'))
        .then(isp => isp.setEcho(ECHO))
        .then(isp => resolve(isp))
        .catch(error => {
          if (count-- <= 0) {
            return reject(error);
          } else {
            // console.warn(error);
            process.nextTick(synchronize);
          }
        });
    })();
  });
}

export function open(path: string, baud: number = 115200, cclk: number = 12000000): Promise<InSystemProgramming> {
	return new InSystemProgramming(path, INITIAL_BAUDRATE, cclk / 1000) // must be in kHz
      .open()
      .then(isp => handshake(isp, Infinity))
      .then(isp => isp.setBaudRate(baud));
      //.then(isp => isp.unlock());
}
