import { Worker } from './role.worker';

export class Truck extends Worker {

    run() {

        if(this.memory.trucking && this.store[RESOURCE_ENERGY] == 0) {
            this.memory.trucking = false;
	    }
	    if(!this.memory.trucking && (this.store.getFreeCapacity() == 0 || this.ticksToLive <= 35)) {
	        this.memory.trucking = true;
	    }

	    if(this.memory.trucking) {
            if(!this.isInHomeRoom()) {
                this.returnToHomeRoom()
                return;
            }
            
            var targets = this.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            if(targets.length > 0) {
                let target = this.pos.findClosestByPath(targets)
                if(this.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.moveTo(target, {reusePath: 5, visualizePathStyle: {stroke: '#ffffff'}})
                }
                this.say('📥');
                return;
            }
        }
        else {
            const storage = this.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_STORAGE &&
                            structure.store[RESOURCE_ENERGY] > 100;
                }
            })[0]

            if(storage != null) {
                if(this.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.moveTo(storage)
                }
                this.say('💰');
            }
        }
	}
};
