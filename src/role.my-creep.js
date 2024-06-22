// abstract
class MyCreep extends Creep {

    constructor() {}

    populateRoleActions(roleClass) {
        if(roleClass.name == 'MyCreep') {
            return;
        }
        for(let name of Object.getOwnPropertyNames(roleClass.prototype)) {
            if(this[name] == null) {
                this[name] = roleClass.prototype[name]
            }
        }
        this.populateRoleActions(Object.getPrototypeOf(roleClass))
    }
}

module.exports = MyCreep;