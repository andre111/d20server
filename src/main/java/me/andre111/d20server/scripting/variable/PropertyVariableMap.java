package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.model.Entity;
import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;

public class PropertyVariableMap extends PropertyVariable {
	public PropertyVariableMap(String fullName, String propertyName) {
		super(fullName, propertyName);
	}

	@Override
	protected Entity getEntity(Context context) throws ScriptException {
		return context.map();
	}
}
