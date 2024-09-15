// abstract
export class MyCreep extends Creep {

    constructor() {}

    populateRoleActions(roleClass) {
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
}
