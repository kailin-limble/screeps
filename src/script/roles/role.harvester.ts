import { Worker } from './role.worker';

export class Harvester extends Worker {

    run() {
	    if(this.memory.working && this.store[RESOURCE_ENERGY] == 0) {
            this.memory.working = false;
	    }
	    if(!this.memory.working && (this.store.getFreeCapacity() == 0 || this.ticksToLive <= 35)) {
	        this.memory.working = true;
	    }

	    if(this.memory.working) {
            if(!this.isInHomeRoom()) {
                this.returnToHomeRoom()
                return;
            }

			if(this.performStoredHarvestAction()) {
				return;
			}

            if(this.room.memory.operatingMode === 'efficient') {
                if(this.depositeToLink()) {
                    return;
                }
            }
            
            var targets = this.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            if(targets.length > 0) {
                let target = this.pos.findClosestByPath(targets)
                if(this.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.moveTo(target, {reusePath: 5, visualizePathStyle: {stroke: '#ffffff'}})
                }
                this.say('📥');
                return;
            }

            var towers = this.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 250;
                }
            });
            if(towers.length > 0) {
                let tower = this.pos.findClosestByPath(towers)
                if(this.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.moveTo(tower, {reusePath: 5, visualizePathStyle: {stroke: '#ffffff'}})
                }
                this.say('📥');
                return;
            }
            
            if(this.room.storage != null) {
                if(this.transfer(this.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.moveTo(this.room.storage, {reusePath: 5, visualizePathStyle: {stroke: '#ffffff'}})
                }
                this.say('📥');
                return;
            }

            this.fallbackAction()
	    }
	    else {
            this.smartHarvest()
	    }
	}

    depositeToLink() {
        let linksInRange = this.pos.findInRange<StructureLink>(FIND_MY_STRUCTURES, 2, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_LINK) &&
                    (structure.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0) > 0
            }
        });
        let closestLink = this.pos.findClosestByPath<StructureLink>(linksInRange);
        if(closestLink == null) {
            return false;
        }
        if(this.transfer(closestLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            this.moveTo(closestLink, {reusePath: 5, visualizePathStyle: {stroke: '#ffffff'}})
        }
        return true;
    }
    
	storeHarvestAction(storeHarvestAction) {
		this.memory.storedAction = storeHarvestAction
	}

	performStoredHarvestAction() {
		if(this.memory.storedAction != null && Game.time < (this.memory.storedAction.until ?? 0)) {
			const source = Game.getObjectById<Source>(this.memory.storedAction.targetId);
            if(source) {
                if(this.harvest(source) === ERR_NOT_IN_RANGE) {
                    this.moveTo(source)
                }
            }
            else {
                let sourceLocation = Game.rooms[this.memory.homeRoom].memory.externalSources.find(source => source.id === this.memory.storedAction.targetId)
                this.moveTo(new RoomPosition(sourceLocation.pos.x, sourceLocation.pos.y, sourceLocation.pos.roomName))
            }
			return true;
		}
		this.memory.storedAction = undefined
		return false
	}
};
