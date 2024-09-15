export class RoomManager {

    constructor(room, roomData) {
        this.room = room
        this.roomData = roomData
    }

    runRoomActions() {
        let links = this.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_LINK
            }
        });

        let storages = this.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_STORAGE
            }
        });

        if(links.length < 2 || storages.length < 1) {
            return;
        }

        let storageLinks = this.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_LINK &&
                    structure.pos.inRangeTo(storages[0].pos, 2)
                )
            }
        });

        let transferLinks = this.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_LINK &&
                    structure.pos.findInRange(FIND_SOURCES, 2).length > 0
                )
            }
        });

        if(storageLinks.length > 0)
        for(let transferLink of transferLinks) {
            if(transferLink.store[RESOURCE_ENERGY] >= transferLink.store.getCapacity()/2 &&
                storageLinks[0].store[RESOURCE_ENERGY] <= storageLinks[0].store.getCapacity()/2
            ) {
                transferLink.transferEnergy(storageLinks[0]);
            }
        }
    }
}
