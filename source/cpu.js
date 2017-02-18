/**
* @author Francisco Santos Belmonte <fjsantosb@gmail.com>
*/

NES.Cpu = function(ppu, input_1, input_2) {
	this.vector_table = {nmi: 0x0000, reset: 0x0000, irq: 0x0000};
	this.register = {a: 0x00, x: 0x00, y: 0x00, p: 0x00, sp: 0xff, pc: 0x0000};
	this.memory = [];
	this.cycles = 0x0000;
	this.clock = 1.79 * 1000000;

	this.input_1 = input_1;
	this.input_2 = input_2;
	this.ppu = ppu;

	this.buffered = 0x00;
};

NES.Cpu.prototype = {
	clean_memory: function() {
		for(var i = 0; i < 0xffff; i++) {
			this.memory[i] = 0x0000;
		}
	},

	load_prg_rom: function(rom, bank_size) {
		var address = (bank_size.prg_rom > 1) ? 0x8000 : 0xC000;
		for(var i = 0; i < bank_size.prg_rom * 0x4000; i++) {
			this.memory[address + i] = rom[i];
		}
	},
	
	load_vector_table: function() {
		this.vector_table.nmi = (this.memory[0xfffa + 0x01] << 8) + this.memory[0xfffa];
		this.vector_table.reset = (this.memory[0xfffc + 0x01] << 8) + this.memory[0xfffc];
		this.vector_table.irq = (this.memory[0xfffe + 0x01] << 8) + this.memory[0xfffe];
	},

	reset: function() {
		this.register = {a: 0x00, x: 0x00, y: 0x00, p: 0x00, sp: 0xff, pc: this.vector_table.reset};
		this.cycles = 0x0000;
	},

	run: function() {
		var opcode = this.memory[this.register.pc];
		switch(opcode) {
			case 0x00:
				this.instruction_brk();
				this.register.pc += 0x02;
				this.cycles += 0x07;
			break;
			case 0x01:
				this.instruction_ora(this.addressing_mode_indexed_indirect())
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0x05:
				this.instruction_ora(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0x06:
				this.instruction_asl(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x05;
			break;
			case 0x08:
				this.instruction_php();
				this.register.pc += 0x01;
				this.cycles += 0x03;
			break;
			case 0x09:
				this.instruction_ora(this.addressing_mode_immediate());
				this.register.pc += 0x02;
				this.cycles += 0x02;
			break;
			case 0x0a:
				this.register.a = this.instruction_asl_a(this.register.a);
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0x0d:
				this.instruction_ora(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x0e:
				this.instruction_asl(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x06;
			break;
			case 0x10:
				var value = this.instruction_bpl();
				this.register.pc += value;
				(value === 0x02) ? this.cycles += 0x02 : this.cycles += 0x03;
			break;
			case 0x11:
				this.instruction_ora(this.addressing_mode_indirect_indexed());
				this.register.pc += 0x02;
				this.cycles += 0x05;
			break;
			case 0x15:
				this.instruction_ora(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x04;
			break;
			case 0x16:
				this.instruction_asl(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0x18:
				this.instruction_clc();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0x19:
				this.instruction_ora(this.addressing_mode_indexed_absolute_y());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x1d:
				this.instruction_ora(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x1e:
				this.instruction_asl(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03;
				this.cycles += 0x07;
			break;
			case 0x20:
				this.register.pc = this.instruction_jsr(this.addressing_mode_absolute());
				this.cycles += 0x06;
			break;
			case 0x21:
				this.instruction_and(this.addressing_mode_indexed_indirect());
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0x24:
				this.instruction_bit(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0x25:
				this.instruction_and(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0x26:
				this.instruction_rol(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x05;
			break;
			case 0x28:
				this.instruction_plp();
				this.register.pc += 0x01;
				this.cycles += 0x04;
			break;
			case 0x29:
				this.instruction_and(this.addressing_mode_immediate());
				this.register.pc += 0x02;
				this.cycles += 0x02;
			break;
			case 0x2a:
				this.register.a = this.instruction_rol_a(this.register.a);
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0x2c:
				this.instruction_bit(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x2d:
				this.instruction_and(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x2e:
				this.instruction_rol(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x05;
			break;
			case 0x30:
				var value = this.instruction_bmi();
				this.register.pc += value;
				(value === 0x02) ? this.cycles += 0x02 : this.cycles += 0x03;
			break;
			case 0x31:
				this.instruction_and(this.addressing_mode_indirect_indexed());
				this.register.pc += 0x02;
				this.cycles += 0x05;
			break;
			case 0x35:
				this.instruction_and(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x04;
			break;
			case 0x36:
				this.instruction_rol(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0x38:
				this.instruction_sec();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0x39:
				this.instruction_and(this.addressing_mode_indexed_absolute_y());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x3d:
				this.instruction_and(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x3e:
				this.instruction_rol(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03;
				this.cycles += 0x07;
			break;
			case 0x40:
				this.register.pc = this.instruction_rti();
				this.cycles += 0x06;
			break;
			case 0x41:
				this.instruction_eor(this.addressing_mode_indexed_indirect());
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0x45:
				this.instruction_eor(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0x46:
				this.instruction_lsr(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x05;
			break;
			case 0x48:
				this.instruction_pha();
				this.register.pc += 0x01;
				this.cycles += 0x03;
			break;
			case 0x49:
				this.instruction_eor(this.addressing_mode_immediate());
				this.register.pc += 0x02;
				this.cycles += 0x02;
			break;
			case 0x4a:
				this.register.a = this.instruction_lsr_a(this.register.a);
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0x4c:
				this.register.pc = this.instruction_jmp(this.addressing_mode_absolute());
				this.cycles += 0x03;
			break;
			case 0x4d:
				this.instruction_eor(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x4e:
				this.instruction_lsr(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x06;
			break;
			case 0x50:
				var value = this.instruction_bvc();
				this.register.pc += value;
				(value === 0x02) ? this.cycles += 0x02 : this.cycles += 0x03;
			break;
			case 0x51:
				this.instruction_eor(this.addressing_mode_indirect_indexed());
				this.register.pc += 0x02;
				this.cycles += 0x05;
			break;
			case 0x55:
				this.instruction_eor(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x04;
			break;
			case 0x56:
				this.instruction_lsr(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0x58:
				this.instruction_cli ();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0x59:
				this.instruction_eor(this.addressing_mode_indexed_absolute_y());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x5d:
				this.instruction_eor(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x5e:
				this.instruction_lsr(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03;
				this.cycles += 0x07;
			break;
			case 0x60:
				this.register.pc = this.instruction_rts();
				this.cycles += 0x06;
			break;
			case 0x61:
				this.instruction_adc(this.addressing_mode_indexed_indirect());
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0x65:
				this.instruction_adc(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0x66:
				this.instruction_ror(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x05;
			break;
			case 0x68:
				this.instruction_pla();
				this.register.pc += 0x01;
				this.cycles += 0x04;
			break;
			case 0x69:
				this.instruction_adc(this.addressing_mode_immediate());
				this.register.pc += 0x02;
				this.cycles += 0x02;
			break;
			case 0x6a:
				this.register.a = this.instruction_ror_a(this.register.a);
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0x6c:
				this.register.pc = this.instruction_jmp(this.addressing_mode_indirect());
				this.cycles += 0x05;
			break;
			case 0x6d:
				this.instruction_adc(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x6e:
				this.instruction_ror(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x06;
			break;
			case 0x70:
				var value = this.instruction_bvs();
				this.register.pc += value;
				(value === 0x02) ? this.cycles += 0x02 : this.cycles += 0x03;
			break;
			case 0x71:
				this.instruction_adc(this.addressing_mode_indirect_indexed());
				this.register.pc += 0x02;
				this.cycles += 0x05;
			break;
			case 0x75:
				this.instruction_adc(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x04;
			break;
			case 0x76:
				this.instruction_ror(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0x78:
				this.instruction_sei();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0x79:
				this.instruction_adc(this.addressing_mode_indexed_absolute_y());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x7d:
				this.instruction_adc(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x7e:
				this.instruction_ror(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03;
				this.cycles += 0x07;
			break;
			case 0x81:
				this.instruction_sta(this.addressing_mode_indexed_indirect());
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0x84:
				this.instruction_sty(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0x85:
				this.instruction_sta(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0x86:
				this.instruction_stx(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0x88:
				this.instruction_dey();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0x8a:
				this.instruction_txa();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0x8c:
				this.instruction_sty(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x8d:
				this.instruction_sta(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x8e:
				this.instruction_stx(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0x90:
				var value = this.instruction_bcc();
				this.register.pc += value;
				(value === 0x02) ? this.cycles += 0x02 : this.cycles += 0x03;
			break;
			case 0x91:
				this.instruction_sta(this.addressing_mode_indirect_indexed());
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0x94:
				this.instruction_sty(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x04;
			break;
			case 0x95:
				this.instruction_sta(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x04;
			break;
			case 0x96:
				this.instruction_stx(this.addressing_mode_indexed_zero_page_y());
				this.register.pc += 0x02;
				this.cycles += 0x04;
			break;
			case 0x98:
				this.instruction_tya();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0x99:
				this.instruction_sta(this.addressing_mode_indexed_absolute_y());
				this.register.pc += 0x03;
				this.cycles += 0x05;
			break;
			case 0x9a:
				this.instruction_txs();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0x9d:
				this.instruction_sta(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03;
				this.cycles += 0x05;
			break;
			case 0xa0:
				this.instruction_ldy(this.addressing_mode_immediate());
				this.register.pc += 0x02;
				this.cycles += 0x02;
			break;
			case 0xa1:
				this.instruction_lda(this.addressing_mode_indexed_indirect());
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0xa2:
				this.instruction_ldx(this.addressing_mode_immediate());
				this.register.pc += 0x02;
				this.cycles += 0x02;
			break;
			case 0xa4:
				this.instruction_ldy(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0xa5:
				this.instruction_lda(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0xa6:
				this.instruction_ldx(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0xa8:
				this.instruction_tay();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0xa9:
				this.instruction_lda(this.addressing_mode_immediate());
				this.register.pc += 0x02;
				this.cycles += 0x02;
			break;
			case 0xaa:
				this.instruction_tax();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0xac:
				this.instruction_ldy(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0xad:
				this.instruction_lda(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0xae:
				this.instruction_ldx(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0xb0:
				var value = this.instruction_bcs();
				this.register.pc += value;
				(value === 0x02) ? this.cycles += 0x02 : this.cycles += 0x03;
			break;
			case 0xb1:
				this.instruction_lda(this.addressing_mode_indirect_indexed());
				this.register.pc += 0x02;
				this.cycles += 0x05;
			break;
			case 0xb4:
				this.instruction_ldy(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x04;
			break;
			case 0xb5:
				this.instruction_lda(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x04;
			break;
			case 0xb6:
				this.instruction_ldx(this.addressing_mode_indexed_zero_page_y());
				this.register.pc += 0x02;
				this.cycles += 0x04;
			break;
			case 0xb8:
				this.instruction_clv();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0xb9:
				this.instruction_lda(this.addressing_mode_indexed_absolute_y());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0xba:
				this.instruction_tsx();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0xbc:
				this.instruction_ldy(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0xbd:
				this.instruction_lda(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0xbe:
				this.instruction_ldx(this.addressing_mode_indexed_absolute_y());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0xc0:
				this.instruction_cpy(this.addressing_mode_immediate());
				this.register.pc += 0x02;
				this.cycles += 0x02;
			break;
			case 0xc1:
				this.instruction_cmp(this.addressing_mode_indexed_indirect());
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0xc4:
				this.instruction_cpy(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0xc5:
				this.instruction_cmp(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0xc6:
				this.instruction_dec(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x05;
			break;
			case 0xc8:
				this.instruction_iny();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0xc9:
				this.instruction_cmp(this.addressing_mode_immediate());
				this.register.pc += 0x02;
				this.cycles += 0x02;
			break;
			case 0xca:
				this.instruction_dex();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0xcc:
				this.instruction_cpy(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0xcd:
				this.instruction_cmp(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0xce:
				this.instruction_dec(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x06;
			break;
			case 0xd0:
				var value = this.instruction_bne();
				this.register.pc += value;
				(value === 0x02) ? this.cycles += 0x02 : this.cycles += 0x03;
			break;
			case 0xd1:
				this.instruction_cmp(this.addressing_mode_indirect_indexed());
				this.register.pc += 0x02;
				this.cycles += 0x05;
			break;
			case 0xd5:
				this.instruction_cmp(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x04;
			break;
			case 0xd6:
				this.instruction_dec(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0xd8:
				this.instruction_cld();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0xd9:
				this.instruction_cmp(this.addressing_mode_indexed_absolute_y());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0xdd:
				this.instruction_cmp(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0xde:
				this.instruction_dec(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03
				this.cycles += 0x07;
			break;
			case 0xe0:
				this.instruction_cpx(this.addressing_mode_immediate());
				this.register.pc += 0x02;
				this.cycles += 0x02;
			break;
			case 0xe1:
				this.instruction_sbc(this.addressing_mode_indexed_indirect());
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0xe4:
				this.instruction_cpx(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0xe5:
				this.instruction_sbc(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x03;
			break;
			case 0xe6:
				this.instruction_inc(this.addressing_mode_zero_page());
				this.register.pc += 0x02;
				this.cycles += 0x05;
			break;
			case 0xe8:
				this.instruction_inx();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0xe9:
				this.instruction_sbc(this.addressing_mode_immediate());
				this.register.pc += 0x02;
				this.cycles += 0x02;
			break;
			case 0xea:
				this.instruction_nop();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0xec:
				this.instruction_cpx(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0xed:
				this.instruction_sbc(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;		
			case 0xee:
				this.instruction_inc(this.addressing_mode_absolute());
				this.register.pc += 0x03;
				this.cycles += 0x06;
			break;
			case 0xf0:
				var value = this.instruction_beq();
				this.register.pc += value;
				(value === 0x02) ? this.cycles += 0x02 : this.cycles += 0x03;
			break;
			case 0xf1:
				this.instruction_sbc(this.addressing_mode_indirect_indexed());
				this.register.pc += 0x02;
				this.cycles += 0x05;
			break;
			case 0xf5:
				this.instruction_sbc(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x04;
			break;
			case 0xf6:
				this.instruction_inc(this.addressing_mode_indexed_zero_page_x());
				this.register.pc += 0x02;
				this.cycles += 0x06;
			break;
			case 0xf8:
				this.instruction_sed();
				this.register.pc += 0x01;
				this.cycles += 0x02;
			break;
			case 0xf9:
				this.instruction_sbc(this.addressing_mode_indexed_absolute_y());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0xfd:
				this.instruction_sbc(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03;
				this.cycles += 0x04;
			break;
			case 0xfe:
				this.instruction_inc(this.addressing_mode_indexed_absolute_x());
				this.register.pc += 0x03;
				this.cycles += 0x07;
			break;
		}
	},

	// DOUBLE CHECK - OVERFLOW
	instruction_adc: function(address) {
		this.read_ppu(address);
		var carry = this.register.p & 0x01;
		var value = this.register.a + this.memory[address] + carry;
		(value > 0xff) ? this.p_status_carry(true) : this.p_status_carry(false);
		value &= 0xff;
		((((this.register.a & 0x80) === 0x80) && ((this.memory[address] & 0x80) === 0x80) && ((value & 0x80) === 0x00)) || (((this.register.a & 0x80) === 0x00) && ((this.memory[address] & 0x80) === 0x00) && ((value & 0x80) === 0x80))) ? this.p_status_overflow(true) : this.p_status_overflow(false);
		this.p_status_zero_negative(value);
		this.register.a = value;
	},

	instruction_and: function(address) {
		this.read_ppu(address);
		this.register.a &= this.memory[address];
		this.p_status_zero_negative(this.register.a);
	},

	// CHECK READ PORT
	instruction_asl: function(address) {
		this.read_ppu(address);
		(this.memory[address] & 0x80) === 0x00 ? this.p_status_carry(false) : this.p_status_carry(true);
		this.memory[address] = (this.memory[address] << 0x01) & 0xff;
		this.p_status_zero_negative(this.memory[address]);
		this.write_ppu(address);
	},

	instruction_asl_a: function(value) {
		(value & 0x80) === 0x00 ? this.p_status_carry(false) : this.p_status_carry(true);
		value = (value << 0x01) & 0xff;
		this.p_status_zero_negative(value);
		return value;
	},

	instruction_bcc: function() {
		var value = 0x00;
		((this.register.p & 0X01) === 0X01) ? value = 0x02 : value = 0x02 + this.memory[this.register.pc + 0x01];
		((value & 0x80) === 0x80) ? value = -((~value & 0xff) + 0x01) : value = value;
		return value;
	},

	instruction_bcs: function() {
		var value = 0x00;
		((this.register.p & 0X01) === 0X00) ? value = 0x02 : value = 0x02 + this.memory[this.register.pc + 0x01];
		((value & 0x80) === 0x80) ? value = -((~value & 0xff) + 0x01) : value = value;
		return value;
	},

	instruction_beq: function() {
		var value = 0x00;
		((this.register.p & 0x02) === 0x00) ? value = 0x02 : value = 0x02 + this.memory[this.register.pc + 0x01];
		((value & 0x80) === 0x80) ? value = -((~value & 0xff) + 0x01) : value = value;
		return value;
	},

	// IMMEDIATE ADDRESSING MODE AFFECTS OVERFLOW? (I READ NOT, IS THE ONLY THAT NOT AFFECT BUT NOT CONFIRMED)
	instruction_bit: function(address) {
		this.read_ppu(address);
		var value = this.register.a & this.memory[address];
		this.p_status_zero(value === 0);
		this.p_status_overflow((this.memory[address] & 0x40) !== 0);
		this.p_status_negative((this.memory[address] & 0x80) !== 0);
	},

	instruction_bmi: function() {
		var value = 0x00;
		((this.register.p & 0X80) === 0X00) ? value = 0x02 : value = 0x02 + this.memory[this.register.pc + 0x01];
		((value & 0x80) === 0x80) ? value = -((~value & 0xff) + 0x01) : value = value;
		return value;
	},

	instruction_bne: function() {
		var value = 0x00;
		((this.register.p & 0X02) === 0X02) ? value = 0x02 : value = 0x02 + this.memory[this.register.pc + 0x01];
		((value & 0x80) === 0x80) ? value = -((~value & 0xff) + 0x01) : value = value;
		return value;
	},

	instruction_bpl: function() {
		var value = 0x00;
		((this.register.p & 0X80) === 0X80) ? value = 0x02 : value = 0x02 + this.memory[this.register.pc + 0x01];
		((value & 0x80) === 0x80) ? value = -((~value & 0xff) + 0x01) : value = value;
		return value;
	},

	instruction_brk: function() {
		this.p_status_break(true);
		//this.interrupt(this.vector_table.nmi);
	},

	instruction_bvc: function() {
		var value = 0x00;
		((this.register.p & 0X40) === 0X40) ? value = 0x02 : value = 0x02 + this.memory[this.register.pc + 0x01];
		((value & 0x80) === 0x80) ? value = -((~value & 0xff) + 0x01) : value = value;
		return value;
	},

	instruction_bvs: function() {
		var value = 0x00;
		((this.register.p & 0X40) === 0X00) ? value = 0x02 : value = 0x02 + this.memory[this.register.pc + 0x01];
		((value & 0x80) === 0x80) ? value = -((~value & 0xff) + 0x01) : value = value;
		return value;
	},

	instruction_clc: function(value) {
		this.p_status_carry(false);
	},

	instruction_cld: function() {
		this.p_status_decimal(false);
	},

	instruction_cli: function() {
		this.p_status_interrupt(false);
	},

	instruction_clv: function() {
		this.p_status_overflow(false);
	},

	instruction_cmp: function(address) {
		this.read_ppu(address);
		(this.register.a >= this.memory[address]) ? this.p_status_carry(true) : this.p_status_carry(false);
		this.p_status_zero_negative((this.register.a - this.memory[address]) & 0xff);
	},

	instruction_cpx: function(address) {
		this.read_ppu(address);
		(this.register.x >= this.memory[address]) ? this.p_status_carry(true) : this.p_status_carry(false);
		this.p_status_zero_negative((this.register.x - this.memory[address]) & 0xff);
	},

	instruction_cpy: function(address) {
		this.read_ppu(address);
		(this.register.y >= this.memory[address]) ? this.p_status_carry(true) : this.p_status_carry(false);
		this.p_status_zero_negative((this.register.y - this.memory[address]) & 0xff);
	},

	instruction_dec: function(address) {
		this.read_ppu(address);
		this.memory[address] = (this.memory[address] - 0x01) & 0xff;
		this.p_status_zero_negative(this.memory[address]);
		this.write_ppu(address);
	},

	instruction_dex: function() {
		this.register.x = (this.register.x - 0x01) & 0xff;
		this.p_status_zero_negative(this.register.x);
	},

	instruction_dey: function() {
		this.register.y = (this.register.y - 0x01) & 0xff;
		this.p_status_zero_negative(this.register.y);
	},

	instruction_eor: function(address) {
		this.read_ppu(address);
		this.register.a ^= this.memory[address];
		this.p_status_zero_negative(this.register.a);
	},

	instruction_inc: function(address) {
		this.read_ppu(address);
		this.memory[address] = (this.memory[address] + 0x01) & 0xff;
		this.p_status_zero_negative(this.memory[address]);
		this.write_ppu(address);
	},

	instruction_inx: function() {
		this.register.x = (this.register.x + 0x01) & 0xff;
		this.p_status_zero_negative(this.register.x);
	},

	instruction_iny: function() {
		this.register.y = (this.register.y + 0x01) & 0xff;
		this.p_status_zero_negative(this.register.y);
	},

	instruction_jmp: function(address) {
		return address;
	},

	instruction_jsr: function(address) {
		var value = this.register.pc + 0x03 - 0x01;
		this.memory[this.register.sp + 0x100] = ((value >> 8) & 0xff);
		this.memory[this.register.sp + 0x100 - 0x01] = (value & 0xff);
		this.register.sp -= 0x02;
		return address;
	},

	instruction_lda: function(address) {
		this.read_ppu(address);
		this.register.a = this.memory[address];
		this.p_status_zero_negative(this.register.a);
	},

	instruction_ldx: function(address) {
		this.read_ppu(address);
		this.register.x = this.memory[address];
		this.p_status_zero_negative(this.register.x);
	},

	instruction_ldy: function(address) {
		this.read_ppu(address);
		this.register.y = this.memory[address];
		this.p_status_zero_negative(this.register.y);
	},

	// CHECK READ PORT
	instruction_lsr: function(address) {
		this.read_ppu(address);
		(this.memory[address] & 0x01) === 0x00 ? this.p_status_carry(false) : this.p_status_carry(true);
		this.memory[address] = (this.memory[address] >> 0x01) & 0xff;
		this.p_status_zero_negative(this.memory[address]);
		this.write_ppu(address);
	},

	instruction_lsr_a: function(value) {
		(value & 0x01) === 0x00 ? this.p_status_carry(false) : this.p_status_carry(true);
		value = (value >> 0x01) & 0xff;
		this.p_status_zero_negative(value);
		return value;
	},

	instruction_nop: function() {

	},

	instruction_ora: function(address) {
		this.read_ppu(address);
		this.register.a |= this.memory[address];
		this.p_status_zero_negative(this.register.a);
	},

	instruction_pha: function() {
		this.memory[this.register.sp + 0x100] = this.register.a;
		this.register.sp -= 0x01;
	},

	instruction_php: function() {
		this.memory[this.register.sp + 0x100] = this.register.p | 0x10;
		this.register.sp -= 0x01;
	},

	instruction_pla: function() {
		this.register.sp += 0x01;
		this.register.a = this.memory[this.register.sp + 0x100];
		this.p_status_zero_negative(this.register.a);
	},

	instruction_plp: function() {
		this.register.sp += 0x01;
		this.register.p = this.memory[this.register.sp + 0x100];
		this.register.p |= 0x20;
		this.p_status_break(false);
	},

	// CHECK READ PORT
	instruction_rol: function(address) {
		this.read_ppu(address);
		var carry = this.register.p & 0x01;
		((this.memory[address] & 0x80) === 0x00) ? this.p_status_carry(false) : this.p_status_carry(true);
		this.memory[address] = ((this.memory[address] << 0x01) & 0xff);
		(carry === 0) ? this.memory[address] |= 0x00 : this.memory[address] |= 0x01;
		this.p_status_zero_negative(this.memory[address]);
		this.write_ppu(address);
	},

	instruction_rol_a: function(value) {
		var carry = this.register.p & 0x01;
		((value & 0x80) === 0x00) ? this.p_status_carry(false) : this.p_status_carry(true);
		value = ((value << 0x01) & 0xff);
		(carry === 0) ? value |= 0x00 : value |= 0x01;
		this.p_status_zero_negative(value);
		return value;
	},

	// CHECK READ PORT
	instruction_ror: function(address) {
		this.read_ppu(address);
		var carry = this.register.p & 0x01;
		((this.memory[address] & 0x01) === 0x00) ? this.p_status_carry(false) : this.p_status_carry(true);
		this.memory[address] = ((this.memory[address] >> 0x01) & 0xff);
		(carry === 0) ? this.memory[address] |= 0x00 : this.memory[address] |= 0x80;
		this.p_status_zero_negative(this.memory[address]);
		this.write_ppu(address);
	},

	instruction_ror_a: function(value) {
		var carry = this.register.p & 0x01;
		((value & 0x01) === 0x00) ? this.p_status_carry(false) : this.p_status_carry(true);
		value = ((value >> 0x01) & 0xff);
		(carry === 0) ? value |= 0x00 : value |= 0x80;
		this.p_status_zero_negative(value);
		return value;
	},

	instruction_rti: function() {
		var address = (this.memory[this.register.sp + 0x100 + 0x03] << 8) + this.memory[this.register.sp + 0x100 + 0x02];
		this.register.p = this.memory[this.register.sp + 0x100 + 0x01];
		this.register.p |= 0x20;
		//this.p_status_interrupt(false);
		this.register.sp += 0x03;
		return address;
	},

	instruction_rts: function() {
		var address = (this.memory[this.register.sp + 0x100 + 0x02] << 8) + this.memory[this.register.sp + 0x100 + 0x01];
		this.register.sp += 0x02;
		return address + 0x01;
	},

	// DOUBLE CHECK - OVERFLOW
	instruction_sbc: function(address) {
		this.read_ppu(address);
		var carry = this.register.p & 0x01;
		var value = this.register.a - this.memory[address] - (1 - carry);
		(value < 0x00) ? this.p_status_carry(false) : this.p_status_carry(true);
		value &= 0xff;
		(((this.register.a & 0x80) === 0x80) && ((value & 0x80) === 0x00)) ? this.p_status_overflow(true) : this.p_status_overflow(false);
		this.p_status_zero_negative(value);
		this.register.a = value;
	},

	instruction_sec: function() {
		this.p_status_carry(true);
	},

	instruction_sed: function() {
		this.p_status_decimal(true);
	},

	instruction_sei: function() {
		this.p_status_interrupt(true);
	},

	instruction_sta: function(address) {
		this.memory[address] = this.register.a;
		this.write_ppu(address);
	},

	instruction_stx: function(address) {
		this.memory[address] = this.register.x;
		this.write_ppu(address);
	},

	instruction_sty: function(address) {
		this.memory[address] = this.register.y;
		this.write_ppu(address);
	},

	instruction_tax: function() {
		this.register.x = this.register.a;
		this.p_status_zero_negative(this.register.x);
	},

	instruction_tay: function() {
		this.register.y = this.register.a;
		this.p_status_zero_negative(this.register.y);
	},

	instruction_tsx: function() {
		this.register.x = this.register.sp;
		this.p_status_zero_negative(this.register.x);
	},

	instruction_txa: function() {
		this.register.a = this.register.x;
		this.p_status_zero_negative(this.register.a);
	},

	instruction_txs: function() {
		this.register.sp = this.register.x;
	},

	instruction_tya: function() {
		this.register.a = this.register.y;
		this.p_status_zero_negative(this.register.a);
	},

	// Bit 0
	p_status_carry: function(set_value) {
		set_value ? this.register.p |= 0x01 : this.register.p &= 0xfe;
	},

	// Bit 1
	p_status_zero: function(set_value) {
		set_value ? this.register.p |= 0x02 : this.register.p &= 0xfd;
	},

	// Bit 2
	p_status_interrupt: function(set_value) {
		set_value ? this.register.p |= 0x04 : this.register.p &= 0xfb;
	},

	// Bit 3
	p_status_decimal: function(set_value) {
		set_value ? this.register.p |= 0x08 : this.register.p &= 0xf7;
	},

	// Bit 4
	p_status_break: function(set_value) {
		set_value ? this.register.p |= 0x10 : this.register.p &= 0xef;
	},

	// Bit 6
	p_status_overflow: function(set_value) {
		set_value ? this.register.p |= 0x40 : this.register.p &= 0xbf;
	},

	// Bit 7
	p_status_negative: function(set_value) {
		set_value ? this.register.p |= 0x80 : this.register.p &= 0x7f;
	},

	p_status_zero_negative: function(value) {
		this.p_status_zero(value === 0);
		this.p_status_negative((value & 0x80) === 0x80);
	},

	addressing_mode_zero_page: function() {
		var address = this.memory[this.register.pc + 0x01];
		return address;
	},

	addressing_mode_indexed_zero_page_x: function() {
		var address = (this.memory[this.register.pc + 0x01] + this.register.x) & 0xff;
		return address;
	},

	addressing_mode_indexed_zero_page_y: function() {
		var address = (this.memory[this.register.pc + 0x01] + this.register.y) & 0xff;
		return address;
	},

	addressing_mode_absolute: function() {
		var address = (this.memory[this.register.pc + 0x02] << 8) + this.memory[this.register.pc + 0x01];
		return address;
	},

	addressing_mode_indexed_absolute_x: function() {
		var address = (((this.memory[this.register.pc + 0x02] << 8) + this.memory[this.register.pc + 0x01]) + this.register.x) & 0xffff;
		return address;
	},

	addressing_mode_indexed_absolute_y: function() {
		var address = (((this.memory[this.register.pc + 0x02] << 8) + this.memory[this.register.pc + 0x01]) + this.register.y) & 0xffff;
		return address;
	},

	// IMPROVE BUG?
	addressing_mode_indirect: function() {
		var address = (this.memory[this.register.pc + 0x02] << 8) + this.memory[this.register.pc + 0x01];
		var final_address = 0x0000;
		if (this.memory[this.register.pc + 0x01] === 0xff) {
			final_address = (this.memory[(address - 0xff) & 0xffff] << 8) + this.memory[address & 0xffff];
		} else {
			final_address = (this.memory[(address + 0x01) & 0xffff] << 8) + this.memory[address & 0xffff];
		}
		return final_address;
	},

	addressing_mode_immediate: function() {
		var address = this.register.pc + 0x01;
		return address;
	},

	addressing_mode_indexed_indirect: function() {
		var value = this.memory[this.register.pc + 0x01] + this.register.x;
		var address = (this.memory[(value + 0x01) & 0xff] << 8) + this.memory[value & 0xff];
		return address;
	},

	addressing_mode_indirect_indexed: function() {
		var value = this.memory[this.register.pc + 0x01];
		var address = (this.memory[(value + 0x01) & 0xff] << 8) + this.memory[value & 0xff];
		var final_address = (address + this.register.y) & 0xffff;
		return final_address;
	},

	interrupt: function(address) {
		var value = this.register.pc;
		this.memory[this.register.sp + 0x100] = ((value >> 8) & 0xff);
		this.memory[this.register.sp + 0x100 - 0x01] = (value & 0xff);
		this.memory[this.register.sp + 0x100 - 0x02] = this.register.p;
		this.register.sp -= 0x03;
		this.p_status_interrupt(true);
		this.register.pc = address;
		this.cycles += 0x07;
	},

	read_ppu: function(address) {
		switch(address) {
			case 0x2002:
				this.memory[address] = this.ppu.read_register(address);
			case 0x2004:
				this.memory[address] = this.ppu.read_register(address);
			case 0x2007:
				this.memory[address] = this.ppu.read_register(address);
			break;
			case 0x4016:
				this.memory[address] = this.input_1.read_controller_state();
			break;
			case 0x4017:
				this.memory[address] = this.input_2.read_controller_state();
			break;
		}
	},

	write_ppu: function(address) {
		switch(address) {
			case 0x2000:
				this.ppu.write_register(address, this.memory[address]);
			break;
			case 0x2001:
				this.ppu.write_register(address, this.memory[address]);
			break;
			case 0x2003:
				this.ppu.write_register(address, this.memory[address]);
			break;
			case 0x2004:
				this.ppu.write_register(address, this.memory[address]);
			break;
			case 0x2005:
				this.ppu.write_register(address, this.memory[address]);
			break;
			case 0x2006:
				this.ppu.write_register(address, this.memory[address]);
			break;
			case 0x2007:
				this.ppu.write_register(address, this.memory[address]);
			break;
			case 0x4014:
				for(i = 0; i <= 0xff; i++) {
					this.ppu.write_register(address, this.memory[(0x100 * this.memory[address]) + i]);
				}
				this.cycles += 0x200;
			break;
			case 0x4016:
				this.input_1.reset_controller_state(this.memory[address]);
				this.input_2.reset_controller_state(this.memory[address]);
			break;
		}
	}
};