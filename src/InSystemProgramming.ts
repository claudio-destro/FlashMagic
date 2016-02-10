var Symbol = require('es6-symbol');
var com = require('serialport');

import * as ReturnCode from './ReturnCode';

const UNLOCK_CODE = 0x5A5A;

interface DataQueue<T> {
  push(data: T): void;
  pop(): T;
  drain(): void;
}

class LineQueue implements DataQueue<string> {
  private queue: string[] = [];
  drain(): void { this.queue.length = 0; }
  pop(): string { return this.queue.shift(); }
  push(data: string): void { this.queue.push(data); }
}

interface Logger<T> { log(msg: T): void; }
class VerboseLogger implements Logger<string> { log(msg: string) { console.log(msg); } }
class QuiteLogger implements Logger<string> { log(msg: string) { /* nothing */ } }

const LINE_QUEUE = new LineQueue;

const _baudRateSym = Symbol();
const _bootVerSym = Symbol();
const _partIdSym = Symbol();

export class InSystemProgramming {

  private serialport;

  private queue: DataQueue<string> = LINE_QUEUE;

  set verbose(b: boolean) { this.logger = b ? new VerboseLogger() : new QuiteLogger(); }

  private logger: Logger<string> = new QuiteLogger();

  private echo: boolean = true;

  constructor(private path: string, baud: number, public cclk: number) {
    this.reinitialize(baud, 1);
  }

  private reinitialize(baud: number, stop: number) {
    this[_baudRateSym] = baud;
   	this.serialport = new com.SerialPort(this.path, {
      baudRate: baud,
      stopBits: stop,
      parity: 'none',
      parser: com.parsers.readline('\r\n')
    }, false); // open later
    this.serialport.on('data', (data: Buffer | String) => {
      const s = data.toString();
      this.logger.log(`---> ${s}`);
      try {
        this.queue.push(s);
      } finally {
        this.queue = LINE_QUEUE; // Reset strategy
      }
    });
  }

  open(): Promise<InSystemProgramming> {
    return new Promise<InSystemProgramming>((resolve, reject) => {
      this.serialport.open((error: any) => {
        return error ? reject(error) : resolve(this);
      });
    });
  }

  read(timeout: number = 1000): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let s = this.queue.pop();
      if (s) {
        return resolve(s);
      }
      ((to): void => {
        // Temporary change queue strategy
        this.queue = {
          push: (data: string): void => {
            // XXX cannot reset strategy here because of "this"
            clearTimeout(to);
            resolve(data);
          },
          pop: (): string => { throw new Error('Not implemented'); },
          drain: (): void => { throw new Error('Not implemented'); }
        };
      })(setTimeout(() => {
        try {
          reject(new Error(`Timed out: > ${timeout}ms`));
        } finally {
          this.queue = LINE_QUEUE;
        }
      }, timeout));
    });
  }

  write(data: string): Promise<InSystemProgramming> {
    this.logger.log(`<--- ${data.trim()}`); // trim EOL
    this.queue.drain(); // XXX
    return new Promise<InSystemProgramming>((resolve, reject) => {
      this.serialport.write(data, (error: any) => {
        if (error) {
          return reject(error);
        }
        this.serialport.drain((error: any) => {
          return error ? reject(error) : resolve(this);
        });
      });
    });
  }

  writeln(data: string): Promise<InSystemProgramming> {
    return this.write(data + '\r\n');
  }

  close(): Promise<InSystemProgramming> {
    return new Promise<InSystemProgramming>((resolve, reject) => {
      this.serialport.close((error: any) => {
        return error ? reject(error) : resolve(this);
      });
    });
  }

  ///////////////
  // UTILITIES //
  ///////////////

  sendLine(data: string): Promise<InSystemProgramming> {
    let p = this.writeln(data);
    if (this.echo) {
      p = p.then(() => {
        return this.read();
      }).then((ack) => {
        if (ack !== data) throw new Error(`Not acknowledged: ${JSON.stringify(ack)}`);
        return this;
      });
    }
    return p;
  }

  sendCommand(data: string): Promise<InSystemProgramming> {
    return this.sendLine(data).then(() => this.assertSuccess());
  }

  assertSuccess(): Promise<InSystemProgramming> {
    return this.read().then((data) => {
      if (!(/^\d+$/.test(data))) {
        throw new TypeError(`Not a number: ${JSON.stringify(data)}`);
      }
      ReturnCode.rethrow(~~data);
      return this;
    });
  }

  assert(ack: string): Promise<InSystemProgramming> {
    return this.read().then((data) => {
      if (data !== ack) {
        throw new Error(`Not "${ack}": ${JSON.stringify(data)}`);
      }
      return this;
    });
  }

  /////////////
  // HELPERS //
  /////////////

  unlock(): Promise<InSystemProgramming> {
    return this.sendCommand(`U ${UNLOCK_CODE}`);
  }

  setEcho(echo: boolean): Promise<InSystemProgramming> {
    return this.sendCommand(`A ${echo ? 1 : 0}`)
      .then(() => {
        this.echo = echo;
        return this;
      });
  }

  get baudRate(): number { return this[_baudRateSym]; }

  setBaudRate(baud: number, stop: number = 1): Promise<InSystemProgramming> {
    baud = ~~baud;
    if (this.baudRate === baud) {
      return Promise.resolve(this);
    }
    this[_baudRateSym] = baud;
    return this.sendCommand(`B ${baud} ${stop}`)
      .then(() => this.close())
      .then(() => this.reinitialize(baud, stop))
      .then(() => this.open());
  }

  get partIdentification(): number { return this[_partIdSym]; }

  readPartIdentification(): Promise<string> {
    return this.sendCommand('J')
      .then(() => this.read())
      .then(partId => this[_partIdSym] = partId);
  }

  get bootcodeVersion(): number { return this[_bootVerSym]; }

  readBootcodeVersion(): Promise<string> {
    let major_ = '';
    return this.sendCommand('K')
      .then(() => this.read())
      .then(major => Promise.all([major, this.read()]))
      .then(ver => this[_bootVerSym] = `${ver[0]}.${ver[1]}`);
  }
}
