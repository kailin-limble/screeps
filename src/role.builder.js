var roleHelper = require('role-helper');

var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {

	    if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
	    }
	    if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
	        creep.memory.building = true;
	    }

	    if(creep.memory.building) {
	        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(targets.length) {
                if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
			
	        var myStructures = creep.room.find(FIND_MY_STRUCTURES);
	        var walls = creep.room.find(FIND_STRUCTURES, {filter: (structure) => structure.structureType == STRUCTURE_WALL});
	        var repairTargets = myStructures.concat(walls).filter((target) => (target.hits ?? 0) < (target.hitsMax ?? 0))
			repairTargets.sort((a, b) => {
				function getPriority(target) {
					if(target.hits < 100) {
						return 0
					}
					else if(target.hits / target.hitsMax > 0.50 && target.hits / target.hitsMax < 1.00) {
						return 1
					}
					else if(target.hits < 30000) {
						return 2
					}
					else {
						return 3
					}
				}
				return getPriority(a) - getPriority(b)
			})

			let repairTarget = creep.pos.findClosestByPath(repairTargets.slice(0, 5))

            if(repairTarget != null) {
                if(creep.repair(repairTarget) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(repairTarget, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            creep.say('🚧');
	    }
	    else {
            roleHelper.smartHarvest(creep)
	    }
	}
};

module.exports = roleBuilder;