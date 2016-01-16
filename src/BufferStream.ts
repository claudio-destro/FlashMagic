'use strict';

// http://www.bennadel.com/blog/2681-turning-buffers-into-readable-streams-in-node-js.htm

import * as stream from 'stream';

export class BufferStream extends stream.Readable {

    private offset: number = 0;

    constructor(private source: Buffer) {
        super();
        if (!Buffer.isBuffer(source)) {
            throw new TypeError("Source must be a buffer");
        }
        this.on("end", () => this.source = null);
    }

    _read(size: number): void {
        if (this.offset < this.source.length) {
            this.push(this.source.slice(this.offset, this.offset + size));
            this.offset += size;
        }
        if (this.offset >= this.source.length) {
            this.push(null);
        }
    }
}
