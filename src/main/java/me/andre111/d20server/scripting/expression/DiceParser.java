package me.andre111.d20server.scripting.expression;

import me.andre111.d20server.scripting.ScriptException;

//Grammar:
// dice = base | base modifiers
// base = number `D` number | `D` number
// modifiers = modifier | modifier modifiers
// modifier = `CS` condition | `CF` condition | `R` condition | `RO' condition | `!` | `!O` | `DL` number | `DH` number | `KL` number | `KH` number
// condition = number | `<` number | `<=` number | `>` number | `>=` number
public class DiceParser {
	private String string;
	private int pos;
	private int c;

	// dice = base | base modifiers
	public Dice parse(String string) throws ScriptException {
		// init
		this.string = string;
		this.pos = -1;
		nextChar();
		
		Dice dice = parseBase();
		if(pos < string.length()) {
			parseModifiers(dice);
		}
		
		return dice;
	}
	
	// reads the next char (or -1 if end of string)
	private void nextChar() {
		c = (++pos < string.length()) ? string.charAt(pos) : -1;
	}
	
	// skips spaces and reads the nextChar if it matches
	private boolean eat(int charToEat) {
		while(c == ' ') nextChar();
		if(c == charToEat) {
			nextChar();
			return true;
		}
		return false;
	}
	
	// base = number `D` number | `D` number
	private Dice parseBase() throws ScriptException {
		int count = 1;
		int sides = 20;
		
		if(eat('D')) {
			sides = parseNumber();
		} else {
			count = parseNumber();
			if(!eat('D')) throw new ScriptException("Invalid dice formatting");
			sides = parseNumber();
		}
		
		return new Dice(count, sides);
	}
	
	// modifiers = modifier | modifier modifiers
	private void parseModifiers(Dice dice) throws ScriptException {
		parseModifier(dice);
		if(pos < string.length()) {
			parseModifiers(dice);
		}
	}

	// modifier = `CS` condition | `CF` condition | `R` condition | `RO' condition | `!` | `!O` | `DL` number | `DH` number | `KL` number | `KH` number
	private void parseModifier(Dice dice) throws ScriptException {
		if(eat('C')) {
			if(eat('S')) {
				dice.setCriticalSuccessCondition(parseCondition());
			} else if(eat('F')) {
				dice.setCriticalFailureCondition(parseCondition());
			} else {
				throw new ScriptException("Unknown modifier at "+(pos-1));
			}
		} else if(eat('R')) {
			if(eat('O')) {
				dice.setRerollCondition(parseCondition());
				dice.setMaxRerollCount(1);
			} else {
				dice.setRerollCondition(parseCondition());
			}
		} else if(eat('!')) {
			if(eat('O')) {
				dice.setExplodeDice(true);
				dice.setMaxExplodeCount(1);
			} else {
				dice.setExplodeDice(true);
			}
		} else if(eat('D')) {
			if(eat('L')) {
				dice.setLowAction(Dice.Action.DROP);
				dice.setLowCount(parseNumber());
			} else if(eat('H')) {
				dice.setHighAction(Dice.Action.DROP);
				dice.setHighCount(parseNumber());
			} else {
				throw new ScriptException("Unknown modifier at "+(pos-1));
			}
		} else if(eat('K')) {
			if(eat('L')) {
				dice.setLowAction(Dice.Action.KEEP);
				dice.setLowCount(parseNumber());
			} else if(eat('H')) {
				dice.setHighAction(Dice.Action.KEEP);
				dice.setHighCount(parseNumber());
			} else {
				throw new ScriptException("Unknown modifier at "+(pos-1));
			}
		} else {
			//TODO ...
			throw new ScriptException("Unknown modifier at "+pos);
		}
	}

	// condition = number | `<` number | `<=` number | `>` number | `>=` number
	private Condition parseCondition() throws ScriptException {
		if(eat('<')) {
			if(eat('=')) {
				return new Condition(Condition.Type.LESS_THAN_OR_EQUAL, parseNumber());
			} else {
				return new Condition(Condition.Type.LESS_THAN, parseNumber());
			}
		} else if(eat('>')) {
			if(eat('=')) {
				return new Condition(Condition.Type.GREATER_THAN_OR_EQUAL, parseNumber());
			} else {
				return new Condition(Condition.Type.GREATER_THAN, parseNumber());
			}
		} else {
			return new Condition(Condition.Type.EQUAL, parseNumber());
		}
	}
	
	private int parseNumber() throws ScriptException {
		// find substring
		int startPos = pos;
		while(c >= '0' && c <= '9') nextChar();
		if(pos == startPos) throw new ScriptException("Expected number at "+startPos);
		String valueString = string.substring(startPos, pos);
		
		try {
			return Integer.parseInt(valueString);
		} catch(NumberFormatException e) {
			throw new ScriptException("Not a parseable number: "+valueString+" at "+startPos);
		}
	}
}
