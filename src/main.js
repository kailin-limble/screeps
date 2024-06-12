var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var constructionMap = require('construction-map');

module.exports.loop = function () {

    // constants
    let MODELS = {
        WORKER: [WORK, CARRY, MOVE],
        GARRISON: [TOUGH, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE],
        INQUISITOR: [TOUGH, TOUGH, ATTACK, ATTACK, MOVE],
        MEDIC: [TOUGH, HEAL, MOVE],
        ARTILLERY: [TOUGH, RANGED_ATTACK, MOVE, RANGED_ATTACK, RANGED_ATTACK, MOVE],
        TANK: [TOUGH, TOUGH, MOVE, ATTACK, ATTACK, MOVE],
    }

    function multiplyModel(model, multiple) {
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

    function getSpawnCost(model) {
        let cost = 0
        for(let part of model) {
            cost += BODYPART_COST[part]
        }
        return cost
    }

    function getBiggestPossibleModel(model) {
        let spawnEnergyCapcity = Game.spawns['Spawn1'].store.getCapacity(RESOURCE_ENERGY)
        let cost = getSpawnCost(model)
        let multipier = Math.floor(spawnEnergyCapcity / cost)
        let biggestModel = multiplyModel(model, multipier)
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

    function spawnBiggestCreepOfModel(model, memory) {
        let randomizedName = `${memory.model ?? '_'}-${memory.role ?? '_'}-${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`
        let spawnStatus = Game.spawns['Spawn1'].spawnCreep(getBiggestPossibleModel(model), randomizedName, {memory: memory});
    }

    // filter creeps by matching memory; this is an AND filter
    function getCreepsByMemory(memoryFilter) {
        let filteredCreeps = {}
        for(let name in Game.creeps) {
            let match = true
            for(let key in memoryFilter) {
                if(Game.creeps[name].memory[key] != memoryFilter[key]) {
                    match = false
                    break;
                }
            }
            if(match) {
                filteredCreeps[name] = Game.creeps[name]
            }
        }
        return filteredCreeps
    }

    // init structures
    for(let structure in constructionMap) {
        for(let location of constructionMap[structure]) {
            Game.rooms.sim.createConstructionSite(location[0], location[1], structure)
        }
    }

    // init creeps
    let creepCount = Object.keys(Game.creeps).length
    let creepHarvesterCount = Object.keys(getCreepsByMemory({role: 'harvester'})).length
    let creepBuilderCount = Object.keys(getCreepsByMemory({role: 'builder'})).length
    let creepUpgraderCount = Object.keys(getCreepsByMemory({role: 'upgrader'})).length

    if(creepHarvesterCount < 2) {
        spawnBiggestCreepOfModel(MODELS.WORKER, {model: 'WORKER', role: 'harvester'})
    }
    if(creepBuilderCount < 2) {
        spawnBiggestCreepOfModel(MODELS.WORKER, {model: 'WORKER', role: 'builder'})
    }
    if(creepUpgraderCount < 2) {
        spawnBiggestCreepOfModel(MODELS.WORKER, {model: 'WORKER', role: 'upgrader'})
    }

    // assign roles to towers
    var tower = Game.getObjectById<Creep>('d103f691f617d618766dce0a');
    if(tower) {
        var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax
        });
        if(closestDamagedStructure) {
            tower.repair(closestDamagedStructure);
        }

        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            tower.attack(closestHostile);
        }
    }

    // assign roles to creeps
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
    }
}