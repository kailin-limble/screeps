export class Utils {

    static getAdjacentPositions(target) {
        return [
            new RoomPosition(target.pos.x+1, target.pos.y, target.pos.roomName),
            new RoomPosition(target.pos.x+1, target.pos.y+1, target.pos.roomName),
            new RoomPosition(target.pos.x+1, target.pos.y-1, target.pos.roomName),
            new RoomPosition(target.pos.x-1, target.pos.y, target.pos.roomName),
            new RoomPosition(target.pos.x-1, target.pos.y+1, target.pos.roomName),
            new RoomPosition(target.pos.x-1, target.pos.y-1, target.pos.roomName),
            new RoomPosition(target.pos.x, target.pos.y+1, target.pos.roomName),
            new RoomPosition(target.pos.x, target.pos.y-1, target.pos.roomName),
        ]
    }

    static countAdjacentWalkables(source) {
        const adjacentPositions = this.getAdjacentPositions(source)
        let count = 0

        for(let pos of adjacentPositions) {
            if(this.isPosWalkable(pos)) {
                count++
            }
        }
        return count
    }
    
    static hasAdjacentOpenning(source) {
        const adjacentPositions = this.getAdjacentPositions(source)

        for(let pos of adjacentPositions) {
            if(this.isPosPassable(pos)) {
                return true
            }
        }
        return false
    }

    static isPosWalkable(pos) {
        const look = pos.look()
        const obstacle = look.find(obj => {
            return (obj.type == LOOK_TERRAIN && obj.terrain == 'wall')
                || (obj.type == LOOK_STRUCTURES && OBSTACLE_OBJECT_TYPES.includes(obj.structure.structureType))
        })
        const road = look.find(obj => {
            return obj.type == LOOK_STRUCTURES && obj.structure.structureType == STRUCTURE_ROAD
        })

        return road != null || obstacle == null;
    }

    static isPosPassable(pos) {
        const look = pos.look()
        const obstacle = look.find(obj => {
            return (obj.type == LOOK_TERRAIN && obj.terrain == 'wall')
                || (obj.type == LOOK_STRUCTURES && OBSTACLE_OBJECT_TYPES.includes(obj.structure.structureType))
        })
        const obstacleCreep = look.find(obj => {
            return obj.type == LOOK_CREEPS
        })
        const road = look.find(obj => {
            return obj.type == LOOK_STRUCTURES && obj.structure.structureType == STRUCTURE_ROAD
        })
        return (road != null || obstacle == null) && obstacleCreep == null;
    }

    static isPosOnRoomEdge(pos: RoomPosition) {
        return pos.x == 0 || pos.x == 49 || pos.y == 0 || pos.y == 49;
    }

    static isSafeLocation(pos: RoomPosition, range: number = 5) {
        return pos.findInRange(FIND_HOSTILE_CREEPS, range).filter(
            creep => !this.getAllies().includes(creep.owner.username)
        ).length == 0
    }

    static getAllies() {
        return Memory.allies ?? []
    }
}
