package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.scripting.ScriptException;

public class MapPropertyVariable extends PropertyVariable {
	public MapPropertyVariable(String fullName, String propertyName) {
		super(fullName, propertyName);
	}

	@Override
	protected Property getProperty(Game game, Map map, GamePlayer player) throws ScriptException {
		// get property
		Property property = map.getProperty(propertyName);
		if(property == null) {
			throw new ScriptException("Map has no property "+propertyName);
		}
		return property;
	}

	@Override
	protected Access getAccessLevel(Game game, Map map, GamePlayer player) throws ScriptException {
		return map.getAccessLevel(player);
	}

	@Override
	protected void saveSourceAfterSet(Game game, Map map, GamePlayer player) {
		EntityManager.MAP.save(map);
	}
}
