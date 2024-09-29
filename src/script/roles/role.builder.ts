import { Worker } from './role.worker';
import { Utils } from '../utils';

export class Builder extends Worker {

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

			if(this.performStoredRepairAction()) {
				return;
			}
			
	        var myStructures = this.room.find(FIND_MY_STRUCTURES);
	        var walls = this.room.find(FIND_STRUCTURES, {
				filter: (structure) => ([STRUCTURE_WALL, STRUCTURE_ROAD] as StructureConstant[]).includes(structure.structureType)
			});
	        var repairTargets = walls.concat(myStructures).filter((target) => (target.hits || 0) < (target.hitsMax || 0))
			
	        var repairTargetsPriority0 = []
	        var repairTargetsPriority1 = []
	        var repairTargetsPriority2 = []
	        var repairTargetsPriority3 = []

			for(let target of repairTargets) {
				if(target.hits < 900) {
					repairTargetsPriority0.push(target)
				}
				else if(target.hits < 9900 && target.hits / target.hitsMax < 0.25) {
					repairTargetsPriority1.push(target)
				}
				else if(target.hits < 99900 && target.hits / target.hitsMax < 0.50) {
					repairTargetsPriority2.push(target)
				}
				else if(target.hits < 199900 && target.hits / target.hitsMax < 0.75) {
					repairTargetsPriority3.push(target)
				}
			}

			let repairTarget = null

			//repair priority 0 and 1
			if(repairTargetsPriority0.length > 0) {
				repairTarget = this.pos.findClosestByPath(repairTargetsPriority0, {range: 3}) || repairTargetsPriority0[0]
			}
			else if(repairTargetsPriority1.length > 0) {
				repairTarget = this.pos.findClosestByPath(repairTargetsPriority1, {range: 3}) || repairTargetsPriority1[0]
			}

            if(repairTarget != null) {
                if(this.repair(repairTarget) == ERR_NOT_IN_RANGE) {
                    this.moveTo(repairTarget, {
						visualizePathStyle: {stroke: '#7777ff'},
						range: 3,
						costCallback: this.costCallbackAvoidRamparts.bind(this)
					});
                }
				else {
					this.storeRepairAction({targetId: repairTarget.id, ticks: 25})
				}
				this.say('🔧');
				return;
            }

			//build
	        var constructureSites = this.room.find(FIND_CONSTRUCTION_SITES);
            if(constructureSites.length) {
				if(Utils.isSafeLocation(constructureSites[0].pos)) {
					if(this.build(constructureSites[0]) == ERR_NOT_IN_RANGE) {
						this.moveTo(
							constructureSites[0], 
							{
								visualizePathStyle: {stroke: '#ffff00'}, 
								range: 3,
								costCallback: this.costCallbackAvoidRamparts.bind(this)
							});
					}
					this.say('🚧');
					return;
				}
            }
			
			//repair priority 2 and 3
			if(repairTargetsPriority2.length > 0) {
				repairTarget = this.pos.findClosestByPath(repairTargetsPriority2, {range: 3}) || repairTargetsPriority2[0]
			}
			else if(repairTargetsPriority3.length > 0) {
				repairTarget = this.pos.findClosestByPath(repairTargetsPriority3, {range: 3}) || repairTargetsPriority3[0]
			}

            if(repairTarget != null) {
                if(this.repair(repairTarget) == ERR_NOT_IN_RANGE) {
                    this.moveTo(
						repairTarget, 
						{
							visualizePathStyle: {stroke: '#ffff00'}, 
							range: 3,
							costCallback: this.costCallbackAvoidRamparts.bind(this)
						}
					);
                }
				else {
					this.storeRepairAction({targetId: repairTarget.id, ticks: 25})
				}
				this.say('🔧');
				return;
            }
			
            this.fallbackAction()
	    }
	    else {
            this.smartHarvest()
	    }
	}

	costCallbackAvoidRamparts(roomName, costMatrix) {
		const myRamparts = this.room.find(FIND_MY_STRUCTURES, {
			filter: (structure) => { return structure.structureType == STRUCTURE_RAMPART }
		})
		for(const rampart of myRamparts) {
			costMatrix.set(rampart.pos.x, rampart.pos.y, 25)
		}
	}

	storeRepairAction(storeRepairAction) {
		this.memory.storedAction = {
			...storeRepairAction,
			until: Game.time + storeRepairAction.ticks
		}
	}

	performStoredRepairAction() {
		if(this.memory.storedAction != null && Game.time < (this.memory.storedAction.until ?? 0)) {
			const target = Game.getObjectById<Structure>(this.memory.storedAction.targetId);
			if(target.hits < target.hitsMax) {
				const returnCode = this.repair(target)
				if(returnCode == OK) {
					this.say('🔧');
					return true
				}
			}
		}
		this.memory.storedAction = undefined
		return false
	}
};
