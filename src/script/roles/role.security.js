import { MyCreep } from './role.my-creep';

export class Security extends MyCreep {

    runExterminate() {
        let hostileCreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
        let hostileStructure = this.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES)

        let hostile = hostileCreep || hostileStructure

        if(hostile != null && hostile.hits != null) {
            if(this.attack(hostile) == ERR_NOT_IN_RANGE || this.rangedAttack(hostile) == ERR_NOT_IN_RANGE) {
                this.moveTo(hostile, {reusePath: 5, visualizePathStyle: {stroke: '#ff0000'}});
            }
            this.say('🔫');
        }
        else {
            if(this.memory.dest == null || (Memory.tickCount % 10 == 0 && Math.random() < 0.05)) {
                this.memory.dest = new RoomPosition(Math.floor(Math.random()*48 + 1), Math.floor(Math.random()*48 + 1), this.pos.roomName)
            }
            this.moveTo(this.memory.dest.x, this.memory.dest.y, {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
            this.say('💤');
        }
	}

    runPatrol() {
        let hostileCreeps = this.pos.findInRange(FIND_HOSTILE_CREEPS, 5)
        let hostileStructures = this.pos.findInRange(FIND_HOSTILE_STRUCTURES, 5).filter(structure => structure.hits != null)

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

        if(weakestHostile != null) {
            if(this.attack(weakestHostile) == ERR_NOT_IN_RANGE || this.rangedAttack(weakestHostile) == ERR_NOT_IN_RANGE) {
                this.moveTo(weakestHostile, {reusePath: 50, visualizePathStyle: {stroke: '#ff0000'}});
            }
            this.say('🔫');
        }
        else {
            if(this.memory.dest == null || (Memory.tickCount % 10 == 0 && Math.random() < 0.05)) {
                this.memory.dest = new RoomPosition(Math.floor(Math.random()*48 + 1), Math.floor(Math.random()*48 + 1), this.pos.roomName)
            }
            this.moveTo(this.memory.dest.x, this.memory.dest.y, {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
            this.say('🧿');
        }
	}

    runMaraud() {
        let hostileCreeps = this.pos.findInRange(FIND_HOSTILE_CREEPS, 20, {
            filter: (creep) => {
                return (
                    creep.hits != null 
                    && creep.hits < this.hits*2
                    && !(creep.owner.username == 'Invader' || !creep.name.includes("k") || !creep.name.includes("K"))
                )
            }
        })
        let hostileStructures = this.pos.findInRange(FIND_HOSTILE_STRUCTURES, 20, {
            filter: (structure) => {
                return (
                    structure.hits != null 
                    && (structure.owner.username == 'Invader')
                )
            }
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

        if(weakestHostile != null) {
            if(this.attack(weakestHostile) == ERR_NOT_IN_RANGE || this.rangedAttack(weakestHostile) == ERR_NOT_IN_RANGE) {
                this.moveTo(weakestHostile, {reusePath: 50, visualizePathStyle: {stroke: '#ff0000'}});
            }
            this.say('🔫');
        }
        else {
            if(this.memory.dest == null || (Memory.tickCount % 10 == 0 && Math.random() < 0.05)) {
                const exitKeys = ['1', '3', '5', '7']
                const randomExitKey = exitKeys[Math.floor(Math.random() * exitKeys.length)]
                const newRoomName = Game.map.describeExits(this.pos.roomName)[randomExitKey]
                if(newRoomName != null) {
                    this.memory.dest = new RoomPosition(Math.floor(Math.random()*48 + 1), Math.floor(Math.random()*48 + 1), newRoomName)
                }
            }
            this.moveTo(new RoomPosition(this.memory.dest.x, this.memory.dest.y, this.memory.dest.roomName), {reusePath: 50, visualizePathStyle: {stroke: '#777777'}})
            this.say('🧿');
        }
	}
};
