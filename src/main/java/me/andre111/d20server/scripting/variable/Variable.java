package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.expression.Expression;
import me.andre111.d20server.scripting.expression.Result;

public abstract class Variable implements Expression {
	private final String fullName;
	
	public Variable(String fullName) {
		this.fullName = fullName;
	}
	
	public abstract void set(Map map, Profile profile, Object value) throws ScriptException;
	
	public abstract Object get(Map map, Profile profile) throws ScriptException;
	
	@Override
	public Result eval(Map map, Profile profile) throws ScriptException {
		// get value
		Object valueObject = get(map, profile);
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
