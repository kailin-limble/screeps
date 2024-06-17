var rolePolice = {

    /** @param {Creep} creep **/
    run: function(creep) {

        let hostileCreep = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS)
        let hostileStructure = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES)

        if(hostileCreep != null) {
            if(creep.attack(hostileCreep) == ERR_NOT_IN_RANGE || creep.rangedAttack(hostileCreep) == ERR_NOT_IN_RANGE) {
                creep.moveTo(hostileCreep, {visualizePathStyle: {stroke: '#ff0000'}});
            }
            creep.say('🔫');
        }
        if(hostileStructure != null) {
            if(creep.attack(hostileStructure) == ERR_NOT_IN_RANGE || creep.rangedAttack(hostileStructure) == ERR_NOT_IN_RANGE) {
                creep.moveTo(hostileStructure, {visualizePathStyle: {stroke: '#ff0000'}});
            }
            creep.say('🔫');
        }
	}
};

module.exports = rolePolice;