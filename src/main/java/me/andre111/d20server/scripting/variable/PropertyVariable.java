package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Layer;
import me.andre111.d20common.model.property.Light;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.scripting.ScriptException;

public abstract class PropertyVariable extends Variable {
	protected final String propertyName;

	public PropertyVariable(String fullName, String propertyName) {
		super(fullName);

		this.propertyName = propertyName;
	}

	@Override
	public final void set(Map map, Profile profile, Object value) throws ScriptException {
		// get property
		Property property = getProperty(map, profile);
		if(property == null) {
			throw new ScriptException("No property "+propertyName);
		}

		// check access
		Access accessLevel = getAccessLevel(map, profile);
		if(!property.canEdit(accessLevel)) {
			throw new ScriptException("No edit access to "+getFullName());
		}

		// TODO: set value (by type)
		switch(property.getType()) {
		case BOOLEAN:
			property.setBoolean((Boolean) value);
			break;
		case DOUBLE:
			property.setDouble((Double) value);
			break;
		case LAYER:
			property.setLayer((Layer) value);
			break;
		case LIGHT:
			property.setLight((Light) value);
			break;
		case LONG:
			property.setLong((Long) value);
			break;
		case PLAYER:
			property.setPlayerID((Long) value);
			break;
		case STRING:
			property.setString(value.toString());
			break;
		default:
			break;
		}
		
		// save
		saveSourceAfterSet(map, profile);
	}

	@Override
	public final Object get(Map map, Profile profile) throws ScriptException {
		// get property
		Property property = getProperty(map, profile);
		if(property == null) {
			throw new ScriptException("No property "+propertyName);
		}

		// check access
		Access accessLevel = getAccessLevel(map, profile);
		if(!property.canView(accessLevel)) {
			throw new ScriptException("No view access to "+getFullName());
		}

		// get value (by type)
		switch(property.getType()) {
		case BOOLEAN:
			return property.getBoolean();
		case DOUBLE:
			return property.getDouble();
		case LAYER:
			return property.getLayer();
		case LIGHT:
			return property.getLight();
		case LONG:
			return property.getLong();
		case PLAYER:
			return property.getPlayerID();
		case STRING:
			return property.getString();
		default:
			throw new ScriptException("Missing implementation for type "+property.getType());
		}
	}
	
	protected abstract Property getProperty(Map map, Profile profile) throws ScriptException;
	protected abstract Access getAccessLevel(Map map, Profile profile) throws ScriptException;
	protected abstract void saveSourceAfterSet(Map map, Profile profile) throws ScriptException;
}
