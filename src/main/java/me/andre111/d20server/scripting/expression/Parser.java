package me.andre111.d20server.scripting.expression;

import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.variable.parser.VariableParser;

//Grammar:
// expression = term | expression `+` term | expression `-` term
// term = factor | term `*` factor | term `/` factor
// factor = `+` factor | `-` factor | `(` expression `)` | value
// value = `{` variable `}` | dice | number
public class Parser {
	private String string;
	private int pos;
	private int c;
	
	public Expression parse(String string) throws ScriptException {
		// init
		this.string = string;
		this.pos = -1;
		nextChar();
		
		return parseExpression();
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
	
	// expression = term | expression `+` term | expression `-` term
	private Expression parseExpression() throws ScriptException {
		Expression x = parseTerm();
		while(true) {
			if(eat('+')) {
				// parse sum
				Expression a = x;
				Expression b = parseTerm();
				
				x = ((m,p) -> {
					Result ar = a.eval(m,p);
					Result br = b.eval(m,p);
					return new Result(ar.v + br.v, ar.s + " + " + br.s, ar.hadCriticalFailure || br.hadCriticalFailure, ar.hadCriticalSuccess || br.hadCriticalSuccess);
				});
			} else if(eat('-')) {
				// parse subtraction
				Expression a = x;
				Expression b = parseTerm();
				
				x = ((m,p) -> {
					Result ar = a.eval(m,p);
					Result br = b.eval(m,p);
					return new Result(ar.v - br.v, ar.s + " - " + br.s, ar.hadCriticalFailure || br.hadCriticalFailure, ar.hadCriticalSuccess || br.hadCriticalSuccess);
				});
			} else {
				return x;
			}
		}
	}
	
	// term = factor | term `*` factor | term `/` factor
	private Expression parseTerm() throws ScriptException {
		Expression x = parseFactor();
		while(true) {
			if(eat('*')) {
				// parse multiplication
				Expression a = x;
				Expression b = parseFactor();
				
				x = ((m,p) -> {
					Result ar = a.eval(m,p);
					Result br = b.eval(m,p);
					return new Result(ar.v * br.v, ar.s + " * " + br.s, ar.hadCriticalFailure || br.hadCriticalFailure, ar.hadCriticalSuccess || br.hadCriticalSuccess);
				});
			} else if(eat('/')) {
				// parse division
				Expression a = x;
				Expression b = parseFactor();
				
				x = ((m,p) -> {
					Result ar = a.eval(m,p);
					Result br = b.eval(m,p);
					return new Result(ar.v / br.v, ar.s + " / " + br.s, ar.hadCriticalFailure || br.hadCriticalFailure, ar.hadCriticalSuccess || br.hadCriticalSuccess);
				});
			} else {
				return x;
			}
		}
	}
	
	// factor = `+` factor | `-` factor | `(` expression `)` | value
	private Expression parseFactor() throws ScriptException {
		// parse signed facotr
		if(eat('+')) {
			return parseFactor();
		}
		if(eat('-')) {
			Expression a = parseFactor();
			return ((m,p) -> {
				Result ar = a.eval(m,p);
				return new Result(-ar.v, "-"+ar.s, ar.hadCriticalFailure, ar.hadCriticalFailure);
			});
		}
		
		// parse (expression)
		if(eat('(')) {
			Expression a = parseExpression();
			if(!eat(')')) throw new ScriptException("Unclosed parentheses");
			
			return ((m,p) -> {
				Result ar = a.eval(m,p);
				return new Result(ar.v, "("+ar.s+")", ar.hadCriticalFailure, ar.hadCriticalSuccess);
			});
		}
		
		// parse value
		return parseValue();
	}

	// value = `{` variable `}` | dice | number
	private Expression parseValue() throws ScriptException {
		// variable
		if(eat('{')) {
			int startPos = pos;
			while((c != '}' && c != -1)) nextChar();
			String variableString = string.substring(startPos, pos);
			if(!eat('}')) throw new ScriptException("Unclosed variable parentheses");
			
			return VariableParser.parseVariable(variableString);
		}
		
		// find substring
		int startPos = pos;
		while((c >= '0' && c <= '9') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '<' || c == '>' || c == '=' || c == '!') nextChar();
		String valueString = string.substring(startPos, pos);
		
		// parse string
		if(valueString.matches("\\d+")) {
			// parse number
			int number = Integer.parseInt(valueString);
			return ((m,p) -> new Result(number, Integer.toString(number), false, false));
		} else {
			// adjust to "normalized" dice format
			valueString = valueString.toUpperCase();
			valueString = valueString.replace("W", "D");
			
			DiceParser diceParser = new DiceParser();
			return diceParser.parse(valueString);
		}
	}
}
