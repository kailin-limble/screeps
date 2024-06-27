var MyCreep = require('role.my-creep');
var Harvester = require('role.harvester');
var Upgrader = require('role.upgrader');
var Builder = require('role.builder');
var Security = require('role.security');

class Dispatcher {

    // class vars
    roomData;

    constructor(roomData) {
        this.roomData = roomData
    }

    dispatchRolesToCreeps() {
        if(Memory.securityAction == null || !Memory.securityAction) {
            Memory.securityAction = this.roomData.creepsByRole.ranges.length + this.roomData.creepsByRole.melees.length >= 9
        }
        else {
            Memory.securityAction = this.roomData.creepsByRole.ranges.length + this.roomData.creepsByRole.melees.length >= 9/2
        }

        for(var name in this.roomData.creeps) {
            var creep = this.roomData.creeps[name];
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

module.exports = Dispatcher;