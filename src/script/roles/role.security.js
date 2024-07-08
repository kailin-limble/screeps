import { MyCreep } from './role.my-creep';

export class Security extends MyCreep {

    findWeakestHostileInRange(range) {
        let hostileCreeps = this.pos.findInRange(FIND_HOSTILE_CREEPS, range, {
            filter: (creep) => { return  creep.hits != null }
        })
        let hostileStructures = this.pos.findInRange(FIND_HOSTILE_STRUCTURES, range, {
            filter: (structure) => { return  structure.hits != null }
        })

        let weakestHostile = [...hostileCreeps, ...hostileStructures].reduce(
            (prevHostile, hostile) => {
                if(prevHostile == null) {
                    return hostile
                }
                else if(hostile.hits < prevHostile.hits) {
                    return hostile
                }
                return prevHostile
            },
            null
        )

        return weakestHostile
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
            filter: (structure) => { return structure.structureType == STRUCTURE_RAMPART }
        })

        if(myRamparts.length == 0) {            
            this.runPatrol()
            return;
        }

        let weakestHostile = this.findWeakestHostileInRange(3)
        let isInRampart = this.pos.findInRange(FIND_MY_STRUCTURES, 0).find(
            (structure) => structure.structureType == STRUCTURE_RAMPART
        ) != null

        if(weakestHostile != null && isInRampart) {
            this.attackWithRightBodyPart(weakestHostile)
            this.say('🔫');
        }
        else {
            if(this.memory.dest == null || (Game.time % 25 == 0 && Math.random() < 0.05)) {
                let rampart = myRamparts[Math.floor(Math.random() * myRamparts.length)]
                this.memory.dest = rampart.pos
            }
            this.moveTo(new RoomPosition(this.memory.dest.x, this.memory.dest.y, this.memory.dest.roomName), {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
            this.say('🛡️');
        }
	}

    // move around randomly, engage hostiles if they come near
    runPatrol() {
        let weakestHostile = this.findWeakestHostileInRange(5)

        if(weakestHostile != null) {
            if(this.attackWithRightBodyPart(weakestHostile) == ERR_NOT_IN_RANGE) {
                this.moveTo(weakestHostile, {reusePath: 50, visualizePathStyle: {stroke: '#ff0000'}});
            }
            this.say('🔫');
        }
        else {
            this.moveRandomlyInRoom()
            this.say('🧿');
        }
	}

    // attack the closest hostile in the room 
    runExterminate() {
        let hostile = this.findClosestHostile()

        if(hostile != null) {
            if(this.attackWithRightBodyPart(hostile) == ERR_NOT_IN_RANGE) {
                this.moveTo(hostile, {reusePath: 5, visualizePathStyle: {stroke: '#ff0000'}});
            }
            this.say('🔫');
        }
        else {
            this.moveRandomlyInRoom()
            this.say('💤');
        }
	}

    // move around randomly from room to room, attack weak hostiles on sight
    runMaraud() {
        let weakestHostile = this.findWeakestHostileInRange(20)

        if(weakestHostile != null && weakestHostile.hits < this.hits) {
            if(this.attackWithRightBodyPart(weakestHostile) == ERR_NOT_IN_RANGE) {
                this.moveTo(weakestHostile, {reusePath: 50, visualizePathStyle: {stroke: '#ff0000'}});
            }
            this.say('🔫');
        }
        else {
            this.moveRandomlyBetweenRooms()
            this.say('🧿');
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
                this.moveTo(Game.flags['Invade'], {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
                this.say('🩸');
                return;
            }

            let weakestHostile = this.findWeakestHostileInRange(5)
            if(weakestHostile != null) {
                if(this.attackWithRightBodyPart(weakestHostile) == ERR_NOT_IN_RANGE) {
                    this.moveTo(weakestHostile, {reusePath: 50, visualizePathStyle: {stroke: '#ff0000'}});
                }
                this.say('🔫');
            }
            else {
                this.moveTo(Game.flags['Invade'], {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
                this.say('⚡');
            }
        }
        else {
            this.moveTo(Game.flags['Invade'], {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
            this.say('⚡');
        }
	}
};
