import { Spawner } from './script/spawner.js';
import { Dispatcher } from './script/dispatcher.js';

import { map } from './script/construction-map.js';

module.exports.loop = function () {

    // benchmark
    if(Memory.tickCount == null) {
        Memory.tickCount = 0
        Memory.roomEnergyHarvested = 0
    }
    Memory.tickCount++
    const BENCH_TICKS = 300
    if(Memory.tickCount % BENCH_TICKS == 0) {
        console.log(`------ GAME | tick ${Memory.tickCount} | population ${Object.keys(Game.creeps).length} ------`)
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
                `population ${roomData.creeps.length} | efficiency ~${Memory.roomEnergyHarvested}/${benchSources.length * 3000 * (Memory.tickCount/300)}`
            )
        }

        // init structures
        for(let structure in map[roomName]) {
            for(let level in map[roomName][structure]) {
                if(Number(level) <= room.controller.level) {
                    for(let location of map[roomName][structure][level]) {
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
            var closestHurtCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: (creep) => (creep.hits < creep.hitsMax && creep.hits < 900)
            });
            if(closestHurtCreep) {
                tower.heal(closestHurtCreep);
                break;
            }

            var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => (structure.hits < structure.hitsMax && structure.hits < 9900)
            });
            if(closestDamagedStructure) {
                tower.repair(closestDamagedStructure);
                break;
            }

            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(closestHostile) {
                tower.attack(closestHostile);
                break;
            }
        }
    }
}