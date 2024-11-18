import { Utils } from './utils';

export class Spawner {

    MODELS = {
        WORKER: [WORK, CARRY, MOVE],
        CLAIMER: [CLAIM, MOVE],
        TRUCK: [CARRY, MOVE, CARRY, MOVE],
        RANGE: [TOUGH, RANGED_ATTACK, MOVE],
        MELEE: [TOUGH, TOUGH, ATTACK, MOVE, ATTACK, MOVE],
        MEDIC: [TOUGH, MOVE, HEAL, HEAL, HEAL, MOVE],

        HARVESTER: [CARRY, MOVE, CARRY, MOVE, WORK, WORK, WORK, WORK, WORK, WORK],
        UPGRADER: [
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, 
            WORK, WORK, WORK, WORK, WORK, 
            WORK, WORK, WORK, WORK, WORK, 
            WORK, WORK, WORK, WORK, WORK
        ],
    }
    CHAMPIONS = {
        RANGE: [
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, 
            MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, MOVE, 
            RANGED_ATTACK, RANGED_ATTACK, MOVE, RANGED_ATTACK, RANGED_ATTACK, MOVE, RANGED_ATTACK, RANGED_ATTACK, MOVE, 
            RANGED_ATTACK, RANGED_ATTACK, MOVE, RANGED_ATTACK, RANGED_ATTACK, MOVE, RANGED_ATTACK, RANGED_ATTACK, MOVE, 
            RANGED_ATTACK, RANGED_ATTACK, MOVE, RANGED_ATTACK, RANGED_ATTACK, MOVE, RANGED_ATTACK, RANGED_ATTACK, MOVE, 
            RANGED_ATTACK, RANGED_ATTACK, MOVE, RANGED_ATTACK, RANGED_ATTACK, MOVE, RANGED_ATTACK, RANGED_ATTACK, MOVE, 
        ],
        MELEE: [
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, 
            MOVE, MOVE, MOVE, MOVE, ATTACK, MOVE, 
            ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE, 
            ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE, 
            ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE, 
            ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE, 
        ],
        MEDIC: [
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, 
            MOVE, MOVE, MOVE, MOVE, HEAL, MOVE, 
            HEAL, HEAL, MOVE, HEAL, HEAL, MOVE, HEAL, HEAL, MOVE, 
            HEAL, HEAL, MOVE, HEAL, HEAL, MOVE, HEAL, HEAL, MOVE,
            HEAL, HEAL, MOVE, HEAL, HEAL, MOVE, HEAL, HEAL, MOVE, 
            HEAL, HEAL, MOVE, HEAL, HEAL, MOVE, HEAL, HEAL, MOVE
        ],
    }
    ENERGY = 3000 // energy per source per 300 tick cycle
    MINING_RATE = 150 // average energy mined per cycle per 1 work body part

    room: Room;
    spawn: StructureSpawn;
    roomData: {
        creeps: Creep[];
        creepsByRole: {
            [k: string]: Creep[];
        };
    };;

    constructor(room, roomData) {
        this.room = room
        this.spawn = room.find(FIND_MY_SPAWNS).find(spawn => spawn.spawning == null)
        this.roomData = roomData
    }

    getOptimalWorkForce() {
        if((this.room.memory.sources?.length ?? 0) == 0) {
            return {
                count: 0,
                cost: 0
            }
        }

        const singleWorkerCost = this.getSpawnCost(this.MODELS.WORKER)
        const largestWorkerSize = this.room.energyCapacityAvailable / singleWorkerCost

        let totalMineableSlots = (this.room.memory.sources ?? []).reduce((sum, source) => { return sum + source.mineableSlots}, 0)
        let minMineableSlot = Math.min(...(this.room.memory.sources ?? []).map((source) => { return source.mineableSlots}))

        let optimalWorkBodyParts = ((this.room.memory.sources?.length ?? 0) * this.ENERGY) / this.MINING_RATE
        let optimalWorkerCount = totalMineableSlots + ((this.room.memory.sources?.length ?? 0) * minMineableSlot)/3
        let optimalWorkerSize = optimalWorkBodyParts / optimalWorkerCount

        if(largestWorkerSize <= optimalWorkerSize) {
            optimalWorkerSize = largestWorkerSize
            optimalWorkerCount = totalMineableSlots * 2
        }

        let optimalWorkerCost = optimalWorkerSize * singleWorkerCost

        return {
            count: optimalWorkerCount,
            cost: optimalWorkerCost
        }
    }

    getArmyForceSize() {
        if(Memory.securityAction == 'runInvade') {
            return 3
        }
        return 1
    }

    getRangerReinforcementCount() {
        if(this.room.find(FIND_HOSTILE_CREEPS, {
            filter: (creep) => !Utils.getAllies().includes(creep.owner.username)
        }).length > 0) {
            return 2
        }
        return 0
    }

