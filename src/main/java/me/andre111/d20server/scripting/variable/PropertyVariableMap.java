package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.message.game.UpdateMapProperties;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.service.MessageService;

public class PropertyVariableMap extends PropertyVariable {
	public PropertyVariableMap(String fullName, String propertyName) {
		super(fullName, propertyName);
	}

	@Override
	protected Property getProperty(Context context) throws ScriptException {
		// get property
		Property property = context.getMap().getProperty(propertyName);
		if(property == null) {
			throw new ScriptException("Map has no property "+propertyName);
		}
		return property;
	}

	@Override
	protected Access getAccessLevel(Context context) throws ScriptException {
		return context.getMap().getAccessLevel(context.getProfile());
	}

	@Override
	protected void saveSourceAfterSet(Context context) throws ScriptException {
		EntityManager.MAP.save(context.getMap());
		MessageService.send(new UpdateMapProperties(context.getMap()), context.getMap());
	}
}
