import {InSystemProgramming} from './InSystemProgramming';

function handshake(isp: InSystemProgramming, frequency: number, count: number): Promise<InSystemProgramming> {
  return new Promise<InSystemProgramming>((resolve, reject) => {
    (function synchronize() {
      isp.write('?')
        .then(() => isp.read(20))
        .then(ack => {
          if (ack !== 'Synchronized') {
            if (count-- <= 0) {
              reject(new RangeError('Not synchronized'));
            } else {
              console.warn(`No sync: ${JSON.stringify(ack)}`);
              setImmediate(synchronize);
            }
          } else {
            return isp.writeln('Synchronized');
          }
        })
        .then(() => isp.assert('Synchronized'))
        .then(ack => isp.assert('OK'))
        .then(() => isp.writeln(frequency.toString(10)))
        .then(() => isp.assert(frequency.toString(10)))
        .then(ack => isp.assert('OK'))
        .then(() => resolve(isp))
        .catch(error => {
          if (count-- <= 0) {
            return reject(error);
          } else {
            console.warn(error);
            setImmediate(synchronize);
          }
        });
    })();
  });
}

export function open(path: string, baud: number = 115200, frequency: number = 12000000): Promise<InSystemProgramming> {
	return new InSystemProgramming(path, 9600)
      .open()
      .then(isp => handshake(isp, frequency / 1000, 1000))
      .then(isp => isp.setBaudRate(baud)) // UNSUPPORTED
      .then(isp => isp.unlock());
}