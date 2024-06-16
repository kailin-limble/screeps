var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {

        function hasAdjacentOpenning(source) {
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

        function isSafeLocation(pos) {
            return pos.findInRange(FIND_HOSTILE_CREEPS, 5).length == 0
        }

	    if(creep.store.getFreeCapacity() > 0) {
            var sources = creep.room.find(FIND_SOURCES);

            let harvestErrCode = 0
            for(let source of sources) {
                harvestErrCode = creep.harvest(source)
                if(harvestErrCode == OK) {
                    break;
                }
            }

            if(harvestErrCode == ERR_NOT_IN_RANGE) {
                let safeAndUnoccupiedSources = sources.filter(source => hasAdjacentOpenning(source) && isSafeLocation(source.pos))
                let closestSource = creep.pos.findClosestByPath(safeAndUnoccupiedSources)
                let moveErrCode = creep.moveTo(closestSource, {reusePath: 5, visualizePathStyle: {stroke: '#ffaa00'}})
                if(moveErrCode != ERR_NO_PATH) {
                    console.log("source inaccesible")
                }
            }
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