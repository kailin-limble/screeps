var roleHelper = require('role-helper');

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        
	    if(creep.memory.depositing && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.depositing = false;
	    }
	    if(!creep.memory.depositing && creep.store.getFreeCapacity() == 0) {
	        creep.memory.depositing = true;
	    }

	    if(creep.memory.depositing) {
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
                        if(creep.moveTo(target, {reusePath: 5, visualizePathStyle: {stroke: '#ffffff'}}) != ERR_NO_PATH) {
                            break;
                        }
                    }
                }
                creep.say('📥');
            }
            else {
                if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, {reusePath: 5, visualizePathStyle: {stroke: '#770077'}});
                }
                creep.say('⬆️');
            }
	    }
	    else {
            roleHelper.smartHarvest(creep)
	    }
	}
};

module.exports = roleHarvester;