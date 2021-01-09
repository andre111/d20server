export class Message {
    // TODO: remove this function, it is only included for compatibility with old server
    preSave() {
        this.msg = this.constructor.name;
    }

    // default message requirements
    requiresAuthentication() {
        return true;
    }

    requiresMap() {
        return false;
    }
}
