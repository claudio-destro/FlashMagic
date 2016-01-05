
// package it.vlab.lpc.flash;

// import java.io.IOException;
// import java.io.InputStream;

// public class LPCProgrammer {

// 	private final InSystemProgramming isp;
// 	private final FlashAddress flashAddress;
// 	private final RAMAddress bufferAddress;
// 	private final int bufferSize;

// 	public LPCProgrammer(InSystemProgramming isp, long address) throws IOException {
// 		this(isp, address, RAMAddress.BASE + 1024 * 10, 1 * 1024);
// 	}

// 	public LPCProgrammer(InSystemProgramming isp, long dst, long src, int len) throws IOException {
// 		this.isp = isp;
// 		this.flashAddress = FlashAddress.fromAddress(dst);
// 		this.bufferAddress = RAMAddress.newAddress(src);
// 		this.bufferSize = len;
// 	}

// 	public void program(InputStream in, int count) throws IOException {
// 		final FlashWriter writer = new FlashWriter(isp, bufferAddress);
// 		final Progress progress = isp.getProgress();
// 		progress.start(count);
// 		writer.setAddress(flashAddress);
// 		progress.prepareChunk(flashAddress, count);
// 		eraseBlock(count);
// 		while (count > 0) {
// 			final int chunkSize = Math.min(bufferSize, count);
// 			progress.uploadChunk(bufferAddress, chunkSize);
// 			final int written = writer.writeToRAM(in, chunkSize);
// 			progress.programChunk(writer.getAddress(), bufferAddress, chunkSize);
// 			count -= writer.copyRAMToFlash(written);
// 		}
// 		progress.finish();
// 	}

// 	private void eraseBlock(int count) throws IOException {
// 		final long dstAddr = flashAddress.getAddress();
// 		final int startSect = flashAddress.getSector();
// 		final int endSect = FlashMemory.addressToSector(dstAddr + count - 1);
// 		isp.sendUnlockCommand();
// 		isp.sendCommand("P " + startSect + " " + endSect);
// 		isp.sendCommand("E " + startSect + " " + endSect);
// 	}
// }
