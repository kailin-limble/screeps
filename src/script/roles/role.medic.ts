import { Security } from './role.security';
import { Utils } from '../utils';

export class Medic extends Security {

    findWeakestFriendlyInRange(range) {
        let hurtFriendlies = this.pos.findInRange(FIND_MY_CREEPS, range, {
            filter: (creep) => creep.hits < creep.hitsMax
        })

        let weakestFriendly = hurtFriendlies.reduce(
            (prevFriendly, friendly) => {
                if(prevFriendly == null) {
                    return friendly
                }
                else if(friendly.hits < prevFriendly.hits) {
                    return friendly
                }
                return prevFriendly
            },
            null
        )

        return weakestFriendly
    }

    findClosestHurtFriendly() {
        let hurtFriendly = this.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (creep) => creep.hits < creep.hitsMax
        })

        return hurtFriendly
    }

    moveRandomlyInRoom() {
        if(this.memory.dest == null || (Game.time % 25 == 0 && Math.random() < 0.25)) {
            this.memory.dest = new RoomPosition(Math.floor(Math.random()*48 + 1), Math.floor(Math.random()*48 + 1), this.pos.roomName)
        }
        this.moveTo(this.memory.dest.x, this.memory.dest.y, {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
    }

    healWithCorrectRange(friendly) {
        // if(this.pos.inRangeTo(friendly, 1)) {
            return this.heal(friendly)
        // }
        // return this.rangedHeal(friendly)
    }

    // stay in ramparts, heal nearby friendlies. If there are no ramparts, just patrol. 
    runGuard() {
        let myRamparts = this.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => { 
                return structure.structureType == STRUCTURE_RAMPART &&
                    structure.pos.findInRange(FIND_SOURCES, 1).length == 0 &&
                    structure.pos.findInRange(FIND_MY_CREEPS, 0).length == 0 &&
                    structure.pos.findInRange(FIND_MY_STRUCTURES, 0).filter(
                        structure => (OBSTACLE_OBJECT_TYPES as StructureConstant[]).includes(structure.structureType)
                    ).length == 0
            }
        })

        if(myRamparts.length == 0) {            
            this.runPatrol()
            return;
        }

        let weakestFriendly = this.findWeakestFriendlyInRange(3)
        let isInRampart = this.pos.findInRange(FIND_MY_STRUCTURES, 0).find(
            (structure) => structure.structureType == STRUCTURE_RAMPART
        ) != null

        if(weakestFriendly != null && isInRampart) {
            this.healWithCorrectRange(weakestFriendly)
            this.say('💚', true);
        }
        else {
            if(this.memory.dest == null || (Game.time % 25 == 0 && Math.random() < 0.25)) {
                let rampart = myRamparts[Math.floor(Math.random() * myRamparts.length)]
                this.memory.dest = rampart.pos
            }
            this.moveTo(new RoomPosition(this.memory.dest.x, this.memory.dest.y, this.memory.dest.roomName), {reusePath: 50, visualizePathStyle: {stroke: '#777777'}, maxRooms: 1})
            this.say('🚑', true);
        }
	}

    // heal nearby friendlies
    runPatrol() {
        let weakestFriendlyInRange = this.findWeakestFriendlyInRange(1)
        if(weakestFriendlyInRange != null) {
            this.healWithCorrectRange(weakestFriendlyInRange)
            this.say('💚', true);
            return;
        }

        let closestHurtFriendly = this.findClosestHurtFriendly()
        if(closestHurtFriendly != null) {
            if(this.healWithCorrectRange(closestHurtFriendly) == ERR_NOT_IN_RANGE) {
                this.moveTo(closestHurtFriendly, {reusePath: 50, visualizePathStyle: {stroke: '#00ff00'}, maxRooms: 1});
            }
            this.say('💚', true);
            return;
        }
        
        this.moveRandomlyInRoom()
        this.say('🚑', true);
	}

    // heal nearby friendlies
    runExterminate() {
        this.runPatrol()
	}

    // heal nearby friendlies
    runMaraud() {
        this.runPatrol()
	}

    // heal friendlies near by in the room with the flag; return to flag if hurt. Otherwise just patrol. 
    runInvade() {
        if(Game.flags['Invade'] == null) {
            this.runPatrol()
            return;
        }

        if(this.pos.roomName == Game.flags['Invade'].pos.roomName) {
            let isNearFlag = this.pos.inRangeTo(Game.flags['Invade'], 3) != null
            
            if(this.hits/this.hitsMax < 0.33 && !isNearFlag || Utils.isPosOnRoomEdge(this.pos)) {
                this.moveTo(Game.flags['Invade'], {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
                this.say('🩸', true);
                return;
            }

            let weakestFriendlyInRange = this.findWeakestFriendlyInRange(1)
            if(weakestFriendlyInRange != null) {
                this.healWithCorrectRange(weakestFriendlyInRange)
                this.say('💚', true);
                return;
            }
    
            let closestHurtFriendly = this.findClosestHurtFriendly()
            if(closestHurtFriendly != null) {
                if(this.healWithCorrectRange(closestHurtFriendly) == ERR_NOT_IN_RANGE) {
                    this.moveTo(closestHurtFriendly, {reusePath: 50, visualizePathStyle: {stroke: '#00ff00'}});
                }
                this.say('💚', true);
                return;
            }
            else {
                this.moveTo(Game.flags['Invade'], {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
                this.say('🚑', true);
            }
        }
        else {
            this.moveTo(Game.flags['Invade'], {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
            this.say('🚑', true);
        }
	}
};
