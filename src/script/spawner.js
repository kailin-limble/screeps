export class Spawner {

    constructor(room, roomData) {
    
        this.MODELS = {
            WORKER: [WORK, CARRY, MOVE],
            RANGE: [TOUGH, RANGED_ATTACK, MOVE],
            MELEE: [TOUGH, TOUGH, ATTACK, MOVE, ATTACK, MOVE],
            MEDIC: [TOUGH, TOUGH, HEAL, MOVE, HEAL, MOVE],
        }

        this.room = room
        this.spawn = room.find(FIND_MY_SPAWNS).find(spawn => spawn.spawning == null)
        this.roomData = roomData
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
        let spawnPriority = {
            workerBuilder: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(this.MODELS.WORKER, {model: 'WORKER', role: 'builder'}, 1500)
            },
            workerUpgrader: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(this.MODELS.WORKER, {model: 'WORKER', role: 'upgrader'}, 1500)
            },
            workerHarvester: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(this.MODELS.WORKER, {model: 'WORKER', role: 'harvester'}, 1500)
            },
            range: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(this.MODELS.RANGE, {model: 'RANGE', role: 'security'}, 1680)
            },
            melee: {
                priority: 0,
                action: () => this.spawnBiggestCreepOfModel(this.MODELS.MELEE, {model: 'MELEE', role: 'security'}, 1680)
            },
        }

        // always start with a haverster
        if(this.roomData.creepsByRole.harvesters.length == 0) {
            this.spawnBiggestCreepOfModel(this.MODELS.WORKER, {model: 'WORKER', role: 'harvester'}, this.room.energyAvailable)
            return;
        }

        // value 0 to 1; 1 is highest priority
        spawnPriority.workerHarvester.priority = 1 - (this.roomData.creepsByRole.harvesters.length/3)
        spawnPriority.workerBuilder.priority = (1 - (this.roomData.creepsByRole.builders.length/2)) * 0.70
        spawnPriority.workerUpgrader.priority = (1 - (this.roomData.creepsByRole.upgraders.length/1)) * 0.90
        spawnPriority.range.priority = (1 - (this.roomData.creepsByRole.ranges.length/2)) * 0.30
        spawnPriority.melee.priority = (1 - (this.roomData.creepsByRole.melees.length/1)) * 0.20

        let keyOfHighestPriorityNotZero = Object.keys(spawnPriority).reduce((a, b) => spawnPriority[a].priority > spawnPriority[b].priority ? a : b);

        // don't spawn if no more creeps are needed
        if(spawnPriority[keyOfHighestPriorityNotZero].priority <= 0) {
            return;
        }

        spawnPriority[keyOfHighestPriorityNotZero].action()
    }
}
