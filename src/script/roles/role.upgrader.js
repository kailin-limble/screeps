import { Worker } from './role.worker';

export class Upgrader extends Worker {

    run() {

        if(this.memory.upgrading && this.store[RESOURCE_ENERGY] == 0) {
            this.memory.upgrading = false;
	    }
	    if(!this.memory.upgrading && (this.store.getFreeCapacity() == 0 || this.ticksToLive <= 35)) {
	        this.memory.upgrading = true;
	    }

	    if(this.memory.upgrading) {
            if(!this.isInHomeRoom()) {
                this.returnToHomeRoomIfOwned()
                return;
            }
            
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
