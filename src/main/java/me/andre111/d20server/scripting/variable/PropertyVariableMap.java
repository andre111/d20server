package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.model.BaseEntity;
import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;

public class PropertyVariableMap extends PropertyVariable {
	public PropertyVariableMap(String fullName, String propertyName) {
		super(fullName, propertyName);
	}

	@Override
	protected BaseEntity getEntity(Context context) throws ScriptException {
		return context.map();
	}
}
