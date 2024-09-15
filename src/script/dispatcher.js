import { MyCreep, Harvester, Upgrader, Builder, Claimer, Truck, Security, Medic } from './roles/index.js';

export class Dispatcher {

    constructor(roomData) {
        this.roomData = roomData
    }

    dispatchRolesToCreeps() {
        let hasTruckDepositor = false
        for(var name in this.roomData.creeps) {
            var creep = this.roomData.creeps[name];
            creep.populateRoleActions = MyCreep.prototype.populateRoleActions.bind(creep)

            switch (creep.memory.role) {
                case 'harvester':
                    creep.populateRoleActions(Harvester)
                    creep.run()
                    break;
                case 'upgrader':
                    creep.populateRoleActions(Memory.securityAction == 'runInvade' ? Harvester : Upgrader)
                    creep.run()
                    break;
                case 'builder':
                    creep.populateRoleActions(Builder)
                    creep.run()
                    break;
                case 'claimer':
                    creep.populateRoleActions(Claimer)
                    creep.run()
                    break;
                case 'truck':
                    creep.populateRoleActions(Truck)
                    
                    let links = creep.room.find(FIND_MY_STRUCTURES, {
                        filter: (structure) => {
                            return structure.structureType == STRUCTURE_LINK
                        }
                    })
                    if(links.length >= 2) {
                        if(hasTruckDepositor) {
                            creep.convey()
                        }
                        else {
                            creep.run();
                            hasTruckDepositor = true
                        }
                    }
                    else {
                        creep.run()
                    }
                    break;
                case 'security':
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
                    break;
                case 'medic':
                    creep.populateRoleActions(Medic)
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
                    break;
            }
        }
    }
}
