var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var constructionMap = require('construction-map');
var spawnHelper = require('spawn-helper');

module.exports.loop = function () {

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
    let spawnPriority = {
        workerBuilder: {
            priority: 0,
            action: () => spawnHelper.spawnBiggestCreepOfModel(spawnHelper.MODELS.WORKER, {model: 'WORKER', role: 'builder'})
        },
        workerUpgrader: {
            priority: 0,
            action: () => spawnHelper.spawnBiggestCreepOfModel(spawnHelper.MODELS.WORKER, {model: 'WORKER', role: 'upgrader'})
        },
        workerHarvester: {
            priority: 0,
            action: () => spawnHelper.spawnBiggestCreepOfModel(spawnHelper.MODELS.WORKER, {model: 'WORKER', role: 'harvester'})
        },
        garrison: {
            priority: 0,
            action: () => spawnHelper.spawnBiggestCreepOfModel(spawnHelper.MODELS.GARRISON, {model: 'GARRISON', role: 'sentry'})
        },
        inquisitor: {
            priority: 0,
            action: () => spawnHelper.spawnBiggestCreepOfModel(spawnHelper.MODELS.INQUISITOR, {model: 'INQUISITOR', role: 'sentry'})
        },
    }

    let creepCount = Object.keys(Game.creeps).length
    let creepHarvesterCount = Object.keys(getCreepsByMemory({model: 'WORKER', role: 'harvester'})).length
    let creepBuilderCount = Object.keys(getCreepsByMemory({model: 'WORKER', role: 'builder'})).length
    let creepUpgraderCount = Object.keys(getCreepsByMemory({model: 'WORKER', role: 'upgrader'})).length

    // value 0 to 1; 1 is highest priority
    function setSpawnPriority() {
        spawnPriority.workerHarvester.priority = 1 - (creepHarvesterCount/5)
        spawnPriority.workerBuilder.priority = (1 - (creepBuilderCount/5)) * 0.75
        spawnPriority.workerUpgrader.priority = 1 - (creepUpgraderCount/5)
        spawnPriority.garrison.priority = Math.random() * 0.25
        spawnPriority.inquisitor.priority = Math.random() * 0.25
    }

    function getKeyOfHighestPriorityNotZero() {
        setSpawnPriority()
        let key = Object.keys(spawnPriority).reduce((a, b) => spawnPriority[a].priority > spawnPriority[b].priority ? a : b);
        if(spawnPriority[key].priority <= 0) {
            return null
        }
        return key
    }
    
    let keyOfHighestPriorityNotZero = getKeyOfHighestPriorityNotZero()
    spawnPriority[keyOfHighestPriorityNotZero]?.action()

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