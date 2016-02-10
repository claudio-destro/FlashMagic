import {InSystemProgramming} from './InSystemProgramming';

const ECHO = false;

const SYNCHRONIZED = 'Synchronized';
const SYNC_REGEXP = new RegExp(`^\\?*${SYNCHRONIZED}`);

export function handshake(isp: InSystemProgramming, count: number = Infinity, timeout: number = 20): Promise<InSystemProgramming> {
  return new Promise<InSystemProgramming>((resolve, reject) => {
    console.log(`Sync'ing...`);
    (function synchronize() {
      isp.write('?')
        .then(() => isp.read(timeout))
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
        .then(isp => isp.readPartIdentification())
        .then(partId => isp.readBootcodeVersion())
        .then(bootVer => resolve(isp))
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
