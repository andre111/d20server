package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.message.game.token.list.UpdateTokenList;
import me.andre111.d20common.model.entity.map.TokenList;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.service.MessageService;

public class PropertyVariableList extends PropertyVariable {
	private final String listName;
	
	public PropertyVariableList(String fullName, String listName, String propertyName) {
		super(fullName, propertyName);
		
		this.listName = listName;
	}

	@Override
	protected Property getProperty(Context context) throws ScriptException {
		// get property
		Property property = getList(context).getProperty(propertyName);
		if(property == null) {
			throw new ScriptException("List has no property "+propertyName);
		}
		return property;
	}

	@Override
	protected Access getAccessLevel(Context context) throws ScriptException {
		return getList(context).getAccessLevel(context.getProfile());
	}

	@Override
	protected void saveSourceAfterSet(Context context) throws ScriptException {
		EntityManager.MAP.save(context.getMap());
		MessageService.send(new UpdateTokenList(getList(context)), context.getMap());
	}
	
	private TokenList getList(Context context) throws ScriptException {
		TokenList list = context.getMap().getTokenList(listName);
		if(list != null) {
			return list;
		}
		
		throw new ScriptException("Could not find list: "+listName);
	}
}
