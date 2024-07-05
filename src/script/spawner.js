export class Spawner {

    constructor(room, roomData) {
    
        this.MODELS = {
            WORKER: [WORK, CARRY, MOVE],
            RANGE: [TOUGH, RANGED_ATTACK, MOVE],
            MELEE: [TOUGH, TOUGH, ATTACK, MOVE, ATTACK, MOVE],
            MEDIC: [TOUGH, HEAL, MOVE],
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

    getSpawnPriority() {
        let optimalWorkForce = this.getOptimalWorkForce()

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
        }

        // always start with a haverster
        if(this.roomData.creepsByRole.harvesters.length == 0) {
            this.spawnBiggestCreepOfModel(this.MODELS.WORKER, {model: 'WORKER', role: 'harvester'}, this.room.energyAvailable)
            return;
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
            ((this.roomData.creepsByRole.ranges.length + 1) / 2)
        ) * 0.30
        spawnPriority.melee.priority = (1 - 
            ((this.roomData.creepsByRole.melees.length + 1) / 2)
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
        biggestModel.sort((x,y) => {
            if(x == y) {
                return 0
            }
            else if(x == TOUGH) {
                return -1
            }
            else if(y == TOUGH) {
                return 1
            }
            else {
                return 0
            }
        });
        return biggestModel
    }

    spawnSmallestCreepOfModel(model, memory) {
        let randomizedName = `${memory.model || '-'}_${memory.role || '-'}_${String(Game.time % 1000000000).padStart(9, '0')}`
        let spawnStatus = this.spawn.spawnCreep(model, randomizedName, {memory: memory});
    }

    spawnBiggestCreepOfModel(model, memory, maxEnergy) {
        let randomizedName = `${memory.model || '-'}_${memory.role || '-'}_${String(Game.time % 1000000000).padStart(9, '0')}`
        let spawnStatus = this.spawn.spawnCreep(this.getBiggestPossibleModel(model, maxEnergy), randomizedName, {memory: memory});
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
