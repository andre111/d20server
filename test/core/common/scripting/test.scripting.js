import { strict as assert } from 'assert';
import { Type } from '../../../../core/common/constants.js';
import { Profile } from '../../../../core/common/profile.js';
import { Scripting } from '../../../../core/common/scripting/scripting.js';
import { Value } from '../../../../core/common/scripting/value.js';

//TODO: write more extensive tests
//TODO: write some tests with entities - i.e. accessing properties, finding entities, ... - requires loading of entity defintions and dummy managers for tests first
describe('Scripting', function () {
    describe('interpret', function () {
        it('executes a full script without errors', function () {
            const scripting = new Scripting(false);

            scripting.interpret(`
                // redefine print function to avoid printing to console during tests
                function print(output) {}

                // actual code
                var a = 3 * 2; 

                if(a == 42) {
                    print(a); 
                } else {
                    var a = print;
                    a("Hello world!");
                }
                print(a);

                a = (2-2)d10;

                // testing function declaraction and closures
                function makeCounter() {
                    var i = 0;
                    function count() {
                        i = i + 1;
                        return i;
                    }
                    return count;
                }

                var counter = makeCounter();
                print(counter());
                print(counter());
                var counterTwo = makeCounter();
                print(counterTwo());
                print(counter());
            `, Profile.SYSTEM);
        });
    });

    describe('interpretExpression', function () {
        it('evaluates basic expressions to the expected value', function () {
            const scripting = new Scripting(false);

            const result = scripting.interpretExpression('(3 * 2 + 5 - sqrt(25)) / min(1.5, 4)', Profile.SYSTEM);
            assert.equal(result.value, (3 * 2 + 5 - Math.sqrt(25)) / Math.min(1.5, 4));
        });

        it('evaluates dice expressions without errors', function () {
            const scripting = new Scripting(false);

            const result = scripting.interpretExpression('1d20cs>=19r==1"fire"', Profile.SYSTEM);
            assert.equal(result.type, Type.DOUBLE, 'Type of dice result is not DOUBLE');
            //TODO: check return value to be inside valid range

            // check dice rolls to match expected values
            assert.equal(scripting.diceRolls.length, 1, 'Number of dice rolls in scripting environment does not match expected value');
            const dr = scripting.diceRolls[0];
            assert.equal(dr.sides, 20, 'Number of sides does not match expected value');
            assert.equal(dr.value, result.value, 'Result is inconsitent between returned value and dice roll object');
            assert.equal(dr.label, 'fire', 'Label does not match expected value');

            // test other dice modifiers

            //TODO: the new parser cannot parse modifiers followed directly by a number (i.e. 4d6dl1)
            // only with a (subsequentlty ignored) comparsison (i.e. 4d6dl==1) or brackets (i.e. 4d6dl(1))
            // because otherwise the numbers are included in the identifier
            // scripting.interpretExpression('4d6dl1');
            // readd the above if this ever becomes possible again
            scripting.interpretExpression('4d6dl(1)', Profile.SYSTEM);
            scripting.throwIfErrored();
        });

        it('detects (syntax) errors', function () {
            const scripting = new Scripting(false, false);

            // check many different kind of errors (with builtin throwIfErrored function)
            assert.throws(() => { scripting.interpretExpression('a +- 2', Profile.SYSTEM); scripting.throwIfErrored(); });
            assert.throws(() => { scripting.interpretExpression('a; 3', Profile.SYSTEM); scripting.throwIfErrored(); });
            assert.throws(() => { scripting.interpretExpression('a + "test"', Profile.SYSTEM); scripting.throwIfErrored(); });
            assert.throws(() => { scripting.interpretExpression('"test" - "string subtraction"', Profile.SYSTEM); scripting.throwIfErrored(); });
            assert.throws(() => { scripting.interpretExpression('min(2)', Profile.SYSTEM); scripting.throwIfErrored(); });
            assert.throws(() => { scripting.interpretExpression('min(2, 3', Profile.SYSTEM); scripting.throwIfErrored(); });
            assert.throws(() => { scripting.interpretExpression('a = 2', Profile.SYSTEM); scripting.throwIfErrored(); });
            assert.throws(() => { scripting.interpretExpression('(-3)d10', Profile.SYSTEM); scripting.throwIfErrored(); });
            assert.throws(() => { scripting.interpretExpression('1d0', Profile.SYSTEM); scripting.throwIfErrored(); });
            //TODO: add more test cases with different errors

            // also tests errors are available in the errors property
            scripting.interpretExpression('12 * "test"', Profile.SYSTEM);
            assert.equal(scripting.errors.length, 1, 'Unexpected number of errors reported');
        });
    });

    describe('pushVariable', function () {
        it('correctly sets the value', function () {
            const scripting = new Scripting(false);

            scripting.pushVariable('testa', new Value(1144185, Type.DOUBLE, ''));
            scripting.pushVariable('testb', new Value('AND', Type.STRING, ''));
            assert.equal(scripting.interpretExpression('testa', Profile.SYSTEM).value, 1144185);
            assert.equal(scripting.interpretExpression('testb', Profile.SYSTEM).value, 'AND');

            // 'override' an existing value + predefined function
            scripting.pushVariable('testa', new Value(-1, Type.DOUBLE, ''));
            scripting.pushVariable('min', new Value(42, Type.DOUBLE, ''));
            assert.equal(scripting.interpretExpression('testa', Profile.SYSTEM).value, -1);
            assert.equal(scripting.interpretExpression('min', Profile.SYSTEM).value, 42);
        });

        it('throws an Error on invalid arguments', function () {
            const scripting = new Scripting(false);

            assert.throws(() => scripting.pushVariable(12, new Value('invalid name', Type.STRING, '')));
            assert.throws(() => scripting.pushVariable('test', null));
            assert.throws(() => scripting.pushVariable('test', undefined));
            assert.throws(() => scripting.pushVariable('test', 'not a scripting value'));
        });
    });

    describe('popVariable', function () {
        it('correctly restores old values', function () {
            const scripting = new Scripting(false, false);

            // push and pop some values
            scripting.pushVariable('testa', new Value(1144185, Type.DOUBLE, ''));
            scripting.pushVariable('testa', new Value(42, Type.DOUBLE, ''));
            scripting.popVariable('testa');
            assert.equal(scripting.interpretExpression('testa', Profile.SYSTEM).value, 1144185);

            scripting.pushVariable('testa', new Value(0, Type.DOUBLE, ''));
            scripting.pushVariable('testa', new Value(1, Type.DOUBLE, ''));
            scripting.popVariable('testa');
            assert.equal(scripting.interpretExpression('testa', Profile.SYSTEM).value, 0);

            // restore very first value
            scripting.popVariable('testa');
            assert.equal(scripting.interpretExpression('testa', Profile.SYSTEM).value, 1144185);

            // remove last value -> undefined -> should error
            scripting.popVariable('testa');
            assert.throws(() => { scripting.interpretExpression('testa', Profile.SYSTEM); scripting.throwIfErrored(); }, 'Variable did not correctly revert to being undefined');
        });
    });
});
