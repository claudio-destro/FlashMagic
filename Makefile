
copy.bin : copy.o
	arm-none-eabi-objcopy -O binary -j .data -j .text $< $@
	# arm-none-eabi-objdump -d $<

copy.o : src/copy.S
	arm-none-eabi-gcc -mcpu=arm7tdmi-s -mthumb-interwork -x assembler-with-cpp $< -o $@ -nostartfiles -T ./src/LPC2368.ld -static
