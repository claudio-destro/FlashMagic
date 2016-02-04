
export function validateVectorTable(buffer: Buffer, reserved: number = 0x14): void {
  buffer[reserved + 0] = 0;
  buffer[reserved + 1] = 0;
  buffer[reserved + 2] = 0;
  buffer[reserved + 3] = 0;
  let crc = 0;
  for (let i = 0; i < (4 * 8);) {
    crc += buffer[i++];
    crc += buffer[i++] << 8;
    crc += buffer[i++] << 16;
    crc += buffer[i++] << 24;
  }
  // Negate the result and place in the vector at reserved as little
  // endian again. The resulting vector table should checksum to 0.
  crc = (0 - crc) >>> 0; // Hack to convert crc to a UInt32
  buffer[reserved + 0] = (crc >>> 0) & 0xFF;
  buffer[reserved + 1] = (crc >>> 8) & 0xFF;
  buffer[reserved + 2] = (crc >>> 16) & 0xFF;
  buffer[reserved + 3] = (crc >>> 24) & 0xFF;
}
