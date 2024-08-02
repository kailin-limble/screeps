import { MyCreep } from './role.my-creep';

export class Security extends MyCreep {

    findWeakestDangerousHostileInRange(range) {
        function reducer(prevHostile, hostile) {
            if(prevHostile == null) {
                return hostile
            }
            if(hostile.hits < prevHostile.hits) {
                return hostile
            }
            return prevHostile
        }

        let dangerousHostileCreeps = this.pos.findInRange(FIND_HOSTILE_CREEPS, range, {
            filter: (creep) => { 
                return creep.hits != null && (
                    creep.getActiveBodyparts(ATTACK) > 0 || 
                    creep.getActiveBodyparts(RANGED_ATTACK) > 0 || 
                    creep.getActiveBodyparts(HEAL) > 0
                )
            }
        })
        let dangerousHostileStructures = this.pos.findInRange(FIND_HOSTILE_STRUCTURES, range, {
            filter: (structure) => { 
                return structure.hits != null && structure.hits > 0 && structure.structureType == STRUCTURE_TOWER
            }
        })

        let weakestDangerousHostile = [...dangerousHostileCreeps, ...dangerousHostileStructures].reduce(
            reducer,
            null
        )
        if(
            weakestDangerousHostile != null && 
            this.pos.findPathTo(weakestDangerousHostile.pos).length <= range+1
        ) {
            return weakestDangerousHostile
        }

        let hostileCreeps = this.pos.findInRange(FIND_HOSTILE_CREEPS, range, {
            filter: (creep) => { return creep.hits != null }
        })
        let hostileStructures = this.pos.findInRange(FIND_HOSTILE_STRUCTURES, range, {
            filter: (structure) => { return structure.hits != null && structure.hits > 0 }
        })

        let weakestHostile = [...hostileCreeps, ...hostileStructures].reduce(
            reducer,
            null
        )
        if(
            weakestHostile != null && 
            this.pos.findPathTo(weakestHostile.pos).length <= range*2
        ) {
            return weakestHostile
        }

        return null
    }

    findClosestHostile() {
        let hostileCreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: (creep) => creep.hits != null 
        })
        let hostileStructure = this.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
            filter: (structure) => structure.hits != null 
        })

        return hostileCreep || hostileStructure
    }

    moveRandomlyInRoom() {
        if(this.memory.dest == null || (Game.time % 25 == 0 && Math.random() < 0.25)) {
            this.memory.dest = new RoomPosition(Math.floor(Math.random()*48 + 1), Math.floor(Math.random()*48 + 1), this.pos.roomName)
        }
        this.moveTo(this.memory.dest.x, this.memory.dest.y, {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
    }

    moveRandomlyBetweenRooms() {
        if(this.memory.dest == null || (Game.time % 25 == 0 && Math.random() < 0.25)) {
            const exitKeys = ['1', '3', '5', '7']
            const randomExitKey = exitKeys[Math.floor(Math.random() * exitKeys.length)]
            const newRoomName = Game.map.describeExits(this.pos.roomName)[randomExitKey]
            if(newRoomName != null) {
                this.memory.dest = new RoomPosition(Math.floor(Math.random()*48 + 1), Math.floor(Math.random()*48 + 1), newRoomName)
            }
        }
        this.moveTo(new RoomPosition(this.memory.dest.x, this.memory.dest.y, this.memory.dest.roomName), {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
    }

    attackWithRightBodyPart(hostile) {
        if(this.memory.model == 'MELEE') {
            return this.attack(hostile)
        }
        if(this.pos.getRangeTo(hostile) == 1) {
            return this.rangedMassAttack(hostile)
        }
        return this.rangedAttack(hostile)
    }

    // stay in ramparts, attack hostiles if they come in range. If there are no ramparts, just patrol. 
    runGuard() {
        let myRamparts = this.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => { 
                return structure.structureType == STRUCTURE_RAMPART &&
                    structure.pos.findInRange(FIND_SOURCES, 1).length == 0 &&
                    structure.pos.findInRange(FIND_MY_CREEPS, 0).length == 0
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
            this.moveTo(new RoomPosition(this.memory.dest.x, this.memory.dest.y, this.memory.dest.roomName), {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
            this.say('🛡️', true);
        }
	}

    // move around randomly, engage hostiles if they come near
    runPatrol() {
        let weakestHostile = this.findWeakestDangerousHostileInRange(5)

        if(weakestHostile != null) {
            if(this.attackWithRightBodyPart(weakestHostile) == ERR_NOT_IN_RANGE) {
                this.moveTo(weakestHostile, {reusePath: 50, visualizePathStyle: {stroke: '#ff0000'}});
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

            let weakestHostile = this.findWeakestDangerousHostileInRange(5)
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
