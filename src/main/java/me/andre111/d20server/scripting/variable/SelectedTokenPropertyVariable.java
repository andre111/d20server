package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.model.entity.game.Game;
import me.andre111.d20server.model.entity.game.GamePlayer;
import me.andre111.d20server.model.entity.map.Map;
import me.andre111.d20server.model.entity.map.Token;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.service.PlayerService;

public class SelectedTokenPropertyVariable extends PropertyVariable {
	public SelectedTokenPropertyVariable(String fullName, String propertyName) {
		super(fullName, propertyName);
	}

	@Override
	protected Property getProperty(Game game, Map map, GamePlayer player) throws ScriptException {
		// get token
		Token token = PlayerService.getSelectedToken(map, player, true);
		if(token == null) {
			throw new ScriptException("No (single) token selected");
		}

		// get property
		Property property = token.getProperty(propertyName);
		if(property == null) {
			throw new ScriptException("Token has no property "+propertyName);
		}
		return property;
	}

	@Override
	protected Access getAccessLevel(Game game, Map map, GamePlayer player) throws ScriptException {
		// get token
		Token token = PlayerService.getSelectedToken(map, player, true);
		if(token == null) {
			throw new ScriptException("No (single) token selected");
		}

		return token.getAccessLevel(player);
	}
}
