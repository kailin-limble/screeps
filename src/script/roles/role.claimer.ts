import { Worker } from './role.worker';

export class Claimer extends Worker {

    run() {
        if(!this.isInHomeRoom()) {
            this.returnToHomeRoom()
            return;
        }

        const controller = this.room.controller
        if(controller) {
            if(this.claimController(controller) == ERR_NOT_IN_RANGE) {
                this.moveTo(controller)
            }
            this.say('🤏');
        }
	}
};
