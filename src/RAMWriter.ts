'use strict';
var Symbol = require('es6-symbol');

import {InSystemProgramming} from './InSystemProgramming';
import {FlashMemory} from './FlashMemory';
import {RAMAddress} from './RAMAddress';
import {ROMAddress} from './ROMAddress';

import * as stream from 'stream';

const _addressSym = Symbol();

function alignCount(count: number): number {
	count = ~~count;
	if ((count & 3) == 0) {
		return count;
	}
	return 4 + (count & ~3);
}

export class RAMWriter {

	static get LINES_PER_CHUNK() { return 20; }
	static get BYTES_PER_LINE() { return 45; }

	constructor(private isp: InSystemProgramming) {
	}

	set address(address: RAMAddress) { this[_addressSym] = address; }
	get address(): RAMAddress { return this[_addressSym]; }

	// private static final int readFully(byte[] buffer, InputStream in)
	// 		throws IOException {
	// 	int index = 0;
	// 	for (final int length = buffer.length; index < length; ) {
	// 		final int bytesRead = in.read(buffer, index, length - index);
	// 		if (bytesRead < 0) {
	// 			break;
	// 		}
	// 		index += bytesRead;
	// 	}
	// 	return index; // XXX Do not care about last chunk's length
	// }

	// public int writeToRAM(InputStream in, int count) throws IOException {
	// 	assert in.markSupported() : "Input stream not buffered";
	// 	assert count > 0 : "Could not load less than 1 byte";
	// 	// Align count to word boundary and read chunk
	// 	final byte[] buffer = new byte[alignCount(count)];
	// 	count = alignCount(readFully(buffer, in));
	// 	if (count > 0) {
	// 		// Write chunk to RAM
	// 		isp.sendCommand("W " + address.getAddress() + " " + count);
	// 		uploadChunk(new ByteArrayInputStream(buffer), count);
	// 		isp.assertCmdSuccess();
	// 		// Go to next chunk address
	// 		address = address.increment(count);
	// 	}
	// 	return count;
	// }

	// private void uploadChunk(InputStream in, int count) throws IOException {
	// 	in.mark(LINES_PER_CHUNK * BYTES_PER_LINE);
	// 	final byte[] buffer = new byte[BYTES_PER_LINE];
	// 	final UUEncoder uue = new UUEncoder();
	// 	int lastByteCount = count;
	// 	int lineCount = 0;
	// 	int len;
	// 	do {
	// 		len = in.read(buffer, 0, Math.min(buffer.length, count));
	// 		if (len > 0) {
	// 			isp.sendLine(uue.encodeLine(buffer, 0, len));
	// 			count -= len;
	// 			lineCount++;
	// 		}
	// 		if (lineCount == LINES_PER_CHUNK || len < 0 || count == 0) {
	// 			isp.sendInteger(uue.getChecksum());
	// 			uue.reset();
	// 			lineCount = 0;
	// 			final String ok = isp.readLine();
	// 			if ("OK".equals(ok)) {
	// 				lastByteCount = count;
	// 				in.mark(LINES_PER_CHUNK * BYTES_PER_LINE);
	// 			} else {
	// 				count = lastByteCount;
	// 				in.reset();
	// 				len = 0;
	// 			}
	// 		}
	// 	} while (len >= 0 && count > 0);
	// }

}
