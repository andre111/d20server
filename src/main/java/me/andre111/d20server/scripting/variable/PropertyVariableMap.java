package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.message.game.UpdateMapProperties;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.service.MessageService;

public class PropertyVariableMap extends PropertyVariable {
	public PropertyVariableMap(String fullName, String propertyName) {
		super(fullName, propertyName);
	}

	@Override
	protected Property getProperty(Map map, Profile profile) throws ScriptException {
		// get property
		Property property = map.getProperty(propertyName);
		if(property == null) {
			throw new ScriptException("Map has no property "+propertyName);
		}
		return property;
	}

	@Override
	protected Access getAccessLevel(Map map, Profile profile) throws ScriptException {
		return map.getAccessLevel(profile);
	}

	@Override
	protected void saveSourceAfterSet(Map map, Profile profile) throws ScriptException {
		EntityManager.MAP.save(map);
		MessageService.send(new UpdateMapProperties(map), map);
	}
}
