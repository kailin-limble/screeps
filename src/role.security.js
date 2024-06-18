var roleSecurity = {

    /** @param {Creep} creep **/
    runExterminate: function(creep) {

        let hostileCreep = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS)
        let hostileStructure = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES)

        let hostile = hostileCreep ?? hostileStructure

        if(hostile != null && hostile.hits != null) {
            if(creep.attack(hostile) == ERR_NOT_IN_RANGE || creep.rangedAttack(hostile) == ERR_NOT_IN_RANGE) {
                creep.moveTo(hostile, {reusePath: 5, visualizePathStyle: {stroke: '#ff0000'}});
            }
            creep.say('🔫');
        }
        else {
            if(creep.memory.dest == null || Math.random() < 0.02) {
                creep.memory.dest = new RoomPosition(Math.floor(Math.random()*50), Math.floor(Math.random()*50), creep.pos.roomName)
            }
            creep.moveTo(creep.memory.dest.x, creep.memory.dest.y, {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
            creep.say('💤');
        }
	},

    runPatrol: function(creep) {

        let hostileCreeps = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 5)
        let hostileStructures = creep.pos.findInRange(FIND_HOSTILE_STRUCTURES, 5).filter(structure => structure.hits != null)

        let weakestHostile = [...hostileCreeps, ...hostileStructures].reduce(
            (prevHostile, hostile) => {
                if(prevHostile == null) {
                    return hostile
                }
                else if(prevHostile.hits > hostile.hits) {
                    return prevHostile
                }
                return hostile
            }, 
            null
        )

        if(weakestHostile != null) {
            if(creep.attack(weakestHostile) == ERR_NOT_IN_RANGE || creep.rangedAttack(weakestHostile) == ERR_NOT_IN_RANGE) {
                creep.moveTo(weakestHostile, {reusePath: 50, visualizePathStyle: {stroke: '#ff0000'}});
            }
            creep.say('🔫');
        }
        else {
            if(creep.memory.dest == null || Math.random() < 0.02) {
                creep.memory.dest = new RoomPosition(Math.floor(Math.random()*50), Math.floor(Math.random()*50), creep.pos.roomName)
            }
            creep.moveTo(creep.memory.dest.x, creep.memory.dest.y, {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
            creep.say('🧿');
        }
	}
};

module.exports = roleSecurity;