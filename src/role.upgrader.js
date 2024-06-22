var Worker = require('role-helper');

class Upgrader extends Worker {

    run() {

        if(this.memory.upgrading && this.store[RESOURCE_ENERGY] == 0) {
            this.memory.upgrading = false;
	    }
	    if(!this.memory.upgrading && this.store.getFreeCapacity() == 0) {
	        this.memory.upgrading = true;
	    }

	    if(this.memory.upgrading) {
            if(this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
                this.moveTo(this.room.controller, {reusePath: 5, visualizePathStyle: {stroke: '#770077'}});
            }
            this.say('⬆️');
        }
        else {
            this.smartHarvest()
        }
	}
};

module.exports = Upgrader;