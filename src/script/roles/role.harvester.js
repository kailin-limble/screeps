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

            let links = this.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_LINK)
                }
            });
            if(links.length >= 2) {
                if(this.depositeToLink(links)) {
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
            
            var storages = this.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 750000;
                }
            });
            if(storages.length > 0) {
                let storage = this.pos.findClosestByPath(storages)
                if(this.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.moveTo(storage, {reusePath: 5, visualizePathStyle: {stroke: '#ffffff'}})
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

    depositeToLink(links) {
        let closestLink = this.pos.findClosestByRange(links, 3);
        if(this.pos.findPathTo(closestLink).length <= 2) {
            if(this.transfer(closestLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.moveTo(closestLink, {reusePath: 5, visualizePathStyle: {stroke: '#ffffff'}})
            }
            return true;
        }
    }
};
