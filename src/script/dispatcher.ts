import { MyCreep, Harvester, Upgrader, Builder, Claimer, Truck, Melee, Range, Medic } from './roles/index';

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
        for(let baseCreep of this.roomData.creeps) {
            let creep = baseCreep as MyCreep;
            let doSpecialRun = false;
            creep.populateRoleActions = MyCreep.prototype.populateRoleActions.bind(creep)

            switch (creep.memory.role) {
                case 'harvester':
                    creep.populateRoleActions(Harvester);
                    break;
                case 'upgrader':
                    creep.populateRoleActions(Memory.securityAction == 'runInvade' ? Harvester : Upgrader)
                    break;
                case 'builder':
                    creep.populateRoleActions(Builder)
                    break;
                case 'claimer':
                    creep.populateRoleActions(Claimer)
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
                            doSpecialRun = true
                        }
                        else {
                            hasTruckDepositor = true
                        }
                    }
                    break;
                case 'melee':
                    creep.populateRoleActions(Melee)
                    if(Memory.securityAction != null) {
                        try{
                            creep[Memory.securityAction]()
                            doSpecialRun = true
                        }
                        catch {
                            console.log(`The security action ${Memory.securityAction} is not defined. Using default run()`)
                        }
                    }
                    break;
                case 'range':
                    creep.populateRoleActions(Range)
                    if(Memory.securityAction != null) {
                        try{
                            creep[Memory.securityAction]()
                            doSpecialRun = true
                        }
                        catch {
                            console.log(`The security action ${Memory.securityAction} is not defined. Using default run()`)
                        }
                    }
                    break;
                case 'medic':
                    creep.populateRoleActions(Medic)
                    if(Memory.securityAction != null) {
                        try{
                            creep[Memory.securityAction]()
                            doSpecialRun = true
                        }
                        catch {
                            console.log(`The security action ${Memory.securityAction} is not defined. Using default run()`)
                        }
                    }
                    break;
            }
            if(!doSpecialRun) {
                creep.run()
            }
        }
    }
}
