import {InSystemProgramming} from "./InSystemProgramming";
import {LPCProgrammer} from './LPCProgrammer';
import * as Handshake from "./Handshake";

import * as program from 'commander';
import * as path from 'path';
import * as fs from 'fs';

var defaultComPort = '/dev/tty.usbmodemFD131';

program
  .option('-P, --port [port]', `serial port [${defaultComPort}]`, defaultComPort);

program.command('flash <file>')
  .description('program file')
  .option('-A, --address <address>', 'flash address', parseInt)
  .action((file, cmd) => {
    Handshake.open(program['port'])
      .then((isp) => programFile(isp, file, cmd.address).then(() => isp.close()))
      .catch(catchError);
  });

program.command('ping')
  .description('ping device')
  .action(() => {
    Handshake.open(program['port'])
      .then((isp) => pingDevice(isp))
      .catch(catchError);
  });

program.command('handshake')
  .description('hardware handshake')
  .action(() => {
    Handshake.open(program['port'])
        .then(isp => isp.close())
        .catch(catchError);
  });

program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
}

function programFile(isp: InSystemProgramming, path: string, address: number): Promise<void> {
  return isp.unlock().then(() => {
    let size = fs.statSync(path).size;
    let count = 0;
    let programmer = new LPCProgrammer(isp, address, size);
    return new Promise<void>((resolve, reject) => {
      let stream = fs.createReadStream(path);
      programmer.program(stream)
        .on('start', () => console.log(`About to flash ${size} bytes...`))
        .on('chunk', buffer => count += buffer.length)
        .on('error', error => reject(error))
        .on('end', () => {
          console.log(`${path}: ${count} bytes written`);
          stream.close();
          resolve();
        });
    });
  });
}

function pingDevice(isp: InSystemProgramming): void {
  let count = 0;
  (function loop(): void {
    let start = Date.now();
    isp.unlock().then(() => {
      console.log(`PING seq=${count++} time=${Date.now() - start} ms`);
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