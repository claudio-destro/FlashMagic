# FlashMagic.js

A library for programming flash based microcontrollers from [NXP](http://www.nxp.com/microcontrollers) using a serial protocol.

It implements a function similar to [Flash Magic](http://www.flashmagictool.com) but using [Node.js](https://github.com/nodejs/node), [TypeScript](https://github.com/microsoft/typescript) and [node-serialport](https://github.com/voodootikigod/node-serialport) instead.

## Usage

Please, refer to [cli.ts](https://github.com/claudio-destro/flashmagic.js/blob/master/src/cli.ts) for more information about usage.

## Note

I usually have `./node_modules/.bin` in my `PATH` so I just have to execute the following commands to perform a clean build:

```bash
# npm install
# typings install
# gulp publish
```

## Disclaimer

This tool is **not** related to [Flash Magic](http://www.flashmagictool.com).

Its primary objective is just to communicate with a custom USB bootloader by using a well-known protocol.

A side effect is to be **100% compatible** with legacy [NXP](http://www.nxp.com/microcontrollers) serial bootlader.
