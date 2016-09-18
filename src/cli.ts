import {Progress} from './Progress';
import * as FlashMagic from './index';

var dump = require('buffer-hexdump');
import * as program from 'commander';
import * as path from 'path';
import * as fs from 'fs';

const DEFAUL_COM_PORT = '/dev/tty.usbmodemFD131';
const DEFAUL_BAUD_RATE = 115200;
const DEFAUL_CRYSTAL_CLOCK = 12000000;
const DEFAULT_PING_COMMAND = FlashMagic.InSystemProgramming.LEGACY_MODE ? 'U' : 'J';

program
  .option('-P, --port [port]', `serial port [${DEFAUL_COM_PORT}]`, DEFAUL_COM_PORT)
  .option('-B, --baudrate [baudrate]', `baudrate [${DEFAUL_BAUD_RATE}]`, DEFAUL_BAUD_RATE)
  .option('-V, --verbose', `make the operation more talkative`, true)
  .option('--cclk [cclk]', `crystal clock in Hz [${(DEFAUL_CRYSTAL_CLOCK / 1000000).toFixed(3)} MHz]`, DEFAUL_CRYSTAL_CLOCK);

program.command('write')
  .description('program file')
  .option('-A, --address <address>', 'ROM address', parseInt)
  .option('-I, --input <file>', 'input file', null)
  .action((cmd) => {
    open()
      .then(isp => programFile(isp, cmd.input, cmd.address))
      .then(() => process.exit(0))
      .catch(catchError);
  });

program.command('ping')
  .description('ping device')
  .option('-C, --command <command>', `J or U [${DEFAULT_PING_COMMAND}]`, DEFAULT_PING_COMMAND)
  .action((cmd) => {
    open()
      .then(isp => pingDevice(isp, cmd.command))
      .catch(catchError);
  });

program.command('read')
  .description('read memory')
  .option('-A, --address <address>', 'memory address', parseInt)
  .option('-L, --length <length>', 'length', parseInt)
  .option('-O, --output <file>', 'output file', null)
  .action((cmd) => {
    open()
      .then(isp => {
        let reader = new FlashMagic.MemoryReader(isp);
        return reader.readFully({
          address: cmd.address,
          length: cmd.length
        });
      })
      .then(buffer => {
        if (cmd.output) {
          fs.writeFileSync(cmd.output, buffer, { encoding: 'binary' });
          console.log(`${buffer.length} bytes written to ${cmd.output}`);
        } else {
          console.log(dump(buffer));
        }
        process.exit(0);
      })
      .catch(catchError);
  });

program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
}

function programFile(isp: FlashMagic.InSystemProgramming, path: string, address: number): Promise<void> {
  let size = fs.statSync(path).size;
  let count = 0;
  let programmer = new FlashMagic.Programmer(isp, address, size);
  return new Promise<void>((resolve, reject) => {
    let stream = fs.createReadStream(path);
    let progress = new Progress();
    programmer.program(stream)
      .on('start', () => console.log(`About to flash ${size} bytes...`))
      .on('chunk', buffer => { count += buffer.length; progress.spin(count, size); })
      .on('error', error => reject(error))
      .on('end', () => {
        console.log(`${path}: ${count} bytes written`);
        stream.close();
        resolve();
      });
  });
}

function pingDevice(isp: FlashMagic.InSystemProgramming, cmd: string): void {
  let count = 0;
  (function loop(): void {
    let start = Date.now();
    issuePing(isp, cmd).then(() => {
      console.log(`seq=${count++} time=${Date.now() - start} ms`);
      setTimeout(loop, 1000);
    }).catch(error => {
      console.error(error);
      setTimeout(loop, 1000);
    });
  })();
}

function issuePing(isp: FlashMagic.InSystemProgramming, cmd: string): Promise<FlashMagic.InSystemProgramming> {
  switch (cmd) {
  case 'J':
    return isp.readPartIdentification().then(partId => {
      console.log(FlashMagic.toProcessorString(partId));
      return isp;
    });
  case 'U':
    return isp.unlock();
  }
  return Promise.resolve(isp);
}

function catchError(error: any): void {
  let stack = error['stack'];
  console.error(stack ? stack : error);
  process.exit(1);
}


// Due to a node-serialport issue about file descriptor leak (open / close
// problems), the default baud rate and initial baud rate are equal.
function open(): Promise<FlashMagic.InSystemProgramming> {
  let path: string = program['port'];
  let baudrate: number = ~~program['baudrate'];
  let cclk: number = program['cclk'] / 1000; // must be in kHz
  let isp = new FlashMagic.InSystemProgramming(path, baudrate, cclk);
  isp.verbose = !!program['verbose'];
  return isp.open().then(isp => FlashMagic.handshake(isp));
}
