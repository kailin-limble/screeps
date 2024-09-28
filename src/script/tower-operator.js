import { Utils } from './utils';

export class TowerOperator {

    constructor(room) {
        this.room = room
    }

    runTowers() {
        let towers = this.room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        towers.sort((a, b) => {
            b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]
        })

        if(towers.length === 0) {
            return;
        }

        let hostilesByHits = this.room.find(FIND_HOSTILE_CREEPS, {
            filter: (creep) => !Utils.getAllies().includes(creep.owner.username)
        });
        hostilesByHits.sort((a, b) => {
            a.hits - b.hits
        })

        if( towers[Math.floor(towers.length/2)].store[RESOURCE_ENERGY] >= 10 && hostilesByHits.length > 0) {
            for(const tower of towers) {
                if(hostilesByHits[0] && tower.pos.inRangeTo(hostilesByHits[0], 10)) {
                    tower.attack(hostilesByHits[0])
                }
                else if(hostilesByHits[1] && tower.pos.inRangeTo(hostilesByHits[1], 10)) {
                    tower.attack(hostilesByHits[1])
                }
                else if(hostilesByHits[2] && tower.pos.inRangeTo(hostilesByHits[2], 10)) {
                    tower.attack(hostilesByHits[2])
                }
                else {
                    const closestHostile = tower.pos.findClosestByRange(hostilesByHits);
                    if(closestHostile) {
                        tower.attack(closestHostile);
                    }
                }
            }
        }
        
        var closestHurtCreep = towers[0].pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (creep) => (creep.hits < creep.hitsMax && creep.hits < 900)
        });
        if(closestHurtCreep) {
            towers[0].heal(closestHurtCreep);
        }

        var closestDamagedStructure = towers[0].pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => (structure.hits < structure.hitsMax && structure.hits < 9900 && structure.hits / structure.hitsMax < 0.50)
        });
        if(closestDamagedStructure && hostilesByHits.length > 0) {
            towers[0].repair(closestDamagedStructure);
        }
    }
}
