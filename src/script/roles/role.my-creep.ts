// abstract
export class MyCreep extends Creep {

    populateRoleActions(roleClass: {name: string; prototype: any}) {
        if(roleClass.name == 'MyCreep') {
            return;
        }
        
        this.populateRoleActions(Object.getPrototypeOf(roleClass))

        for(let name of Object.getOwnPropertyNames(roleClass.prototype)) {
            if(this[name] == null) {
                this[name] = roleClass.prototype[name]
            }
        }
    }

    run() {
        
    }
}
