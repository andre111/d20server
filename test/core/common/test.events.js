import { strict as assert } from 'assert';
import { EventListener } from '../../../core/common/event-listener.js';
import { Event } from '../../../core/common/event.js';
import { Events } from '../../../core/common/events.js';

// Contains tests for the Events class and related classes (Event, EventListener)
describe('Events', function () {
    describe('on()', function () {
        it('returns an EventListener object', function () {
            const retObj = Events.on('uncalledTest', event => { });
            assert.equal(retObj instanceof EventListener, true, 'returned value is not an instance of EventListener');
        });

        it('correctly sets the callback function', function () {
            const callback = event => { console.log(event); };
            const listener = Events.on('uncalledTest', callback);
            assert.equal(listener.callback, callback);
        });

        it('correctly sets the recievedCanceled property', function () {
            const defaultListener = Events.on('uncalledTest', event => { });
            assert.equal(defaultListener.recieveCanceled, false, 'recieveCanceled did not default to false');

            const listener = Events.on('uncalledTest', event => { }, true);
            assert.equal(listener.recieveCanceled, true);
        });

        it('correctly sets the listener priority', function () {
            const defaultListener = Events.on('uncalledTest', event => { });
            assert.equal(defaultListener.priority, 0, 'priority did not default to 0');

            const listener = Events.on('uncalledTest', event => { }, false, 1144185);
            assert.equal(listener.priority, 1144185);
        });

        it('throws an Error when name is not a string', function () {
            assert.throws(() => Events.on(1, event => { }));
            assert.throws(() => Events.on({}, event => { }));
            assert.throws(() => Events.on(null, event => { }));
            assert.throws(() => Events.on(undefined, event => { }));
            assert.throws(() => Events.on());
        });

        it('throws an Error when callback is null/undefined', function () {
            assert.throws(() => Events.on('uncalledTest', null));
            assert.throws(() => Events.on('uncalledTest', undefined));
            assert.throws(() => Events.on('uncalledTest'));
        });
    });

    describe('remove()', function () {
        it('removes EventListeners from being called', function () {
            const name = 'removeTest';
            var called = false;
            const listener = Events.on(name, event => {
                called = true;
            });
            Events.remove(name, listener);

            Events.trigger(name);
            assert.equal(called, false, 'removed EventListener was called');
        });
    });

    describe('trigger()', function () {
        it('returns an Event object', function () {
            const retObj = Events.trigger('test');
            assert.equal(retObj instanceof Event, true, 'returned value is not an instance of Event');
        });

        it('correctly sets provided event data', function () {
            const data = { a: 123, b: 'test', c: [1, 2, 3] };
            const event = Events.trigger('test', data);
            assert.equal(event.data, data);
        });

        it('correctly handels the cancelable flag of the event', function () {
            const event = Events.trigger('test', null);
            assert.equal(event.canceled, false, 'Event started in canceled state');
            assert.equal(event.cancelable, false, 'cancelable did not default to false');
            assert.throws(() => event.cancel(), 'Trying to cancel uncancelable Event should throw an Error');

            const cancelableEvent = Events.trigger('test', null, true);
            assert.equal(cancelableEvent.canceled, false, 'Event started in canceled state');
            assert.equal(cancelableEvent.cancelable, true, 'Event does not retain correct cancelable state');
            assert.doesNotThrow(() => cancelableEvent.cancel(), 'Canceling a cancelable Event should not throw an Error');
            assert.equal(cancelableEvent.canceled, true, 'Event does not store canceled state');
            assert.doesNotThrow(() => cancelableEvent.cancel(), 'Trying to cancel an already canceled Event should not throw an Error');
        });

        it('calls registered listeners', function () {
            var called = false;
            Events.on('triggerTest1', event => {
                called = true;
            });

            Events.trigger('triggerTest1', null);
            assert.equal(called, true);
        });

        it('calls listeners with the correct priority ordering', function () {
            // setup two listeners with the later one using a higher priority and check order
            var calledFirst = false;
            var calledSecond = false;
            Events.on('triggerTest2', event => {
                calledSecond = true;
            }, false, 0);
            Events.on('triggerTest2', event => {
                calledFirst = true;
                if (calledSecond) {
                    assert.fail('wrong listener was called first');
                }
            }, false, 100);

            // trigger event and test that both listeners have been called
            Events.trigger('triggerTest2', null);
            if (!calledFirst || !calledSecond) assert.fail('not all listeners have been called');
        });

        it('does not call listeners after the event has been canceled', function () {
            Events.on('triggerTest3', event => {
                event.cancel();
            }, false, 100);
            Events.on('triggerTest3', event => {
                assert.fail('called listener after event was canceled');
            }, false, 0);

            Events.trigger('triggerTest3', null, true);
        });

        it('does call listeners registered with recieveCanceled', function () {
            var called = false;
            Events.on('triggerTest4', event => {
                event.cancel();
            }, false, 100);
            Events.on('triggerTest4', event => {
                called = true;
            }, true, 0);

            Events.trigger('triggerTest4', null, true);
            assert.equal(called, true);
        });
    });
});
