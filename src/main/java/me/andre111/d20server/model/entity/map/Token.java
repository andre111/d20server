package me.andre111.d20server.model.entity.map;

import java.util.Collections;
import java.util.HashMap;

import me.andre111.d20server.model.SubEntity;
import me.andre111.d20server.model.entity.game.GamePlayer;
import me.andre111.d20server.model.entity.map.property.Access;
import me.andre111.d20server.model.entity.map.property.Property;
import me.andre111.d20server.model.entity.map.property.Type;
import me.andre111.d20server.util.PostLoad;

public class Token extends SubEntity implements PostLoad {
private java.util.Map<String, Property> properties = new HashMap<>();
	
	public Token() {
		addDefaultProperties();
	}

	@Override
	public void postLoad() {
		addDefaultProperties();
	}
	
	private void addDefaultProperties() {
		if(properties == null) {
			properties = new HashMap<>();
		}
		
		addPropertyIfAbsent("imageID", new Property(Type.LONG, Access.GM, Access.EVERYONE, 0));
		addPropertyIfAbsent("controllingPlayer", new Property(Type.PLAYER, Access.GM, Access.GM, 0));
		addPropertyIfAbsent("mainToken", new Property(Type.BOOLEAN, Access.GM, Access.GM, true));
		addPropertyIfAbsent("alwaysSelectable", new Property(Type.BOOLEAN, Access.GM, Access.GM, false));
		addPropertyIfAbsent("name", new Property(Type.STRING, Access.CONTROLLING_PLAYER, Access.CONTROLLING_PLAYER, ""));
		addPropertyIfAbsent("displayNameplate", new Property(Type.BOOLEAN, Access.GM, Access.GM, true));
		
		addPropertyIfAbsent("x", new Property(Type.LONG, Access.CONTROLLING_PLAYER, Access.EVERYONE, 0));
		addPropertyIfAbsent("y", new Property(Type.LONG, Access.CONTROLLING_PLAYER, Access.EVERYONE, 0));
		addPropertyIfAbsent("width", new Property(Type.LONG, Access.GM, Access.EVERYONE, 70));
		addPropertyIfAbsent("height", new Property(Type.LONG, Access.GM, Access.EVERYONE, 70));
		addPropertyIfAbsent("rotation", new Property(Type.DOUBLE, Access.CONTROLLING_PLAYER, Access.EVERYONE, 0));
		addPropertyIfAbsent("layer", new Property(Type.LAYER, Access.GM, Access.EVERYONE, Layer.MAIN.toString()));

		addPropertyIfAbsent("sightBright", new Property(Type.DOUBLE, Access.GM, Access.CONTROLLING_PLAYER, Double.MAX_VALUE));
		addPropertyIfAbsent("sightDim", new Property(Type.DOUBLE, Access.GM, Access.CONTROLLING_PLAYER, 0));
		addPropertyIfAbsent("sightDark", new Property(Type.DOUBLE, Access.GM, Access.CONTROLLING_PLAYER, 0));
		addPropertyIfAbsent("lightBright", new Property(Type.DOUBLE, Access.GM, Access.CONTROLLING_PLAYER, 0));
		addPropertyIfAbsent("lightDim", new Property(Type.DOUBLE, Access.GM, Access.CONTROLLING_PLAYER, 0));
		
		addPropertyIfAbsent("healthCurrent", new Property(Type.LONG, Access.CONTROLLING_PLAYER, Access.CONTROLLING_PLAYER, 0));
		addPropertyIfAbsent("healthMax", new Property(Type.LONG, Access.CONTROLLING_PLAYER, Access.CONTROLLING_PLAYER, 0));

		addPropertyIfAbsent("gmNotes", new Property(Type.STRING, Access.GM, Access.GM, ""));
	}
	private void addPropertyIfAbsent(String name, Property property) {
		if(!properties.containsKey(name)) {
			properties.put(name, property);
		}
	}
	
	public void applyProperties(java.util.Map<String, Property> toApply, Access accessLevel) {
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
	
	public Property getProperty(String name) {
		return properties.get(name);
	}
	
	public java.util.Map<String, Property> getProperties() {
		return Collections.unmodifiableMap(properties);
	}

	public Access getAccesLevel(GamePlayer player) {
		Access accessLevel = Access.EVERYONE;
		if(getProperty("controllingPlayer").getPlayerID() == player.getProfileID()) {
			accessLevel = Access.CONTROLLING_PLAYER;
		}
		if(player.getRole() == GamePlayer.Role.GM) {
			accessLevel = Access.GM;
		}
		return accessLevel;
	}
}
