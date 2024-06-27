var Spawner = require('spawner');
var Dispatcher = require('dispatcher');

var constructionMap = require('construction-map');

module.exports.loop = function () {

    // benchmark
    if(Memory.tickCount == null) {
        Memory.tickCount = 0
        Memory.roomEnergyHarvested = 0
    }
    Memory.tickCount++
    const BENCH_TICKS = 300
    if(Memory.tickCount % BENCH_TICKS == 0) {
        console.log(`------ GAME | tick ${Memory.tickCount} | population: ${Object.keys(Game.creeps).length} ------`)
    }

    // main loop
    for(const roomName in Game.rooms) {
        const room = Game.rooms[roomName]
        
        const roomData = {
            creeps: room.find(FIND_MY_CREEPS),
            creepsByRole: {
                harvesters: room.find(FIND_MY_CREEPS, {
                    filter: { memory: { role: 'harvester' } }
                }),
                builders: room.find(FIND_MY_CREEPS, {
                    filter: { memory: { role: 'builder' } }
                }),
                upgraders: room.find(FIND_MY_CREEPS, {
                    filter: { memory: { role: 'upgrader' } }
                }),
                ranges: room.find(FIND_MY_CREEPS, {
                    filter: { memory: { model: 'RANGE' } }
                }),
                melees: room.find(FIND_MY_CREEPS, {
                    filter: { memory: { model: 'MELEE' } }
                }),
            }
        }

        // benchmark
        let benchSources = room.find(FIND_SOURCES)
        for(let source of benchSources) {
            if(source.ticksToRegeneration == 1) {
                Memory.roomEnergyHarvested += Math.round((3000-source.energy)*(300/299))
            }
        }
        if(Memory.tickCount % BENCH_TICKS == 0) {
            console.log(`ROOM ${roomName} | level ${room.controller.level}, ${room.controller.progress} | `,
                `population: ${roomData.creepsByRole.length} | efficiency: ~${Memory.roomEnergyHarvested}/${benchSources.length * 3000 * (Memory.tickCount/300)}`
            )
        }

        // init structures
        for(let structure in constructionMap[roomName]) {
            for(let level in constructionMap[roomName][structure]) {
                if(Number(level) <= room.controller.level) {
                    for(let location of constructionMap[roomName][structure][level]) {
                        room.createConstructionSite(location[0], location[1], structure)
                    }
                }
            }
        }

        // spawn creeps
        const spawner = new Spawner(room, roomData)
        if(spawner.spawn != null) {
            spawner.spawnCreeps()
        }

        // dispatch roles to creeps
        const dispatcher = new Dispatcher(roomData)
        dispatcher.dispatchRolesToCreeps()

        // assign roles to towers
        var towers = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        for(const tower of towers) {
            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(closestHostile) {
                tower.attack(closestHostile);
            }

            var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => (structure.hits < structure.hitsMax && structure.hits < 9900)
            });
            if(closestDamagedStructure) {
                tower.repair(closestDamagedStructure);
            }
        }
    }
}