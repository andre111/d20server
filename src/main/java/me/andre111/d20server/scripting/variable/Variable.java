package me.andre111.d20server.scripting.variable;

import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.expression.Expression;
import me.andre111.d20server.scripting.expression.Result;

public abstract class Variable implements Expression {
	private final String fullName;
	
	public Variable(String fullName) {
		this.fullName = fullName;
	}
	
	public abstract void set(Context context, Object value) throws ScriptException;
	
	public abstract Object get(Context context) throws ScriptException;
	
	@Override
	public Result eval(Context context) throws ScriptException {
		// get value
		Object valueObject = get(context);
		double value = 0;
		
		// try to interpret as number
		if(valueObject instanceof Long) {
			value = (long) valueObject;
		} else if(valueObject instanceof Double) {
			value = (long) (double) valueObject;
		} else {
			throw new ScriptException("Variable "+fullName+" is not a number");
		}
		
		// return result
		String valueString = (value == Math.round(value)) ? Long.toString((long) value) : Double.toString(value);
		return new Result(value, "{"+valueString+"}", false, false);
	}
	
	public String getFullName() {
		return fullName;
	}
}
