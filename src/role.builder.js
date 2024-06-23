var Worker = require('role.worker');

class Builder extends Worker {

    run() {

	    if(this.memory.building && this.store[RESOURCE_ENERGY] == 0) {
            this.memory.building = false;
	    }
	    if(!this.memory.building && (this.store.getFreeCapacity() == 0 || this.ticksToLive <= 25)) {
	        this.memory.building = true;
	    }

	    if(this.memory.building) {
			if(this.memory.continueActionUntil != null && Memory.tickCount <= (this.memory.continueActionUntil.tick ?? 0)) {
				this[this.memory.continueActionUntil.action](Game.getObjectById(this.memory.continueActionUntil.targetId))
				return;
			}

	        var constructureSites = this.room.find(FIND_CONSTRUCTION_SITES);
			
	        var myStructures = this.room.find(FIND_MY_STRUCTURES);
	        var walls = this.room.find(FIND_STRUCTURES, {filter: (structure) => [STRUCTURE_WALL, STRUCTURE_ROAD].includes(structure.structureType)});
	        var repairTargets = myStructures.concat(walls).filter((target) => (target.hits ?? 0) < (target.hitsMax ?? 0))
			
	        var repairTargetsPriority0 = []
	        var repairTargetsPriority1 = []
	        var repairTargetsPriority2 = []
	        var repairTargetsPriority3 = []

			for(let target of repairTargets) {
				if(target.hits < 900) {
					repairTargetsPriority0.push(target)
				}
				else if(target.hits / target.hitsMax < 0.25 && target.hits < 9900) {
					repairTargetsPriority1.push(target)
				}
				else if(target.hits < 99900) {
					repairTargetsPriority2.push(target)
				}
				else {
					repairTargetsPriority3.push(target)
				}
			}

			let repairTarget = null

			//repair priority 0 and 1
			if(repairTargetsPriority0.length > 0) {
				repairTarget = this.pos.findClosestByPath(repairTargetsPriority0)
			}
			else if(repairTargetsPriority1.length > 0) {
				repairTarget = this.pos.findClosestByPath(repairTargetsPriority1)
			}

            if(repairTarget != null) {
                if(this.repair(repairTarget) == ERR_NOT_IN_RANGE) {
                    this.moveTo(repairTarget, {reusePath: 5, visualizePathStyle: {stroke: '#7777ff'}});
                }
				else {
					this.continueActionUntil('repair', repairTarget.id, Memory.tickCount + 10)
				}
				this.say('🔧');
				return;
            }


			//build
            if(constructureSites.length) {
                if(this.build(constructureSites[0]) == ERR_NOT_IN_RANGE) {
                    this.moveTo(constructureSites[0], {visualizePathStyle: {stroke: '#ffff00'}});
                }
				this.say('🚧');
				return;
            }
			
			//repair priority 2 and 3
			if(repairTargetsPriority2.length > 0) {
				repairTarget = this.pos.findClosestByPath(repairTargetsPriority2)
			}
			else if(repairTargetsPriority3.length > 0) {
				repairTarget = this.pos.findClosestByPath(repairTargetsPriority3)
			}

            if(repairTarget != null) {
                if(this.repair(repairTarget) == ERR_NOT_IN_RANGE) {
                    this.moveTo(repairTarget, {reusePath: 5, visualizePathStyle: {stroke: '#7777ff'}});
                }
				this.say('🔧');
				return;
            }
	    }
	    else {
            this.smartHarvest()
	    }
	}
};

module.exports = Builder;