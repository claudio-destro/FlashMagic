
export class Progress {

  private seq: number = 0;

	spin(count: number, total: number): void {
    process.stdout.write(`\r${'-\\|/'[this.seq++ % 4]} ${~~(count * 100 / total)}%\r`);
	}
}