    getSpawnPriority() {
        // always start with a haverster
        if(this.roomData.creepsByRole.harvesters.length == 0) {
            this.spawnBiggestCreepOfModel(this.MODELS.WORKER, {model: 'WORKER', role: 'harvester'}, Math.min(this.room.energyAvailable, 1200))
            return null;
        }

        let optimalWorkForce = this.getOptimalWorkForce()
        let armyForceSize = this.getArmyForceSize()
        let rangerReinforcementCount = this.getRangerReinforcementCount()
        let truckCount = 0
        if(this.room.memory.operatingMode === 'efficient') {
            truckCount = 2
        }
        else if(Memory.securityAction == 'runInvade') {
            truckCount = 1
        }

        let spawnPriority = {
            workerBuilder: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(
                    this.MODELS.WORKER, {model: 'WORKER', role: 'builder', homeRoom: this.room.name}, 
                    optimalWorkForce.cost
                )
            },
            workerUpgrader: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(
                    this.MODELS.WORKER, {model: 'WORKER', role: 'upgrader', homeRoom: this.room.name}, 
                    optimalWorkForce.cost
                )
            },
            workerHarvester: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(
                    this.MODELS.WORKER, {model: 'WORKER', role: 'harvester', homeRoom: this.room.name}, 
                    optimalWorkForce.cost
                )
            },
            truck: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(
                    this.MODELS.TRUCK, {model: 'TRUCK', role: 'truck', homeRoom: this.room.name},
                    400
                )
            },
            range: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(this.MODELS.RANGE, {model: 'RANGE', role: 'range'})
            },
            melee: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(this.MODELS.MELEE, {model: 'MELEE', role: 'melee'})
            },
            medic: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(this.MODELS.MEDIC, {model: 'MEDIC', role: 'medic'})
            },
        }

        // value -1 to 1; 1 is highest priority; priority <= 0 is no spawn
        spawnPriority.workerHarvester.priority = (1 - 
            ((this.roomData.creepsByRole.harvesters.length + 1.75) / (optimalWorkForce.count*0.45 + 1))
        ) * 1
        spawnPriority.workerBuilder.priority = (1 - 
            ((this.roomData.creepsByRole.builders.length + 1.75) / (optimalWorkForce.count*0.35 + 1))
        ) * 0.70
        spawnPriority.workerUpgrader.priority = (1 - 
            ((this.roomData.creepsByRole.upgraders.length + 1) / (optimalWorkForce.count*0.20 + 1))
        ) * 0.90
        spawnPriority.truck.priority = (1 - 
            ((this.roomData.creepsByRole.trucks.length + 1) / (truckCount + 1))
        ) * 0.80
        spawnPriority.range.priority = (1 - 
            ((this.roomData.creepsByRole.ranges.length + 1.5) / (armyForceSize + rangerReinforcementCount + 1))
        ) * 0.30
        spawnPriority.melee.priority = (1 - 
            ((this.roomData.creepsByRole.melees.length + 1.5) / (armyForceSize + 1))
        ) * 0.25
        spawnPriority.medic.priority = (1 - 
            ((this.roomData.creepsByRole.medics.length + 1.5) / ((Memory.securityAction == 'runInvade' ? armyForceSize : 0) + 1))
        ) * 0.20

        return spawnPriority
    }

    multiplyModel(model, multiple) {
        let multipliedModel = []
        for(let i=0; i<multiple; i++) {
            if(multipliedModel.length + model.length > 50) {
                break;
            }
            else {
                multipliedModel = multipliedModel.concat(model)
            }
        }
        return multipliedModel
    }

    getSpawnCost(model) {
        let cost = 0
        for(let part of model) {
            cost += BODYPART_COST[part]
        }
        return cost
    }

    getBiggestPossibleModel(model, maxEnergy) {
        let energy = maxEnergy ? maxEnergy : this.room.energyCapacityAvailable
        let cost = this.getSpawnCost(model)
        let multipier = Math.floor(energy / cost)
        let biggestModel = this.multiplyModel(model, multipier)
        if(model.includes(TOUGH)) {
            biggestModel = biggestModel.filter(part => part == TOUGH)
                .concat(biggestModel.filter(part => part != TOUGH))
        }
        return biggestModel
    }

    spawnSmallestCreepOfModel(model, memory: CreepMemory) {
        let name = `${this.room.name ?? ''}-${memory.model ?? ''}-${memory.role ?? ''}-${String(Game.time % 1000000000).padStart(9, '0')}`
        this.spawn.spawnCreep(model, name, {memory: memory});
    }

    spawnBiggestCreepOfModel(model, memory, maxEnergy?: number) {
        let name = `${this.room.name ?? ''}-${memory.model ?? ''}-${memory.role ?? ''}-${String(Game.time % 1000000000).padStart(9, '0')}`
        if(
            this.CHAMPIONS[memory.model] != null && 
            this.getSpawnCost(this.CHAMPIONS[memory.model]) <= this.room.energyCapacityAvailable
        ) {
            this.spawn.spawnCreep(this.CHAMPIONS[memory.model], name, {memory: memory});
        }
        else {
            this.spawn.spawnCreep(this.getBiggestPossibleModel(model, maxEnergy), name, {memory: memory});
        }
    }

    spawnCreeps() {
        if(this.room.memory.operatingMode == 'starter') {
            this.spawnCreepsStarterMode()
        }
        else if(this.room.memory.operatingMode == 'efficient') {
            this.spawnCreepsEfficientMode()
        }
        this.spawnCreepsStarterMode()
    }

    spawnCreepsStarterMode() {
        const spawnPriority = this.getSpawnPriority()

        if(spawnPriority == null) {
            return;
        }

        let keyOfHighestPriorityNotZero = Object.keys(spawnPriority).reduce((a, b) => spawnPriority[a].priority > spawnPriority[b].priority ? a : b);

        // don't spawn if no more creeps are needed
        if(spawnPriority[keyOfHighestPriorityNotZero].priority <= 0) {
            return;
        }

        spawnPriority[keyOfHighestPriorityNotZero].action()
    }

    spawnCreepsEfficientMode() {
        this.spawnCreepsStarterMode()
    }
}
