var MyCreep = require('role.my-creep');
var Harvester = require('role.harvester');
var Upgrader = require('role.upgrader');
var Builder = require('role.builder');
var Security = require('role.security');

var constructionMap = require('construction-map');
var spawner = require('spawner');

module.exports.loop = function () {
    for(const roomName in Game.rooms) {
        const room = Game.rooms[roomName]
        const spawn = room.find(FIND_MY_SPAWNS).find(spawn => spawn.spawning == null)

        // benchmark
        if(Memory.tickCount == null) {
            Memory.tickCount = 0
        }
        else {
            if(Memory.tickCount % 600 == 0) {
                console.log(`------`,
                    `| tick: ${Memory.tickCount}`,
                    `| level: ${room.controller.level}`,
                    `| progress: ${room.controller.progress}`,
                    `| population: ${Object.keys(Game.creeps).length}`,
                    `| ------`
                )
            }
            Memory.tickCount++
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
        for(let structure in constructionMap[roomName]) {
            for(let level in constructionMap[roomName][structure]) {
                if(Number(level) <= room.controller.level) {
                    for(let location of constructionMap[roomName][structure][level]) {
                        room.createConstructionSite(location[0], location[1], structure)
                    }
                }
            }
        }

        // init creeps
        let creepCount = Object.keys(Game.creeps).length
        let creepHarvesterCount = Object.keys(getCreepsByMemory({model: 'WORKER', role: 'harvester'})).length
        let creepBuilderCount = Object.keys(getCreepsByMemory({model: 'WORKER', role: 'builder'})).length
        let creepUpgraderCount = Object.keys(getCreepsByMemory({model: 'WORKER', role: 'upgrader'})).length
        let creepRangeCount = Object.keys(getCreepsByMemory({model: 'RANGE', role: 'security'})).length
        let creepMeleeCount = Object.keys(getCreepsByMemory({model: 'MELEE', role: 'security'})).length
        let creepSecurityCount = creepRangeCount + creepMeleeCount

        if(spawn != null) {
            let spawnPriority = {
                workerBuilder: {
                    priority: 0,
                    action: () => spawner.spawnBiggestCreepOfModel(spawn, spawner.MODELS.WORKER, {model: 'WORKER', role: 'builder'})
                },
                workerUpgrader: {
                    priority: 0,
                    action: () => spawner.spawnBiggestCreepOfModel(spawn, spawner.MODELS.WORKER, {model: 'WORKER', role: 'upgrader'})
                },
                workerHarvester: {
                    priority: 0,
                    action: () => spawner.spawnBiggestCreepOfModel(spawn, spawner.MODELS.WORKER, {model: 'WORKER', role: 'harvester'})
                },
                range: {
                    priority: 0,
                    action: () => spawner.spawnBiggestCreepOfModel(spawn, spawner.MODELS.RANGE, {model: 'RANGE', role: 'security'})
                },
                melee: {
                    priority: 0,
                    action: () => spawner.spawnBiggestCreepOfModel(spawn, spawner.MODELS.MELEE, {model: 'MELEE', role: 'security'})
                },
            }

            if(creepHarvesterCount == 0) {
                spawner.spawnSmallestCreepOfModel(spawn, spawner.MODELS.WORKER, {model: 'WORKER', role: 'harvester'})
            }

            // value 0 to 1; 1 is highest priority
            function setSpawnPriority() {
                spawnPriority.workerHarvester.priority = 1 - (creepHarvesterCount/3)
                spawnPriority.workerBuilder.priority = (1 - (creepBuilderCount/4)) * 0.83
                spawnPriority.workerUpgrader.priority = 1 - (creepUpgraderCount/3)
                spawnPriority.range.priority = (1 - (creepRangeCount/6)) * 0.20
                spawnPriority.melee.priority = (1 - (creepMeleeCount/3)) * 0.20
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
        }

        // assign roles to towers
        var towers = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        for(const tower of towers) {
            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(closestHostile) {
                tower.attack(closestHostile);
            }

            var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => (structure.hits < structure.hitsMax && structure.hits < 9900)
            });
            if(closestDamagedStructure) {
                tower.repair(closestDamagedStructure);
            }
        }

        // assign roles to creeps
        for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            creep.populateRoleActions = MyCreep.prototype.populateRoleActions.bind(creep)

            if(creep.memory.role == 'harvester') {
                creep.populateRoleActions(Harvester)
                creep.run()
            }
            if(creep.memory.role == 'upgrader') {
                creep.populateRoleActions(Upgrader)
                creep.run()
            }
            if(creep.memory.role == 'builder') {
                creep.populateRoleActions(Builder)
                creep.run()
            }
            
            if(Memory.securityAction == null || !Memory.securityAction) {
                Memory.securityAction = creepSecurityCount >= 9
            }
            else {
                Memory.securityAction = creepSecurityCount >= 9/2
            }
            if(creep.memory.role == 'security') {
                creep.populateRoleActions(Security)
                if(Memory.securityAction) {
                    creep.runExterminate()
                }
                else {
                    creep.runPatrol()
                }
            }
        }
    }
}