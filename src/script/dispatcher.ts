import { MyCreep, Harvester, Upgrader, Builder, Claimer, Truck, Security, Medic } from './roles/index';

export class Dispatcher {

    roomData: {
        creeps: Creep[];
        creepsByRole: {
            [k: string]: Creep[];
        };
    };
    constructor(roomData) {
        this.roomData = roomData
    }

    dispatchRolesToCreeps() {
        let hasTruckDepositor = false
        for(var name in this.roomData.creeps) {
            var creep = this.roomData.creeps[name] as MyCreep;
            creep.populateRoleActions = MyCreep.prototype.populateRoleActions.bind(creep)

            switch (creep.memory.role) {
                case 'harvester':
                    creep.populateRoleActions(Harvester);
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
                    let creepTruck = (creep as Truck)
                    
                    let links = creepTruck.room.find(FIND_MY_STRUCTURES, {
                        filter: (structure) => {
                            return structure.structureType == STRUCTURE_LINK
                        }
                    })
                    if(links.length >= 2) {
                        if(hasTruckDepositor) {
                            creepTruck.convey()
                        }
                        else {
                            creep.run();
                            hasTruckDepositor = true
                        }
                    }
                    else {
                        creepTruck.run()
                    }
                    break;
                case 'security':
                    creep.populateRoleActions(Security)
                    let creepSecurity = (creep as Security)
                    if(Memory.securityAction == null) {
                        creepSecurity.runGuard()
                    }
                    else {
                        try{
                            creep[Memory.securityAction]()
                        }
                        catch {
                            console.log(`The security action ${Memory.securityAction} is not defined. Defaulting to runGuard`)
                            creepSecurity.runGuard()
                        }
                    }
                    break;
                case 'medic':
                    creep.populateRoleActions(Medic)
                    let creepMedic = (creep as Medic)
                    if(Memory.securityAction == null) {
                        creepMedic.runGuard()
                    }
                    else {
                        try{
                            creep[Memory.securityAction]()
                        }
                        catch {
                            console.log(`The security action ${Memory.securityAction} is not defined. Defaulting to runGuard`)
                            creepMedic.runGuard()
                        }
                    }
                    break;
            }
        }
    }
}
