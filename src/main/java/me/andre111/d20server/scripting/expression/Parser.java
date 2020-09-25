package me.andre111.d20server.scripting.expression;

import java.util.ArrayList;
import java.util.List;

import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.variable.parser.VariableParser;

//Grammar:
// expression = term | expression `+` term | expression `-` term
// term = factor | term `*` factor | term `/` factor
// factor = `+` factor | `-` factor | `(` expression `)` | value
// value = `{` variable `}` | function | dice | number
// function = identifier `(` parameters `)`
// parameters = expression | parameters `,` expression
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
				
				x = (c -> {
					Result ar = a.eval(c);
					Result br = b.eval(c);
					return new Result(ar.v + br.v, ar.s + " + " + br.s, ar.cf || br.cf, ar.cs || br.cs);
				});
			} else if(eat('-')) {
				// parse subtraction
				Expression a = x;
				Expression b = parseTerm();
				
				x = (c -> {
					Result ar = a.eval(c);
					Result br = b.eval(c);
					return new Result(ar.v - br.v, ar.s + " - " + br.s, ar.cf || br.cf, ar.cs || br.cs);
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
				
				x = (c -> {
					Result ar = a.eval(c);
					Result br = b.eval(c);
					return new Result(ar.v * br.v, ar.s + " * " + br.s, ar.cf || br.cf, ar.cs || br.cs);
				});
			} else if(eat('/')) {
				// parse division
				Expression a = x;
				Expression b = parseFactor();
				
				x = (c -> {
					Result ar = a.eval(c);
					Result br = b.eval(c);
					return new Result(ar.v / br.v, ar.s + " / " + br.s, ar.cf || br.cf, ar.cs || br.cs);
				});
			} else {
				return x;
			}
		}
	}
	
	// factor = `+` factor | `-` factor | `(` expression `)` | value
	private Expression parseFactor() throws ScriptException {
		// parse signed factor
		if(eat('+')) {
			return parseFactor();
		}
		if(eat('-')) {
			Expression a = parseFactor();
			return (c -> {
				Result ar = a.eval(c);
				return new Result(-ar.v, "-"+ar.s, ar.cf, ar.cf);
			});
		}
		
		// parse (expression)
		if(eat('(')) {
			Expression a = parseExpression();
			if(!eat(')')) throw new ScriptException("Unclosed parentheses");
			
			return (c -> {
				Result ar = a.eval(c);
				return new Result(ar.v, "("+ar.s+")", ar.cf, ar.cs);
			});
		}
		
		// parse value
		return parseValue();
	}

	// value = `{` variable `}` | function | dice | number
	private Expression parseValue() throws ScriptException {
		// variable
		if(eat('{')) {
			int startPos = pos;
			while((c != '}' && c != -1)) nextChar();
			String variableString = string.substring(startPos, pos);
			if(!eat('}')) throw new ScriptException("Unclosed variable parentheses");
			
			return VariableParser.parseVariable(variableString);
		}
		
		// function
		if(Character.isAlphabetic(c)) {
			return parseFunction();
		}
		
		// find substring
		int startPos = pos;
		while((c >= '0' && c <= '9') || c == '.' || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '<' || c == '>' || c == '=' || c == '!') nextChar();
		String valueString = string.substring(startPos, pos);
		
		// parse string
		if(valueString.matches("\\d+")) {
			// parse number
			int number = Integer.parseInt(valueString);
			return (c -> new Result(number, Integer.toString(number), false, false));
		} else if(valueString.matches("[\\d\\.]+")) {
			// parse number
			double number = Double.parseDouble(valueString);
			return (c -> new Result(number, Double.toString(number), false, false));
		} else {
			// parse dice
			DiceParser diceParser = new DiceParser();
			return diceParser.parse(valueString);
		}
	}

	// function = identifier `(` parameters `)`
	private Expression parseFunction() throws ScriptException {
		String name = parseIdentifier();
		if(!eat('(')) throw new ScriptException("Expected (");
		List<Expression> parameters = parseParameters();
		if(!eat(')')) throw new ScriptException("Expected )");
		
		// function implementation - might need a better generalized system in the future
		switch(name) {
		case "min": {
			if(parameters.size() != 2) throw new ScriptException("Wrong parameter count for min, 2 expected, got "+parameters.size());
			return (c -> {
				Result r1 = parameters.get(0).eval(c);
				Result r2 = parameters.get(1).eval(c);
				return new Result(Math.min(r1.v, r2.v), "min("+r1.s+", "+r2.s+")", r1.cf || r2.cf, r1.cs || r2.cs);
			});
		}
		case "max": {
			if(parameters.size() != 2) throw new ScriptException("Wrong parameter count for max, 2 expected, got "+parameters.size());
			return (c -> {
				Result r1 = parameters.get(0).eval(c);
				Result r2 = parameters.get(1).eval(c);
				return new Result(Math.max(r1.v, r2.v), "max("+r1.s+", "+r2.s+")", r1.cf || r2.cf, r1.cs || r2.cs);
			});
		}
		case "sqrt": {
			if(parameters.size() != 1) throw new ScriptException("Wrong parameter count for sqrt, 1 expected, got "+parameters.size());
			return (c -> {
				Result r1 = parameters.get(0).eval(c);
				return new Result(Math.sqrt(r1.v), "sqrt("+r1.s+")", r1.cf, r1.cs);
			});
		}
		default:
			throw new ScriptException("Unknown function "+name);
		}
	}
	
	private String parseIdentifier() throws ScriptException {
		StringBuilder identifier = new StringBuilder();
		while(Character.isAlphabetic(c) || Character.isDigit(c) || c == '_') {
			identifier.append((char) c);
			nextChar();
		}
		return identifier.toString();
	}

	// parameters = expression | parameters `,` expression
	private List<Expression> parseParameters() throws ScriptException {
		List<Expression> parameters = new ArrayList<>();
		do {
			parameters.add(parseExpression());
		} while(eat(','));
		return parameters;
	}
}
