import { MyCreep } from './role.my-creep';

// abstract
export class Worker extends MyCreep {

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
            if(this.isPosWalkable(pos)) {
                return true
            }
        }
        return false
    }

    isPosWalkable(pos) {
        const look = pos.look()
        const obstacles = look.filter(obj => {
            return OBSTACLE_OBJECT_TYPES.includes(obj.type)
                || (OBSTACLE_OBJECT_TYPES.includes(obj.terrain) && obj.terrain != STRUCTURE_ROAD)
                || OBSTACLE_OBJECT_TYPES.includes(obj.structureType)
        })
        if(obstacles.length == 0) {
            return true
        }
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
                return;
            }
        }

        if(harvestErrCode == ERR_NOT_IN_RANGE || harvestErrCode == ERR_NOT_ENOUGH_ENERGY) {
            let safeUnoccupiedNonEmptySources = sources.filter(source =>
                this.hasAdjacentOpenning(source)
                && this.isSafeLocation(source.pos)
                && source.energy > 0
            )
            let closestSource = this.pos.findClosestByPath(safeUnoccupiedNonEmptySources)
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
