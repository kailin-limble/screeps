import { MyCreep } from './role.my-creep';
import { Utils } from '../utils';

// abstract
export class Worker extends MyCreep {

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
            if(moveErrCode == ERR_NO_PATH) {
                console.log("source inaccesible")
	            this.say('❌');
            }
            else {
	            this.say('⛏️');
            }
        }
    }

    fallbackAction() {        
        if(this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
            this.moveTo(this.room.controller, {reusePath: 5, visualizePathStyle: {stroke: '#770077'}});
        }
        if(this.room.controller != null && this.room.controller.level < 8) {
            this.say('🔼');
        }
        else {
            this.say('⏸️');
        }
    }
}
