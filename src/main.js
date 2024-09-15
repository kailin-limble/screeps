import { Spawner } from './script/spawner.js';
import { Dispatcher } from './script/dispatcher.js';
import { RoomManager } from './script/room-manager.js';

import { Utils } from './script/utils';
import { map } from './script/construction-map.js';

module.exports.loop = function () {

    // benchmark
    const BENCH_TICKS = 300
    if(Game.time % BENCH_TICKS == 0) {
        console.log(`------ GAME | tick ${Game.time} | population ${Object.keys(Game.creeps).length} ------`)
    }

    // global loop
    if(Game.time % 50 == 0) {
        let creepsModelCounts = {}
        let viableRoomsCount = 0

        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name];
            }
            else {
                if(creepsModelCounts[Game.creeps[name].memory.model] == null) {
                    creepsModelCounts[Game.creeps[name].memory.model] = 0
                }
                creepsModelCounts[Game.creeps[name].memory.model]++
            }
        }
        Memory.creepsModelCounts = creepsModelCounts

        for(const roomName in Game.rooms) {
            if(Game.rooms[roomName].storage != null && Game.rooms[roomName].storage.my) {
                viableRoomsCount++
            }
        }
        Memory.viableRoomsCount = viableRoomsCount
    }

    // main loop
    for(const roomName in Game.rooms) {
        const room = Game.rooms[roomName]

        // benchmark
        if(room.memory.energyHarvested == null) {
            room.memory.energyHarvested = 0
        }
        let benchSources = room.find(FIND_SOURCES)
        if(room.memory.sources == null) {
            let mineableSlots = 0
            let minMineableSlot = null
            for(const benchSource of benchSources) {
                let slots = Utils.countAdjacentWalkables(benchSource)
                mineableSlots += slots
                if(minMineableSlot == null || slots < minMineableSlot) {
                    minMineableSlot = slots
                }
            }
            room.memory.sources = {
                count: benchSources.length,
                mineableSlots: mineableSlots,
                minMineableSlot: minMineableSlot
            }
        }
        for(let source of benchSources) {
            if(source.ticksToRegeneration == 1) {
                room.memory.energyHarvested += Math.round((3000-source.energy)*(300/299))
            }
        }

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
                trucks: room.find(FIND_MY_CREEPS, {
                    filter: { memory: { role: 'truck' } }
                }),
                ranges: room.find(FIND_MY_CREEPS, {
                    filter: { memory: { model: 'RANGE' } }
                }),
                melees: room.find(FIND_MY_CREEPS, {
                    filter: { memory: { model: 'MELEE' } }
                }),
                medics: room.find(FIND_MY_CREEPS, {
                    filter: { memory: { model: 'MEDIC' } }
                }),
            }
        }

        if(Game.time % BENCH_TICKS == 0 && room.controller != null) {
            console.log(`ROOM ${roomName} | level ${room.controller.level}, ${room.controller.progress} | `,
                `population ${roomData.creeps.length} | efficiency ~${room.memory.energyHarvested}/${room.memory.sources.count * 3000 * (Game.time/300)}`
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

        // room actions
        const roomManager = new RoomManager(room, roomData)
        roomManager.runRoomActions()

        // assign roles to towers
        var towers = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        for(const tower of towers) {
            var closestHurtCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: (creep) => (creep.hits < creep.hitsMax && creep.hits < 900)
            });
            if(closestHurtCreep) {
                tower.heal(closestHurtCreep);
                continue;
            }

            var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => (structure.hits < structure.hitsMax && structure.hits < 9900 && structure.hits / structure.hitsMax < 0.50)
            });
            if(closestDamagedStructure) {
                tower.repair(closestDamagedStructure);
                continue;
            }

            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: (creep) => !Utils.getAllies().includes(creep.owner.username)
            });
            if(closestHostile) {
                tower.attack(closestHostile);
                continue;
            }
        }
    }
}