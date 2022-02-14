import { Notification } from './notification.js';

export class NotificationManager {
    #container;
    #notifications;

    constructor() {
        this.#container = document.createElement('div');
        this.#container.className = 'notifications';
        this.#notifications = [];
    }

    getContainer() {
        return this.#container;
    }

    addNotification(content, time) {
        const notification = new Notification(content, time);
        this.#container.appendChild(notification.getElement());
        this.#notifications.push(notification);
    }

    update() {
        for (var i = this.#notifications.length - 1; i >= 0; i--) {
            const notification = this.#notifications[i];
            if (!notification.update()) {
                notification.getElement().parentElement.removeChild(notification.getElement());
                this.#notifications.splice(i, 1);
            }
        }
    }
}
