import { MyCreep, Harvester, Upgrader, Builder, Security } from './roles/index.js';

export class Dispatcher {

    constructor(roomData) {
        this.roomData = roomData
    }

    dispatchRolesToCreeps() {
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
                if(Memory.securityAction == null) {
                    creep.runGuard()
                }
                else {
                    try{
                        creep[Memory.securityAction]()
                    }
                    catch {
                        console.log(`The security action ${Memory.securityAction} is not defined. Defaulting to runGuard`)
                        creep.runGuard()
                    }
                }
            }
        }
    }
}
