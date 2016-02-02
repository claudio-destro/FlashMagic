
MEMORY
{
  RAM (rw) : ORIGIN = 0x40004000, LENGTH = 16K
}

SECTIONS
{
  .text : { } > RAM
  . = ALIGN(4);
  .data : { } > RAM
}
