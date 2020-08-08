package me.andre111.d20server.scripting.variable;

import java.util.Map;

import me.andre111.d20common.model.Entity;
import me.andre111.d20common.model.Property;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Effect;
import me.andre111.d20common.model.property.Layer;
import me.andre111.d20common.model.property.Light;
import me.andre111.d20server.model.EntityManagers;
import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;

public abstract class PropertyVariable extends Variable {
	private final String propertyName;

	public PropertyVariable(String fullName, String propertyName) {
		super(fullName);

		this.propertyName = propertyName;
	}

	@Override
	public final void set(Context context, Object value) throws ScriptException {
		Entity entity = getEntity(context);
		
		// get property
		Property property = entity.prop(propertyName);
		if(property == null) {
			throw new ScriptException("No property "+propertyName);
		}

		// check access
		Access accessLevel = entity.getAccessLevel(context.profile());
		if(!property.canEdit(accessLevel)) {
			throw new ScriptException("No edit access to "+getFullName());
		}

		// set value (by type)
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
		case EFFECT:
			property.setEffect((Effect) value);
			break;
		case ACCESS:
			property.setAccessValue((Access) value);
			break;
		default:
			throw new ScriptException("Missing implementation for type "+property.getType());
		}
		
		// update
		EntityManagers.get(entity.getClass()).updateProperties(entity.id(), Map.of(propertyName, property), accessLevel);
	}

	@Override
	public final Object get(Context context) throws ScriptException {
		Entity entity = getEntity(context);
		
		// get property
		Property property = entity.prop(propertyName);
		if(property == null) {
			throw new ScriptException("No property "+propertyName);
		}

		// check access
		Access accessLevel = entity.getAccessLevel(context.profile());
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
		case EFFECT:
			return property.getEffect();
		case ACCESS:
			return property.getAccessValue();
		default:
			throw new ScriptException("Missing implementation for type "+property.getType());
		}
	}
	
	protected abstract Entity getEntity(Context context) throws ScriptException;
}
