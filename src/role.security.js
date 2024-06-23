var MyCreep = require('role.my-creep');

class Security extends MyCreep {

    runExterminate() {

        let hostileCreep = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS)
        let hostileStructure = this.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES)

        let hostile = hostileCreep ?? hostileStructure

        if(hostile != null && hostile.hits != null) {
            if(this.attack(hostile) == ERR_NOT_IN_RANGE || this.rangedAttack(hostile) == ERR_NOT_IN_RANGE) {
                this.moveTo(hostile, {reusePath: 5, visualizePathStyle: {stroke: '#ff0000'}});
            }
            this.say('🔫');
        }
        else {
            if(this.memory.dest == null || Math.random() < 0.02) {
                this.memory.dest = new RoomPosition(Math.floor(Math.random()*50), Math.floor(Math.random()*50), this.pos.roomName)
            }
            this.moveTo(this.memory.dest.x, this.memory.dest.y, {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
            this.say('💤');
        }
	}

    runPatrol() {

        let hostileCreeps = this.pos.findInRange(FIND_HOSTILE_CREEPS, 5)
        let hostileStructures = this.pos.findInRange(FIND_HOSTILE_STRUCTURES, 5).filter(structure => structure.hits != null)

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
            if(this.attack(weakestHostile) == ERR_NOT_IN_RANGE || this.rangedAttack(weakestHostile) == ERR_NOT_IN_RANGE) {
                this.moveTo(weakestHostile, {reusePath: 50, visualizePathStyle: {stroke: '#ff0000'}});
            }
            this.say('🔫');
        }
        else {
            if(this.memory.dest == null || (Memory.tickCount % 10 == 0 && Math.random() < 0.05)) {
                this.memory.dest = new RoomPosition(Math.floor(Math.random()*48 + 1), Math.floor(Math.random()*48 + 1), this.pos.roomName)
            }
            this.moveTo(this.memory.dest.x, this.memory.dest.y, {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
            this.say('🧿');
        }
	}
};

module.exports = Security;