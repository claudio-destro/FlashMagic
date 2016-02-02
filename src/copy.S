.section .text, "ax"  @ MUST EXECUTE IN RAM
.arm

.set MEMMAP,    0xE01FC040
.set IRQ,       0x80
.set FIQ,       0x40

.set IAP_ENTRY, 0x7FFFFFF1

                PUSH    {R0, R1, R2, LR}

@ Disable FIQ and IRQ exceptions

                MRS     R0, CPSR
                ORR     R1, R0, #(IRQ + FIQ)
                MSR     CPSR, R1
                PUSH    {R0}

@ Disable interrupt vectors re-mapping

                LDR     R1, =MEMMAP
                MOV     R0, #1
                STR     R0, [R1]

@ Invoke IAP function

                LDR     R0, =Command
                LDR     R1, =Result
                LDR     R2, =IAP_ENTRY
                MOV     LR, PC
                BX      R2

                LDR     R1, =Command
                STR     R0, [R1]

@ Re-map interrupt vectors Boot ROM

                LDR     R1, =MEMMAP
                MOV     R0, #0
                STR     R0, [R1]

@ Restore FIQ and IRQ exceptions

                POP     {R0}
                MSR     CPSR, R0

                POP     {R0, R1, R2, LR}
                BX      LR

Command:        .word   54            @ READ PART ID
Result:         .word   0
                .word   0
                .word   0
                .word   12000         @ CCLK in kHz

.pool

.end
