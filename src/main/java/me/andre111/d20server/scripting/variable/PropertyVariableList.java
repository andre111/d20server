package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.model.BaseEntity;
import me.andre111.d20common.model.entity.map.TokenList;
import me.andre111.d20server.model.EntityManagers;
import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;

public class PropertyVariableList extends PropertyVariable {
	private final String listName;
	
	public PropertyVariableList(String fullName, String listName, String propertyName) {
		super(fullName, propertyName);
		
		this.listName = listName;
	}

	@Override
	protected BaseEntity getEntity(Context context) throws ScriptException {
		TokenList list = EntityManagers.get(TokenList.class).all().stream().filter(l -> l.getName().equals(listName)).findFirst().orElse(null);
		if(list != null) {
			return list;
		}
		
		throw new ScriptException("Could not find list: "+listName);
	}
}
