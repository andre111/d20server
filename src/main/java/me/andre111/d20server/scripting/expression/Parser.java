package me.andre111.d20server.scripting.expression;

import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.VariableParser;

//Grammar:
// expression = term | expression `+` term | expression `-` term
// term = factor | term `*` factor | term `/` factor
// factor = `+` factor | `-` factor | `(` expression `)` | value
// value = `{`variable`}` | dice | number
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
				
				x = ((g,m,p) -> {
					Result ar = a.eval(g,m,p);
					Result br = b.eval(g,m,p);
					return new Result(ar.v + br.v, ar.s + " + " + br.s);
				});
			} else if(eat('-')) {
				// parse subtraction
				Expression a = x;
				Expression b = parseTerm();
				
				x = ((g,m,p) -> {
					Result ar = a.eval(g,m,p);
					Result br = b.eval(g,m,p);
					return new Result(ar.v - br.v, ar.s + " - " + br.s);
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
				
				x = ((g,m,p) -> {
					Result ar = a.eval(g,m,p);
					Result br = b.eval(g,m,p);
					return new Result(ar.v * br.v, ar.s + " * " + br.s);
				});
			} else if(eat('/')) {
				// parse division
				Expression a = x;
				Expression b = parseFactor();
				
				x = ((g,m,p) -> {
					Result ar = a.eval(g,m,p);
					Result br = b.eval(g,m,p);
					return new Result(ar.v / br.v, ar.s + " / " + br.s);
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
			return ((g,m,p) -> {
				Result ar = a.eval(g,m,p);
				return new Result(-ar.v, "-"+ar.s);
			});
		}
		
		// parse (expression)
		if(eat('(')) {
			Expression a = parseExpression();
			if(!eat(')')) throw new ScriptException("Unclosed parentheses");
			
			return ((g,m,p) -> {
				Result ar = a.eval(g,m,p);
				return new Result(ar.v, "("+ar.s+")");
			});
		}
		
		// parse value
		return parseValue();
	}

	// value = dice | number
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
		while((c >= '0' && c <= '9') || c == 'D' || c == 'd' || c == 'W' || c == 'w') nextChar();
		String valueString = string.substring(startPos, pos);
		
		// adjust to "normalized" dice format
		valueString = valueString.toUpperCase();
		valueString = valueString.replace("W", "D");
		
		// parse string
		if(valueString.contains("D")) {
			// parse dice //TODO: split into own method
			String[] split = valueString.split("D");
			int count = Integer.parseInt(split[0]);
			int sides = Integer.parseInt(split[1]);
			
			return new Dice(count, sides);
		} else {
			// parse number
			int number = Integer.parseInt(valueString);
			return ((g,m,p) -> new Result(number, Integer.toString(number)));
		}
	}
}
