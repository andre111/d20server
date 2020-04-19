package me.andre111.d20server.model.entity.map;

import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Layer;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20common.model.property.Type;
import me.andre111.d20server.model.entity.game.GamePlayer;
import me.andre111.d20server.model.property.PropertyHolder;

public class Token extends PropertyHolder {
	@Override
	protected void addDefaultProperties() {
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
	
	@Override
	public Access getAccessLevel(GamePlayer player) {
		Access accessLevel = Access.EVERYONE;
		if(getProperty("controllingPlayer").getPlayerID() == player.getProfileID()) {
			accessLevel = Access.CONTROLLING_PLAYER;
		}
		if(player.getRole() == GamePlayer.Role.GM) {
			accessLevel = Access.GM;
		}
		return accessLevel;
	}

	@Override
	public void save() { 
		// Not saved on its own -> map saves the token
		throw new UnsupportedOperationException("This entity cann't be saved on its own!");
	}
}
