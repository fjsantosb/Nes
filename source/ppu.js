/**
* @author Francisco Santos Belmonte <fjsantosb@gmail.com>
*/

NES.Ppu = function() {
	this.display = new NES.Display();
	this.register = {ppuctrl: 0x00, ppumask: 0x00, ppustatus: 0x00, oamaddr: 0x0000, oamdata: 0x00, ppuscroll: 0x00,  ppuaddr: 0x0000,  ppudata: 0x00};
	this.render = {scanline: -1, pixel: 0x00};
	this.scroll = {x: 0x00, y: 0x00};
	this.memory = [];
	this.oam = [];
	this.cycles = 0x0000;
	this.clock = 5.37 * 1000000;

	this.internal_buffer = 0x00;

	this.write_counter_ppu = 0x00;
	this.write_counter_oamdma = 0x00;
};

NES.Ppu.prototype = {
	clean_memory: function() {
		for(var i = 0; i < 0x4000; i++) {
			this.memory[i] = 0x0000;
		}
	},

	load_chr_rom: function(rom, bank_size) {
		for(var i = 0; i < bank_size.chr_rom * 0x2000; i++) {
			this.memory[i] = rom[(bank_size.prg_rom * 0x4000) + i];
		}
	},

	reset: function() {
		this.register = {ppuctrl: 0x00, ppumask: 0x00, ppustatus: 0x80, oamaddr: 0x0000, oamdata: 0x00, ppuscroll: 0x00,  ppuaddr: 0x0000,  ppudata: 0x00};
		this.render = {scanline: -1, pixel: 0x00};
		this.scroll = {x: 0x00, y: 0x00};
		for(var i = 0; i <= 0xff; i++) {
			this.oam[i] = 0x00;
		}
		this.cycles = 0x00;

		this.internal_buffer = 0x00;

		this.write_counter_ppu = 0x00;
		this.write_counter_oamdma = 0x00;
	},

	run: function() {
		this.draw_background(this.render.pixel, this.render.scanline);
		this.update_scanlines();
	},

	update_frame: function() {
		this.draw_sprites();
		this.display.dump();
	},

	read_register: function(address) {
		var value = 0x00;
		switch(address) {
			case 0x2002:
				value = this.register.ppustatus;
				this.write_counter_ppu = 0x00;
			break;
			case 0x2004:
				value = this.memory[this.register.oamaddr];
				this.register.oamaddr += 0x01;
			break;
			case 0x2007:
				value = this.internal_buffer;
				this.internal_buffer = this.memory[this.register.ppuaddr];
				((this.register.ppuctrl & 0x04) === 0x00) ? this.register.ppuaddr += 0x01 : this.register.ppuaddr += 0x20;
			break;
		}
		return value;
	},

	write_register: function(address, value) {
		switch(address) {
			case 0x2000:
				this.register.ppuctrl = value;
			break;
			case 0x2001:
				this.register.ppumask = value;
			break;
			case 0x2003:
				this.register.ppumask = value;
			break;
			case 0x2004:
				this.oam[this.register.oamaddr] = value;
				this.register.oamaddr += 0x01;
			break;
			case 0x2005:
				(this.write_counter_ppu === 0x00) ? this.scroll.x = value : this.scroll.y = value;
				((this.write_counter_ppu + 0x01) === 0x02) ? this.write_counter_ppu = 0x00 : this.write_counter_ppu += 0x01;
			break;
			case 0x2006:
				(this.write_counter_ppu === 0x00) ? this.register.ppuaddr = ((value << 8) & 0xff00) : this.register.ppuaddr += value;
				((this.write_counter_ppu + 0x01) === 0x02) ? this.write_counter_ppu = 0x00 : this.write_counter_ppu += 0x01;
			break;
			case 0x2007:
				this.memory[this.register.ppuaddr] = value;
				((this.register.ppuctrl & 0x04) === 0x00) ? this.register.ppuaddr += 0x01 : this.register.ppuaddr += 0x20;
			break;
			case 0x4014:
				this.oam[this.write_counter_oamdma] = value;
				((this.write_counter_oamdma + 0x01) === 0x100) ? this.write_counter_oamdma = 0x00 : this.write_counter_oamdma += 0x01;
			break;
		}
	},

	update_scanlines: function() {
		this.render.pixel += 0x01;
		if(this.render.pixel > 340) {
			this.render.pixel = 0x00;
			this.render.scanline += 0x01;
		} else if(this.render.scanline > 260) {
			this.render.scanline = -1;
		}
		if(this.render.scanline === 241 && this.render.pixel === 0x01) {
			this.register.ppustatus |= 0x80;
			this.register.ppustatus |= 0x40;
		} else if(this.render.scanline === -1 && this.render.pixel === 0x01) {
			this.register.ppustatus &= 0x7f;
			this.register.ppustatus &= 0xbf;
		}
		this.cycles += 0x01;
	},

	draw_background: function(x, y) {
		if(x >= 0 && x < 256 && y >= 0 && y < 240) {
			var aux_x = x + this.scroll.x;
			var aux_y = y + this.scroll.y;
			var nametable_address = 0x2000 + ((this.register.ppuctrl & 0x03) * 0x400);
			var pattern_table = ((this.register.ppuctrl & 0x10) === 0 ? 0x00 : 0x01);
			if(aux_y >= 240) {
				aux_y -= 240;
				if(nametable_address === 0x2000) {
					nametable_address = 0x2800;
				} else if(nametable_address === 0x2800) {
					nametable_address = 0x2000;
				}
			}
			if(aux_x >= 256) {
				aux_x -= 256;
				if(nametable_address === 0x2000) {
					nametable_address = 0x2400;
				} else if(nametable_address === 0x2400) {
					nametable_address = 0x2000;
				}
			}
			var i = Math.floor(x / 8) + (Math.floor(aux_y / 8) * 32);
			var value = this.memory[960 + nametable_address + (Math.floor(i / 4) % 8) + (Math.floor(i / 128) * 8)];
			var attribute = (value >> (((Math.floor(i / 2) % 2) * 2) + ((Math.floor(i / 64) % 2) * 4))) & 0x03;
			var palette_address = 0x3f00;
			this.display.draw_pixel(x, y, aux_x, aux_y, attribute, this.memory, pattern_table, this.memory[nametable_address + i], palette_address);
		}
	},

	draw_sprites: function() {
		var sprite_size = (((this.register.ppuctrl & 0x20) === 0x00) ? 0x00 : 0x01);
		var sprite_pattern_table = (((this.register.ppuctrl & 0x08) === 0x00) ? 0x00 : 0x01);
		var pattern_table = sprite_pattern_table;
		for(var i = 0x00; i <= 0xff; i = i + 0x04 ) {
			var byte_0 = this.oam[i] + 1;
			var byte_1 = this.oam[i + 0x01];
			var byte_2 = 0x00;
			var byte_3 = this.oam[i + 0x03];
			var attribute = this.oam[i + 0x02] & 0x03;
			var palette_address = 0x3f10;
			var flip_h = ((this.oam[i + 0x02] & 0x40) === 0x00 ? 0x00 : 0x01);
			var flip_v = ((this.oam[i + 0x02] & 0x80) === 0x00 ? 0x00 : 0x01);
			var priority = ((this.oam[i + 0x02] & 0x20) === 0x00 ? 0x00 : 0x01);
			if(sprite_size) {
				pattern_table = byte_1 & 0x01;
				byte_1 &= 0xfe;
			}
			if(byte_0 < 0xef) {
				this.display.draw_tile(byte_3, byte_0, attribute, this.memory, pattern_table, byte_1, palette_address, flip_h, flip_v, priority);
			}
			
		}
	}
};