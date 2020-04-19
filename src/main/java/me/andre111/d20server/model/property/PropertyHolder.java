package me.andre111.d20server.model.property;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20common.util.PostLoad;
import me.andre111.d20server.model.BaseEntity;
import me.andre111.d20server.model.entity.game.GamePlayer;

public abstract class PropertyHolder extends BaseEntity implements PostLoad {
	private Map<String, Property> properties = new HashMap<>();

	public PropertyHolder() {
		addDefaultProperties();
	}
	
	@Override
	public void postLoad() {
		if(properties == null) {
			properties = new HashMap<>();
		}
		
		addDefaultProperties();
	}
	
	public final void addPropertyIfAbsent(String name, Property property) {
		if(!properties.containsKey(name)) {
			properties.put(name, property);
		}
	}
	
	public final void applyProperties(java.util.Map<String, Property> toApply, Access accessLevel) {
		for(java.util.Map.Entry<String, Property> e : toApply.entrySet()) {
			Property ownProperty = properties.get(e.getKey());
			if(ownProperty == null) continue; //TODO: how to handle unknown properties?
			if(ownProperty.getEditAccess().ordinal() > accessLevel.ordinal()) continue; // discard unallowed edits
			
			// transfer value
			try {
				e.getValue().transferTo(ownProperty);
			} catch(UnsupportedOperationException ex) {
				ex.printStackTrace(); //TODO: how to handle incorrect property updates
			}
			
			// transfer access (GM only)
			if(accessLevel == Access.GM) {
				ownProperty.setEditAccess(e.getValue().getEditAccess());
				ownProperty.setViewAccess(e.getValue().getViewAccess());
			}
		}
	}
	
	public final void clonePropertiesFrom(PropertyHolder propertyHolder) {
		properties.clear();
		for(Map.Entry<String, Property> e : propertyHolder.properties.entrySet()) {
			properties.put(e.getKey(), e.getValue().clone());
		}
	}
	
	public final Property getProperty(String name) {
		return properties.get(name);
	}
	
	public final Map<String, Property> getProperties() {
		return Collections.unmodifiableMap(properties);
	}
	
	protected abstract void addDefaultProperties();
	public abstract Access getAccessLevel(GamePlayer player);
}
