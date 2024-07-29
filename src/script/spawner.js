export class Spawner {

    constructor(room, roomData) {
    
        this.MODELS = {
            WORKER: [WORK, CARRY, MOVE],
            CLAIMER: [CLAIM, MOVE],
            RANGE: [TOUGH, RANGED_ATTACK, MOVE],
            MELEE: [TOUGH, TOUGH, ATTACK, MOVE, ATTACK, MOVE],
            MEDIC: [TOUGH, MOVE, HEAL, HEAL, HEAL, MOVE],
        }
        this.CHAMPIONS = {
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
        this.ENERGY = 3000 // energy per source per 300 tick cycle
        this.MINING_RATE = 150 // average energy mined per cycle per 1 work body part

        this.room = room
        this.spawn = room.find(FIND_MY_SPAWNS).find(spawn => spawn.spawning == null)
        this.roomData = roomData
    }

    getOptimalWorkForce() {
        if(this.room.memory.sources.count == null || this.room.memory.sources.count == 0) {
            return 0
        }

        const singleWorkerCost = this.getSpawnCost(this.MODELS.WORKER)
        const largestWorkerSize = this.room.energyCapacityAvailable / singleWorkerCost

        let optimalWorkBodyParts = (this.room.memory.sources.count * this.ENERGY) / this.MINING_RATE
        let optimalWorkerCount = this.room.memory.sources.mineableSlots + (this.room.memory.sources.count * this.room.memory.sources.minMineableSlot)/3
        let optimalWorkerSize = optimalWorkBodyParts / optimalWorkerCount

        if(optimalWorkerSize > largestWorkerSize) {
            optimalWorkerSize = largestWorkerSize
            optimalWorkerCount = optimalWorkBodyParts / optimalWorkerSize
        }

        let optimalWorkerCost = optimalWorkerSize * singleWorkerCost

        return {
            count: optimalWorkerCount,
            cost: optimalWorkerCost
        }
    }
    
    getInvasionArmyForceSize() {
        if(Memory.securityAction == 'runInvade') {
            return 3 * (Memory.viableRoomsCount || 1)
        }
        return 1
    }
    
    getArmyCountToUse() {
        if(Memory.securityAction == 'runInvade') {
            return Memory.creepsModelCounts
        }
        return {
            RANGE: this.roomData.creepsByRole.ranges.length,
            MELEE: this.roomData.creepsByRole.melees.length, 
            MEDIC: this.roomData.creepsByRole.medics.length
        }
    }

    getSpawnPriority() {
        // always start with a haverster
        if(this.roomData.creepsByRole.harvesters.length == 0) {
            this.spawnBiggestCreepOfModel(this.MODELS.WORKER, {model: 'WORKER', role: 'harvester'}, this.room.energyAvailable)
            return;
        }

        let optimalWorkForce = this.getOptimalWorkForce()
        let invasionArmyForceSize = this.getInvasionArmyForceSize()
        let armyCountToUse = this.getArmyCountToUse()

        let spawnPriority = {
            workerBuilder: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(
                    this.MODELS.WORKER, {model: 'WORKER', role: 'builder'}, 
                    optimalWorkForce.cost
                )
            },
            workerUpgrader: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(
                    this.MODELS.WORKER, {model: 'WORKER', role: 'upgrader'}, 
                    optimalWorkForce.cost
                )
            },
            workerHarvester: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(
                    this.MODELS.WORKER, {model: 'WORKER', role: 'harvester'}, 
                    optimalWorkForce.cost
                )
            },
            range: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(this.MODELS.RANGE, {model: 'RANGE', role: 'security'})
            },
            melee: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(this.MODELS.MELEE, {model: 'MELEE', role: 'security'})
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
        spawnPriority.range.priority = (1 - 
            ((armyCountToUse.RANGE + 1.5) / (invasionArmyForceSize + 1))
        ) * 0.30
        spawnPriority.melee.priority = (1 - 
            ((armyCountToUse.MELEE + 1.5) / (invasionArmyForceSize + 1))
        ) * 0.25
        spawnPriority.medic.priority = (1 - 
            ((armyCountToUse.MEDIC + 1.5) / (invasionArmyForceSize + 1))
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

    spawnSmallestCreepOfModel(model, memory) {
        let tickBasedName = `${memory.model || '-'}_${memory.role || '-'}_${String(Game.time % 1000000000).padStart(9, '0')}`
        this.spawn.spawnCreep(model, tickBasedName, {memory: memory});
    }

    spawnBiggestCreepOfModel(model, memory, maxEnergy) {
        let tickBasedName = `${memory.model || '-'}_${memory.role || '-'}_${String(Game.time % 1000000000).padStart(9, '0')}`
        if(
            this.CHAMPIONS[memory.model] != null && 
            this.getSpawnCost(this.CHAMPIONS[memory.model]) <= this.room.energyCapacityAvailable
        ) {
            this.spawn.spawnCreep(this.CHAMPIONS[memory.model], tickBasedName, {memory: memory});
        }
        else {
            this.spawn.spawnCreep(this.getBiggestPossibleModel(model, maxEnergy), tickBasedName, {memory: memory});
        }
    }

    spawnCreeps() {
        const spawnPriority = this.getSpawnPriority()

        let keyOfHighestPriorityNotZero = Object.keys(spawnPriority).reduce((a, b) => spawnPriority[a].priority > spawnPriority[b].priority ? a : b);

        // don't spawn if no more creeps are needed
        if(spawnPriority[keyOfHighestPriorityNotZero].priority <= 0) {
            return;
        }

        spawnPriority[keyOfHighestPriorityNotZero].action()
    }
}
