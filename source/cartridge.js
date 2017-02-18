/**
* @author Francisco Santos Belmonte <fjsantosb@gmail.com>
*/

NES.Cartridge = function() {
	this.header = [];
	this.rom = [];
	this.nes_format = false;
	this.bank_size = {prg_rom: 0x0000, chr_rom: 0x0000}
};

NES.Cartridge.prototype = {
	load: function(file) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', file, false);
		xhr.overrideMimeType('text/plain; charset=x-user-defined');
		xhr.send();
		for(var i = 0; i < xhr.responseText.length; i++) {
			var code = xhr.responseText.charCodeAt(i) & 0xff;
			i < 0x10 ? this.header[i] = code : this.rom[i - 0x10] = code;
		}
	},

	check_header: function() {
		(this.header[0] === 0x4e && this.header[1] === 0x45 && this.header[2] === 0x53 && this.header[3] === 0x1a) ? this.nes_format = true : this.nes_format = false;
		this.bank_size.prg_rom = this.header[4]; // * 0x4000;
		this.bank_size.chr_rom = this.header[5]; // * 0x2000;
	}
};