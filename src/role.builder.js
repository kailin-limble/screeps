var Worker = require('role.worker');

class Builder extends Worker {

    run() {

	    if(this.memory.building && this.store[RESOURCE_ENERGY] == 0) {
            this.memory.building = false;
	    }
	    if(!this.memory.building && this.store.getFreeCapacity() == 0) {
	        this.memory.building = true;
	    }

	    if(this.memory.building) {
			//build
	        var targets = this.room.find(FIND_CONSTRUCTION_SITES);
            if(targets.length) {
                if(this.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    this.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffff00'}});
                }
				this.say('🚧');
				return;
            }
			
			//repair
	        var myStructures = this.room.find(FIND_MY_STRUCTURES);
	        var walls = this.room.find(FIND_STRUCTURES, {filter: (structure) => structure.structureType == STRUCTURE_WALL});
	        var repairTargets = myStructures.concat(walls).filter((target) => (target.hits ?? 0) < (target.hitsMax ?? 0))
			repairTargets.sort((a, b) => {
				function getPriority(target) {
					if(target.hits < 100) {
						return 0
					}
					else if(target.hits / target.hitsMax < 0.25 && target.hits < 9900) {
						return 1
					}
					else if(target.hits < 99900) {
						return 2
					}
					else {
						return 3
					}
				}
				return getPriority(a) - getPriority(b)
			})

			let repairTarget = this.pos.findClosestByPath(repairTargets.slice(0, 5))

            if(repairTarget != null) {
                if(this.repair(repairTarget) == ERR_NOT_IN_RANGE) {
                    this.moveTo(repairTarget, {reusePath: 5, visualizePathStyle: {stroke: '#7777ff'}});
                }
				this.say('🔧');
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

module.exports = Builder;