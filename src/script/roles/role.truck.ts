import { Worker } from './role.worker';

export class Truck extends Worker {

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
            
            var targets = this.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_SPAWN) &&
                                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ||
                           (structure.structureType == STRUCTURE_TOWER &&
                                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 750);
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
            if(this.room.storage != null) {
                if(this.withdraw(this.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.moveTo(this.room.storage)
                }
                this.say('💰');
            }
        }
	}

    convey() {
        if(this.memory.working && this.store[RESOURCE_ENERGY] == 0) {
            this.memory.working = false;
	    }
	    if(!this.memory.working && (this.store[RESOURCE_ENERGY] > 0 || this.ticksToLive <= 35)) {
	        this.memory.working = true;
	    }

        if(this.room.storage == null) {
            return;
        }

	    if(this.memory.working) {
            if(!this.isInHomeRoom()) {
                this.returnToHomeRoom()
                return;
            }
            
            if(this.transfer(this.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.moveTo(this.room.storage, {reusePath: 5, visualizePathStyle: {stroke: '#ffffff'}})
            }
            this.say('📥');
            return;
        }
        else {
            const links = this.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_LINK &&
                            structure.store[RESOURCE_ENERGY] > (structure.store.getCapacity() ?? 0)/2 &&
                            structure.pos.inRangeTo(this.room.storage.pos, 2)
                }
            })

            if(links.length > 0) {
                if(this.withdraw(links[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.moveTo(links[0])
                }
                this.say('💰');
            }
            else {
                let drops = this.pos.findInRange(FIND_DROPPED_RESOURCES, 3)
                if(drops.length > 0) {
                    if(this.pickup(drops[0]) == ERR_NOT_IN_RANGE) {
                        this.moveTo(drops[0])
                    }
                }
            }
        }
    }
};
