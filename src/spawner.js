class Spawner {
    // constants
    MODELS = {
        WORKER: [WORK, CARRY, MOVE],
        RANGE: [TOUGH, TOUGH, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE],
        MELEE: [TOUGH, TOUGH, ATTACK, MOVE, ATTACK, MOVE],
        MEDIC: [TOUGH, TOUGH, HEAL, MOVE, HEAL, MOVE],
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

    getBiggestPossibleModel(model) {
        let spawnEnergyCapcity = Game.spawns['Spawn1'].room.energyCapacityAvailable
        let cost = this.getSpawnCost(model)
        let multipier = Math.floor(spawnEnergyCapcity / cost)
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

    spawnBiggestCreepOfModel(model, memory) {
        let randomizedName = `${memory.model ?? '_'}-${memory.role ?? '_'}-${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`
        let spawnStatus = Game.spawns['Spawn1'].spawnCreep(this.getBiggestPossibleModel(model), randomizedName, {memory: memory});
    }
}

module.exports = new Spawner();