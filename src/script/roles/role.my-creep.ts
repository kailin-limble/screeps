// abstract
export class MyCreep extends Creep {

    populateRoleActions(roleClass: {name: string; prototype: any}) {
        if(roleClass.name == 'MyCreep') {
            if (this.run == null) {
                this.run = MyCreep.prototype.run;
            }
            return;
        }
        
        for(let name of Object.getOwnPropertyNames(roleClass.prototype)) {
            if(name != "constructor" && this[name] == null) {
                this[name] = roleClass.prototype[name]
            }
        }
        
        this.populateRoleActions(Object.getPrototypeOf(roleClass))
    }

    run() {
        console.log("This creep's run() is not implemented. ");
    }
}
