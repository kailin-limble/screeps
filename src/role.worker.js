var MyCreep = require('role.my-creep');

// abstract
class Worker extends MyCreep {
    
    hasAdjacentOpenning(source) {
        const adjacentPositions = [
            new RoomPosition(source.pos.x+1, source.pos.y, source.pos.roomName),
            new RoomPosition(source.pos.x+1, source.pos.y+1, source.pos.roomName),
            new RoomPosition(source.pos.x+1, source.pos.y-1, source.pos.roomName),
            new RoomPosition(source.pos.x-1, source.pos.y, source.pos.roomName),
            new RoomPosition(source.pos.x-1, source.pos.y+1, source.pos.roomName),
            new RoomPosition(source.pos.x-1, source.pos.y-1, source.pos.roomName),
            new RoomPosition(source.pos.x, source.pos.y+1, source.pos.roomName),
            new RoomPosition(source.pos.x, source.pos.y-1, source.pos.roomName),
        ]

        for(let pos of adjacentPositions) {
            const look = pos.look()
            if(look.length == 1 && ['plain', 'swamp'].includes(look[0].terrain)) {
                return true
            }
        }
        return false
    }

    isSafeLocation(pos) {
        return pos.findInRange(FIND_HOSTILE_CREEPS, 5).length == 0
    }

    smartHarvest() {
        var sources = this.room.find(FIND_SOURCES);

        let harvestErrCode = 0
        for(let source of sources) {
            harvestErrCode = this.harvest(source)
            if(harvestErrCode == OK) {
                break;
            }
        }

        if(harvestErrCode == ERR_NOT_IN_RANGE) {
            let safeAndUnoccupiedSources = sources.filter(source => this.hasAdjacentOpenning(source) && this.isSafeLocation(source.pos))
            let closestSource = this.pos.findClosestByPath(safeAndUnoccupiedSources)
            let moveErrCode = this.moveTo(closestSource, {reusePath: 5, visualizePathStyle: {stroke: '#777777'}})
            if(moveErrCode == ERR_NO_PATH) {
                console.log("source inaccesible")
	            this.say('❌');
            }
            else {
	            this.say('⛏️');
            }
        }
    }
}

module.exports = Worker;