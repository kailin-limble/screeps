var MyCreep = require('role.my-creep');
var Harvester = require('role.harvester');
var Upgrader = require('role.upgrader');
var Builder = require('role.builder');
var Security = require('role.security');

var constructionMap = require('construction-map');
var Spawner = require('spawner');

module.exports.loop = function () {

    // benchmark
    if(Memory.tickCount == null) {
        Memory.tickCount = 0
    }
    Memory.tickCount++

    // main loop
    for(const roomName in Game.rooms) {
        const room = Game.rooms[roomName]
        
        if(Memory.tickCount % 600 == 0) {
            console.log(`------`,
                `| tick: ${Memory.tickCount}`,
                `| level: ${room.controller.level}`,
                `| progress: ${room.controller.progress}`,
                `| population: ${Object.keys(Game.creeps).length}`,
                `| ------`
            )
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

        // init creep spawns
        const spawner = new Spawner(room)
        if(spawner.spawn != null) {
            spawner.spawnCreeps()
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
                Memory.securityAction = spawner.creepsByRole.ranges.length + spawner.creepsByRole.melees.length >= 9
            }
            else {
                Memory.securityAction = spawner.creepsByRole.ranges.length + spawner.creepsByRole.melees.length >= 9/2
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