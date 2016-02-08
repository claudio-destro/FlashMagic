import {Progress} from './Progress';
import * as FlashMagic from './index';

var dump = require('buffer-hexdump');
import * as program from 'commander';
import * as path from 'path';
import * as fs from 'fs';

var defaultComPort = '/dev/tty.usbmodemFD131';

program
  .option('-P, --port [port]', `serial port [${defaultComPort}]`, defaultComPort)
  .option('-V, --verbose', `make the operation more talkative`, true);

program.command('write')
  .description('program file')
  .option('-A, --address <address>', 'ROM address', parseInt)
  .option('-I, --input <file>', 'input file', null)
  .action((cmd) => {
    FlashMagic.open(program['port'])
      .then((isp) => {
        isp.verbose = !!program['verbose'];
        return programFile(isp, cmd.input, cmd.address)
          .then(() => isp.close())
          .then(() => process.exit(0))
      })
      .catch(catchError);
  });

program.command('ping')
  .description('ping device')
  .action(() => {
    FlashMagic.open(program['port'])
      .then(isp => {
        isp.verbose = !!program['verbose'];
        pingDevice(isp);
      })
      .catch(catchError);
  });

program.command('read')
  .description('read memory')
  .option('-A, --address <address>', 'memory address', parseInt)
  .option('-L, --length <length>', 'length', parseInt)
  .option('-O, --output <file>', 'output file', null)
  .action((cmd) => {
    FlashMagic.open(program['port'])
      .then(isp => {
        isp.verbose = !!program['verbose'];
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
  return isp.unlock().then(() => {
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
  });
}

function pingDevice(isp: FlashMagic.InSystemProgramming): void {
  let count = 0;
  (function loop(): void {
    let start = Date.now();
    isp.readPartIdentification().then(partId => {
      console.log(`${FlashMagic.toProcessorString(partId)} seq=${count++} time=${Date.now() - start} ms`);
      setTimeout(loop, 1000);
    }).catch(error => {
      console.error(error);
      setTimeout(loop, 1000);
    });
  })();
}

function catchError(error: any): void {
  let stack = error['stack'];
  console.error(stack ? stack : error);
  process.exit(1);
}
