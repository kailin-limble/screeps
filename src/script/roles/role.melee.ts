import { Security } from './role.security';

export class Melee extends Security {

    attackWithRightBodyPart(hostile) {
        return this.attack(hostile)
    }

    // stay in ramparts, attack hostiles if they come in range. If there are no ramparts, just patrol. 
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

        let weakestHostile = this.findWeakestDangerousHostileInRange(3)
        let isInRampart = this.pos.findInRange(FIND_MY_STRUCTURES, 0).find(
            (structure) => structure.structureType == STRUCTURE_RAMPART
        ) != null

        if(weakestHostile != null && isInRampart) {
            this.attackWithRightBodyPart(weakestHostile)
            this.say('🔫', true);
        }
        else {
            if(this.memory.dest == null || (Game.time % 25 == 0 && Math.random() < 0.25)) {
                let rampart = myRamparts[Math.floor(Math.random() * myRamparts.length)]
                this.memory.dest = rampart.pos
            }
            this.moveTo(new RoomPosition(this.memory.dest.x, this.memory.dest.y, this.memory.dest.roomName), {reusePath: 50, visualizePathStyle: {stroke: '#777777'}, maxRooms: 1})
            this.say('🛡️', true);
        }
	}

    // move around randomly, engage hostiles if they come near
    runPatrol() {
        let weakestHostile = this.findWeakestDangerousHostileInRange(5)

        if(weakestHostile != null) {
            if(this.attackWithRightBodyPart(weakestHostile) == ERR_NOT_IN_RANGE) {
                this.moveTo(weakestHostile, {reusePath: 50, visualizePathStyle: {stroke: '#ff0000'}, maxRooms: 1});
            }
            this.say('🔫', true);
        }
        else {
            this.moveRandomlyInRoom()
            this.say('🧿', true);
        }
	}

    // attack the closest hostile in the room 
    runExterminate() {
        let hostile = this.findClosestHostile()

        if(hostile != null) {
            if(this.attackWithRightBodyPart(hostile) == ERR_NOT_IN_RANGE) {
                this.moveTo(hostile, {reusePath: 5, visualizePathStyle: {stroke: '#ff0000'}});
            }
            this.say('🔫', true);
        }
        else {
            this.moveRandomlyInRoom()
            this.say('💤', true);
        }
	}

    // move around randomly from room to room, attack weak hostiles on sight
    runMaraud() {
        let weakestHostile = this.findWeakestDangerousHostileInRange(20)

        if(weakestHostile != null && weakestHostile.hits < this.hits) {
            if(this.attackWithRightBodyPart(weakestHostile) == ERR_NOT_IN_RANGE) {
                this.moveTo(weakestHostile, {reusePath: 50, visualizePathStyle: {stroke: '#ff0000'}});
            }
            this.say('🔫', true);
        }
        else {
            this.moveRandomlyBetweenRooms()
            this.say('🧿', true);
        }
	}

    // attack hostiles near by in the room with the flag; return to flag if hurt. Otherwise just patrol. 
    runInvade() {
        if(Game.flags['Invade'] == null) {
            this.runPatrol()
            return;
        }

        if(this.pos.roomName == Game.flags['Invade'].pos.roomName) {
            let isNearFlag = this.pos.inRangeTo(Game.flags['Invade'], 3) != null
            
            if(this.hits/this.hitsMax < 0.33 && !isNearFlag) {
                this.moveTo(Game.flags['Invade'], {reusePath: 5, visualizePathStyle: {stroke: '#777777'}})
                this.say('🩸', true);
                return;
            }

            let weakestHostile = this.findWeakestDangerousHostileInRange(3)
            if(weakestHostile != null) {
                if(this.attackWithRightBodyPart(weakestHostile) == ERR_NOT_IN_RANGE) {
                    this.moveTo(weakestHostile, {reusePath: 5, visualizePathStyle: {stroke: '#ff0000'}});
                }
                this.say('🔫', true);
                return;
            }
        }

        this.moveTo(Game.flags['Invade'], {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
        this.say('⚡', true);
	}
};
