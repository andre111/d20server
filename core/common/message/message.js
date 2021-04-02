export class Message {
    // default message requirements
    requiresAuthentication() {
        return true;
    }

    requiresMap() {
        return false;
    }
}
