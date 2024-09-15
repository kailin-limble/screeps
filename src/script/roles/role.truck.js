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

    convey() {
        if(this.memory.trucking && this.store[RESOURCE_ENERGY] == 0) {
            this.memory.trucking = false;
	    }
	    if(!this.memory.trucking && (this.store[RESOURCE_ENERGY] > 0 || this.ticksToLive <= 35)) {
	        this.memory.trucking = true;
	    }

        let storages = this.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_STORAGE) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        if(storages.length < 1) {
            return;
        }
        let storage = storages[0]

	    if(this.memory.trucking) {
            if(!this.isInHomeRoom()) {
                this.returnToHomeRoom()
                return;
            }
            
            if(this.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.moveTo(storage, {reusePath: 5, visualizePathStyle: {stroke: '#ffffff'}})
            }
            this.say('📥');
            return;
        }
        else {
            const links = this.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_LINK &&
                            structure.store[RESOURCE_ENERGY] > structure.store.getCapacity()/2 &&
                            structure.pos.inRangeTo(storage.pos, 2)
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
                    if(this.pickup(drops[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        this.moveTo(drops[0])
                    }
                }
            }
        }
    }
};
