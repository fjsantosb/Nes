/**
* @author Francisco Santos Belmonte <fjsantosb@gmail.com>
*/

NES.Keyboard = function() {
	this.key = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
	this.state = 0x00;
	this.counter = 0x00;
};

NES.Keyboard.prototype = {
	reset: function() {
		for(i = 0; i < this.key.length; i++) {
			this.key[i] = 0x00;
		}
		this.state = 0x00;
		this.counter = 0x00;
		window.onkeydown = (function(e) {
			this.key_down(e);
		}).bind(this);
		window.onkeyup = (function(e) {
			this.key_up(e);
		}).bind(this);
	},

	set_key: function(key, value) {
		switch(key) {
			// KEY A (Z)
			case 0x5a:
				this.key[0] = value;
			break;
			//KEY B (X)
			case 0x58:
				this.key[1] = value;
			break;
			// KEY SELECT (A)
			case 0x41:
				this.key[2] = value;
			break;
			// KEY START (S)
			case 0x53:
				this.key[3] = value;
			break;
			// KEY UP (UP ARROW)
			case 0x26:
				this.key[4] = value;
			break;
			// KEY DOWN (DOWN ARROW)
			case 0x28:
				this.key[5] = value;
			break;
			// KEY LEFT (LEFT ARROW)
			case 0x25:
				this.key[6] = value;
			break;
			// KEY RIGHT (RIGHT ARROW)
			case 0x27:
				this.key[7] = value;
			break;
		}
	},

	key_down: function(e) {
		this.set_key(e.keyCode, 0x01);
		e.preventDefault();
	},

	key_up: function(e) {
		this.set_key(e.keyCode, 0x00);
		e.preventDefault();
	},

	reset_controller_state: function(value) {
		this.state = value;
		if(this.state) {
			this.counter = 0x00;
		}
	},

	read_controller_state: function() {
		var value = this.key[this.counter];
		this.counter += 0x01;
		return value;
	}
};