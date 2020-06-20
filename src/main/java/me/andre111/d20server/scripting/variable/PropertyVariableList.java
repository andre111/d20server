package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.message.game.token.list.UpdateTokenList;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.TokenList;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.service.MessageService;

public class PropertyVariableList extends PropertyVariable {
	private final String listName;
	
	public PropertyVariableList(String fullName, String listName, String propertyName) {
		super(fullName, propertyName);
		
		this.listName = listName;
	}

	@Override
	protected Property getProperty(Map map, Profile profile) throws ScriptException {
		// get property
		Property property = getList(map).getProperty(propertyName);
		if(property == null) {
			throw new ScriptException("List has no property "+propertyName);
		}
		return property;
	}

	@Override
	protected Access getAccessLevel(Map map, Profile profile) throws ScriptException {
		return getList(map).getAccessLevel(profile);
	}

	@Override
	protected void saveSourceAfterSet(Map map, Profile profile) throws ScriptException {
		EntityManager.MAP.save(map);
		MessageService.send(new UpdateTokenList(getList(map)), map);
	}
	
	private TokenList getList(Map map) throws ScriptException {
		TokenList list = map.getTokenList(listName);
		if(list != null) {
			return list;
		}
		
		throw new ScriptException("Could not find list: "+listName);
	}
}
