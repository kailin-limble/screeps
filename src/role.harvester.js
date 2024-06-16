var roleHelper = require('role-helper');

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {

	    if(creep.store.getFreeCapacity() > 0) {
            roleHelper.smartHarvest(creep)
        }
        else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_TOWER) && 
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            if(targets.length > 0) {
                for(let target of targets) {
                    if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        if(creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}}) != ERR_NO_PATH) {
                            break;
                        }
                    }
                }
            }
        }
	}
};

module.exports = roleHarvester;