/**
* @author Francisco Santos Belmonte <fjsantosb@gmail.com>
*/

var NES = function() {
	this.cartridge = new NES.Cartridge();
	this.keyboard = new NES.Keyboard();
	this.gamepad = new NES.Gamepad();
	this.ppu = new NES.Ppu();
	this.cpu = new NES.Cpu(this.ppu, this.keyboard, this.gamepad);
};

NES.prototype = {
	reset: function() {
		this.cartridge.load('roms/nestress.nes');
		this.cartridge.check_header();

		this.cpu.clean_memory();
		this.cpu.load_prg_rom(this.cartridge.rom, this.cartridge.bank_size);
		this.cpu.load_vector_table();
		this.cpu.reset();

		this.ppu.clean_memory();
		this.ppu.load_chr_rom(this.cartridge.rom, this.cartridge.bank_size);
		this.ppu.reset();

		this.keyboard.reset();

		this.gamepad.reset();
	},
	run: function() {
		var exit = false;
		while(!exit) {
			this.cpu.cycles = 0x00;
			this.ppu.cycles = 0x00;
			this.cpu.run();
			while(!exit && this.ppu.cycles < (this.cpu.cycles * 0x03)) {
				this.ppu.run();
				if(this.ppu.render.scanline === 241 && this.ppu.render.pixel === 1) {
					(this.ppu.register.ppuctrl & 0x80) !== 0x00 ? this.cpu.interrupt(this.cpu.vector_table.nmi) : null;
				} else if(this.ppu.render.scanline === -1 && this.ppu.render.pixel === 1) {
					exit = true;
				}
			}
		}
		this.ppu.update_frame();
		window.requestAnimationFrame(this.run.bind(this));
	}
};