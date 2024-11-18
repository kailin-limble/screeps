import { Spawner } from './script/spawner';
import { Dispatcher } from './script/dispatcher';
import { RoomManager } from './script/room-manager';

import { Utils } from './script/utils';
import { map } from './script/construction-map.js';

declare global { 
    interface Memory {
        securityAction?: string;
        allies?: string[];
    }
    interface CreepMemory {
        model?: string; 
        role?: string;
        homeRoom?: string;
        working?: boolean;
        storedAction?: {
            action: string;
            targetId: string;
            until?: number;
        };
        dest?: {
            x: number;
            y: number;
            roomName: string;
        }
    }
    interface RoomMemory {
        operatingMode?: 'starter' | 'efficient' | 'lowCpu';
        energyHarvested?: number;
        sources?: SourceData[];
        externalSources?: SourceData[];
    }

    interface SourceData {
        id: string;
        pos: {
            x: number;
            y: number;
            roomName: string;
        },
        harvestMode?: null | 'link' | 'container';
        mineableSlots: number;
    }
}

module.exports.loop = function () {

    // benchmark
    const BENCH_TICKS = 300
    if(Game.time % BENCH_TICKS == 0) {
        console.log(`------ GAME | tick ${Game.time} | population ${Object.keys(Game.creeps).length} ------`)
    }

    // global loop
    if(Game.time % BENCH_TICKS == 0) {
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name];
            }
        }
    }

    // main loop
    for(const roomName in Game.rooms) {
        const room = Game.rooms[roomName]

        // room data
        let sources = room.find(FIND_SOURCES)
        if(Game.time % BENCH_TICKS == 0) {
            if(room.memory.energyHarvested == null) {
                room.memory.energyHarvested = 0
            }

            room.memory.sources = sources.map(
                (source) => {
                    return {
                        id: source.id,
                        pos: source.pos,
                        mineableSlots: Utils.countAdjacentWalkables(source)
                    }
                }
            )

            let links = room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_LINK
                }
            })
            if(links.length >= 2 && room.storage != null) {
                room.memory.operatingMode = 'efficient'
            }
            else {
                room.memory.operatingMode = 'starter'
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
                    filter: { memory: { role: 'range' } }
                }),
                melees: room.find(FIND_MY_CREEPS, {
                    filter: { memory: { role: 'melee' } }
                }),
                medics: room.find(FIND_MY_CREEPS, {
                    filter: { memory: { role: 'medic' } }
                }),
            }
        }

        // benchmark
        if(room.controller?.my) {
            for(let source of sources) {
                if(source.ticksToRegeneration == 1) {
                    room.memory.energyHarvested = (room.memory.energyHarvested ?? 0) + Math.round((3000-source.energy)*(300/299))
                }
            }
        }
        if(Game.time % BENCH_TICKS == 0 && room.controller != null) {
            console.log(`ROOM ${roomName} | level ${room.controller.level}, ${room.controller.progress} | `,
                `population ${roomData.creeps.length} | efficiency ~${room.memory.energyHarvested}/${(room.memory.sources?.length ?? 0) * 3000 * (Game.time/300)}`
            )
        }

        // init structures
        for(let structure in map[roomName]) {
            for(let level in map[roomName][structure]) {
                if(Number(level) <= (room.controller?.level ?? 0)) {
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
    }
}