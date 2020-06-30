package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Layer;
import me.andre111.d20common.model.property.Light;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;

public abstract class PropertyVariable extends Variable {
	protected final String propertyName;

	public PropertyVariable(String fullName, String propertyName) {
		super(fullName);

		this.propertyName = propertyName;
	}

	@Override
	public final void set(Context context, Object value) throws ScriptException {
		// get property
		Property property = getProperty(context);
		if(property == null) {
			throw new ScriptException("No property "+propertyName);
		}

		// check access
		Access accessLevel = getAccessLevel(context);
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
		saveSourceAfterSet(context);
	}

	@Override
	public final Object get(Context context) throws ScriptException {
		// get property
		Property property = getProperty(context);
		if(property == null) {
			throw new ScriptException("No property "+propertyName);
		}

		// check access
		Access accessLevel = getAccessLevel(context);
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
	
	protected abstract Property getProperty(Context context) throws ScriptException;
	protected abstract Access getAccessLevel(Context context) throws ScriptException;
	protected abstract void saveSourceAfterSet(Context context) throws ScriptException;
}
