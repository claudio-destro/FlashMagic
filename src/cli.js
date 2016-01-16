#!/usr/bin/env node
'use strict';

var utils = require('./utils');
var InSystemProgramming = require('./InSystemProgramming').InSystemProgramming;

var file = process.argv[2];
var address = parseInt(process.argv[3]);
var comPort = process.argv[4] || '/dev/tty.usbmodemFD131';

utils.programFile(new InSystemProgramming(comPort), file, address)
        .then(() => process.exit())
        .catch(() => process.exit());
