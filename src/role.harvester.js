var Worker = require('role.worker');

class Harvester extends Worker {

    run() {
	    if(this.memory.depositing && this.store[RESOURCE_ENERGY] == 0) {
            this.memory.depositing = false;
	    }
	    if(!this.memory.depositing && this.store.getFreeCapacity() == 0) {
	        this.memory.depositing = true;
	    }

	    if(this.memory.depositing) {
            var targets = this.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_TOWER) && 
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });

            if(targets.length > 0) {
                let target = this.pos.findClosestByPath(targets)
                if(this.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.moveTo(target, {reusePath: 5, visualizePathStyle: {stroke: '#ffffff'}})
                }
                this.say('📥');
            }
            else {
                if(this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
                    this.moveTo(this.room.controller, {reusePath: 5, visualizePathStyle: {stroke: '#770077'}});
                }
                this.say('⬆️');
            }
	    }
	    else {
            this.smartHarvest()
	    }
	}
};

module.exports = Harvester;