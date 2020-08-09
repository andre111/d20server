package me.andre111.d20server.scripting.variable;

import java.util.List;
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
	@SuppressWarnings("unchecked")
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
			if(value instanceof Boolean b) property.setBoolean(b);
			else throw new ScriptException("Value is not of correct type, needs "+property.getType());
			break;
		case DOUBLE:
			if(value instanceof Double d) property.setDouble(d);
			else throw new ScriptException("Value is not of correct type, needs "+property.getType());
			break;
		case LAYER:
			if(value instanceof Layer l) property.setLayer(l);
			else throw new ScriptException("Value is not of correct type, needs "+property.getType());
			break;
		case LIGHT:
			if(value instanceof Light l) property.setLight(l);
			else throw new ScriptException("Value is not of correct type, needs "+property.getType());
			break;
		case LONG:
			if(value instanceof Long l) property.setLong(l);
			else throw new ScriptException("Value is not of correct type, needs "+property.getType());
			break;
		case LONG_LIST:
			if(value instanceof List<?> l) property.setLongList((List<Long>) l);
			else throw new ScriptException("Value is not of correct type, needs "+property.getType());
			break;
		case STRING:
			property.setString(value.toString());
			break;
		case EFFECT:
			if(value instanceof Effect e) property.setEffect(e);
			else throw new ScriptException("Value is not of correct type, needs "+property.getType());
			break;
		case ACCESS:
			if(value instanceof Access a) property.setAccessValue(a);
			else throw new ScriptException("Value is not of correct type, needs "+property.getType());
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
		case LONG_LIST:
			return property.getLongList();
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
