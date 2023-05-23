[![npm version](https://badge.fury.io/js/flashmagic.js.svg)](https://badge.fury.io/js/flashmagic.js)

### This project is very out of date and not maintained.
### Please refer to [lpc-flash](https://github.com/cinderblock/lpc-flash) for a more updated version.

# FlashMagic.js

A library for programming flash based microcontrollers from [NXP](http://www.nxp.com/microcontrollers) using a serial protocol.

It implements a function similar to [Flash Magic](http://www.flashmagictool.com) but using [Node.js](https://github.com/nodejs/node), [TypeScript](https://github.com/microsoft/typescript) and [node-serialport](https://github.com/voodootikigod/node-serialport) instead.

## Install via npm

```bash
$ sudo npm install -g flashmagic.js
$ flashmagic --help
```

## API

Please, refer to [cli.ts](https://github.com/claudio-destro/flashmagic.js/blob/master/src/cli.ts) for more information about API usage.

Minimal sample code:

```javascript
import * as FlashMagic from 'flashmagic.js';

...

let isp = new FlashMagic.InSystemProgramming(path, baudrate, cclk);
isp
  .open()
  .then(isp => FlashMagic.handshake(isp))
  .catch(error => console.error(error));
```

## Build from code

I usually have `./node_modules/.bin` in my `PATH` so I just have to execute the following commands to perform a clean build:

```bash
$ typings install
$ npm install
```

## Disclaimer

This tool is **not** related to [Flash Magic](http://www.flashmagictool.com).

Its primary objective is just to communicate with a custom USB bootloader by using a well-known protocol.

A side effect is to be **100% compatible** with legacy [NXP](http://www.nxp.com/microcontrollers) serial bootloader.
