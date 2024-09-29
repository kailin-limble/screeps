import { MyCreep } from './role.my-creep';
import { Utils } from '../utils';

// abstract
export abstract class Worker extends MyCreep {

    smartHarvest() {
        var sources = this.room.find(FIND_SOURCES_ACTIVE);

        let harvestErrCode = 0
        for(let source of sources) {
            harvestErrCode = this.harvest(source)
            if(harvestErrCode == OK) {
                return;
            }
        }

        if(harvestErrCode == ERR_NOT_IN_RANGE || harvestErrCode == ERR_NOT_ENOUGH_ENERGY) {
            let safeUnoccupiedNonEmptySources = sources.filter(source =>
                Utils.hasAdjacentOpenning(source) &&
                Utils.isSafeLocation(source.pos, 2)
            )
            let closestSource = this.pos.findClosestByPath(safeUnoccupiedNonEmptySources)
            let moveErrCode = this.moveTo(closestSource, {reusePath: 5, visualizePathStyle: {stroke: '#777777'}})
            if(moveErrCode == OK) {
	            this.say('⛏️');
                return;
            }
            if(moveErrCode == ERR_NO_PATH) {
                console.log("source inaccesible")
	            this.say('❌');
            }
            else {
	            this.say('💤');
            }
        }

        let storages = this.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_STORAGE) &&
                        structure.store.getUsedCapacity(RESOURCE_ENERGY) > 9999;
            }
        });
        if(storages.length > 0) {
            if(this.withdraw(storages[0], RESOURCE_ENERGY)) {
                this.moveTo(storages[0], {reusePath: 5, visualizePathStyle: {stroke: '#777777'}})
            }
        }
    }

    isInHomeRoom() {
        if(
            (this.memory.homeRoom == null || this.pos.roomName == this.memory.homeRoom) && 
            !Utils.isPosOnRoomEdge(this.pos)
        ) {
            return true
        }
        return false
    }

    returnToHomeRoom() {
        const homeRoom = Game.rooms[this.memory.homeRoom]
        if(homeRoom != null && homeRoom.controller != null) {
            this.moveTo(homeRoom.controller)
        }
        else {
            this.moveTo(new RoomPosition(25, 25, this.memory.homeRoom))
        }
    }

    fallbackAction() {        
        if(this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
            this.moveTo(this.room.controller, {
                reusePath: 5, 
                range: 3,
                visualizePathStyle: {stroke: '#770077'}
            });
        }
        if(this.room.controller != null && this.room.controller.level < 8) {
            this.say('🔼');
        }
        else {
            this.say('⏸️');
        }
    }
}
