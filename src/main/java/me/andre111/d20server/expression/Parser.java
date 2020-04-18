package me.andre111.d20server.expression;

//Grammar:
// expression = term | expression `+` term | expression `-` term
// term = factor | term `*` factor | term `/` factor
// factor = `+` factor | `-` factor | `(` expression `)` | value
// value = dice | number
public class Parser {
	private String string;
	private int pos;
	private int c;
	
	public Expression parse(String string) {
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
	private Expression parseExpression() {
		Expression x = parseTerm();
		while(true) {
			if(eat('+')) {
				// parse sum
				Expression a = x;
				Expression b = parseTerm();
				
				x = (() -> {
					Result ar = a.eval();
					Result br = b.eval();
					return new Result(ar.v + br.v, ar.s + " + " + br.s);
				});
			} else if(eat('-')) {
				// parse subtraction
				Expression a = x;
				Expression b = parseTerm();
				
				x = (() -> {
					Result ar = a.eval();
					Result br = b.eval();
					return new Result(ar.v - br.v, ar.s + " - " + br.s);
				});
			} else {
				return x;
			}
		}
	}
	
	// term = factor | term `*` factor | term `/` factor
	private Expression parseTerm() {
		Expression x = parseFactor();
		while(true) {
			if(eat('*')) {
				// parse multiplication
				Expression a = x;
				Expression b = parseFactor();
				
				x = (() -> {
					Result ar = a.eval();
					Result br = b.eval();
					return new Result(ar.v * br.v, ar.s + " * " + br.s);
				});
			} else if(eat('/')) {
				// parse division
				Expression a = x;
				Expression b = parseFactor();
				
				x = (() -> {
					Result ar = a.eval();
					Result br = b.eval();
					return new Result(ar.v / br.v, ar.s + " / " + br.s);
				});
			} else {
				return x;
			}
		}
	}
	
	// factor = `+` factor | `-` factor | `(` expression `)` | value
	private Expression parseFactor() {
		// parse signed facotr
		if(eat('+')) {
			return parseFactor();
		}
		if(eat('-')) {
			Expression a = parseFactor();
			return (() -> {
				Result ar = a.eval();
				return new Result(-ar.v, "-"+ar.s);
			});
		}
		
		// parse (expression)
		if(eat('(')) {
			Expression a = parseExpression();
			if(!eat(')')) throw new IllegalArgumentException("Unclosed parentheses");
			
			return (() -> {
				Result ar = a.eval();
				return new Result(ar.v, "("+ar.s+")");
			});
		}
		
		// parse value
		return parseValue();
	}

	// value = dice | number
	private Expression parseValue() {
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
			return (() -> new Result(number, Integer.toString(number)));
		}
	}
}
