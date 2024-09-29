import { Worker } from './role.worker';

export class Upgrader extends Worker {

    run() {

        if(this.memory.working && this.store[RESOURCE_ENERGY] == 0) {
            this.memory.working = false;
	    }
	    if(!this.memory.working && (this.store.getFreeCapacity() == 0 || this.ticksToLive <= 35)) {
	        this.memory.working = true;
	    }

	    if(this.memory.working) {
            if(!this.isInHomeRoom()) {
                this.returnToHomeRoom()
                return;
            }
            
            if(this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
                this.moveTo(this.room.controller, {
                    reusePath: 5, 
                    range: 3,
                    visualizePathStyle: {stroke: '#770077'}
                });
            }
            this.say('⬆️');
        }
        else {
            this.smartHarvest()
        }
	}
};
