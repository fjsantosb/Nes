/**
* @author Francisco Santos Belmonte <fjsantosb@gmail.com>
*/

NES.Display = function () {
    this.canvas = document.getElementById('emulator');
    this.context = this.canvas.getContext('2d');
	this.image_data = this.context.createImageData(256, 240);
	this.palette = [0xff525252, 0xffb40000, 0xffa00000, 0xffb1003d, 0xff740069, 0xff00005b, 0xff00005f, 0xff001840, 0xff002f10, 0xff08aa08, 0xff006700, 0xff124200, 0xff6d2800, 0xff000000, 0xff000000, 0xff000000, 0xffc4d5e7, 0xffff4000, 0xffdc0e22, 0xffff476b, 0xffd7009f, 0xff680ad7, 0xff0019bc, 0xff0054b1, 0xff006a5b, 0xff008c03, 0xff00ab00, 0xff2c8800, 0xffa47200, 0xff000000, 0xff000000, 0xff000000, 0xfff8f8f8, 0xffffab3c, 0xffff7981, 0xffff5bc5, 0xffff48f2, 0xffdf49ff, 0xff476dff, 0xff00b4f7, 0xff00e0ff, 0xff00e375, 0xff03f42b, 0xff78b82e, 0xffe5e218, 0xff787878, 0xff000000, 0xff000000, 0xffffffff, 0xfffff2be, 0xfff8b8b8, 0xfff8b8d8, 0xffffb6ff, 0xffffc3ff, 0xffc7d1ff, 0xff9adaff, 0xff88edf8, 0xff83ffdd, 0xffb8f8b8, 0xfff5f8ac, 0xffffffb0, 0xfff8d8f8, 0xff000000, 0xff000000];
};

NES.Display.prototype = {
    set_pixel: function(x, y, attribute, memory, bit, palette_start_address, priority) {
		var color_palette = palette_start_address + (attribute * 0x04) + bit;
		var color = memory[color_palette];
		var index = (x + y * this.image_data.width) * 4;
		if((palette_start_address < 0x3f10) || (palette_start_address >= 0x3f10 && bit > 0)) {
			if(!priority || (priority && (this.image_data.data[index + 0x00] === 0x00 && this.image_data.data[index + 0x01] === 0x00 && this.image_data.data[index + 0x02] === 0x00))) {
				for(i = 0; i < 4; i++) {
					this.image_data.data[index + i] = (this.palette[color] >> (i * 8)) & 0x0000ff;
				}
			}
		}
    },

	draw_tile: function(x, y, attribute, memory, pattern, tile_number, palette_start_address, flip_h, flip_v, priority) {
		var bit = 0x00;
		var address = (pattern * 0x1000) + (tile_number * 0x10);
		for(var i = 0x00; i < 0x08; i += 0x01) {
			for(var j = 0x00; j < 0x08; j += 0x01) {
				var value_h = Math.abs((flip_h * 7) - (0x07 - j));
				var value_v = Math.abs((flip_v * 7) - i);
				bit = this.get_bit(memory[address + value_v], memory[address + value_v + 0x08], Math.pow(2, value_h));
				this.set_pixel(x + j, y + i, attribute, memory, bit, palette_start_address, priority);
			}
		}
	},

	draw_pixel: function(x, y, aux_x, aux_y, attribute, memory, pattern, tile_number, palette_start_address) {
		var address = (pattern * 0x1000) + (tile_number * 0x10);
		var value_h = Math.abs(0x07 - (aux_x % 8));
		var value_v = Math.abs(aux_y % 8);
		var bit = this.get_bit(memory[address + value_v], memory[address + value_v + 0x08], Math.pow(2, value_h));
		this.set_pixel(x, y, attribute, memory, bit, palette_start_address, 0x00);
	},

	get_bit: function(value_low, value_high, bit_value) {
		var bit = 0x00;
		var bit_low = 0x00;
		var bit_high = 0x00;

		((value_low & bit_value) === 0x00) ? bit_low = 0x00 : bit_low = 0x01;
		((value_high & bit_value) === 0x00) ? bit_high = 0x00 : bit_high = 0x01;
		bit = bit_low + (bit_high * 2);

		return bit;
	},

	dump: function() {
		this.context.putImageData(this.image_data, -8, -8);
	}
};