/**
* @author Francisco Santos Belmonte <fjsantosb@gmail.com>
*/

NES.Gamepad = function() {
    this.gamepad = null;
    this.state = 0x00;
    this.counter = 0x00;
};

NES.Gamepad.prototype = {
    reset: function() {
        window.addEventListener("gamepadconnected", function(e) {
            gamepad = navigator.getGamepads()[e.gamepad.index];
            console.log('Gamepad connected');
        });
        window.addEventListener("gamepaddisconnected", function(e) {
            console.log('Gamepad disconnected');
        });
    },

    reset_controller_state: function(value) {
		this.state = value;
        if(this.state) {
            this.counter = 0x00;
        }
	},

    read_controller_state: function() {
        var i = 0;
        var gamepad = navigator.getGamepads()[i];
        var value = 0x00;
        if(gamepad !== null) {
            switch(this.counter) {
                case 0x00:
                    value = gamepad.buttons[0].value;
                break;
                case 0x01:
                    value = gamepad.buttons[1].value;
                break;
                case 0x02:
                    value = gamepad.buttons[10].value;
                break;
                case 0x03:
                    value = gamepad.buttons[11].value;
                break;
                case 0x04:
                    gamepad.axes[1] === -1 ? value = 1 : value = 0;
                break;
                case 0x05:
                    gamepad.axes[1] === 1 ? value = 1 : value = 0;
                break;
                case 0x06:
                    gamepad.axes[0] === -1 ? value = 1 : value = 0;
                break;
                case 0x07:
                    gamepad.axes[0] === 1 ? value = 1 : value = 0;
                break;
            }
        }
        this.counter += 0x01;
        return value;
    }
};