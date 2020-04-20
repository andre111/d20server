package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.message.game.UpdateToken;
import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.service.MessageService;
import me.andre111.d20server.service.PlayerService;

public class SelectedTokenPropertyVariable extends PropertyVariable {
	public SelectedTokenPropertyVariable(String fullName, String propertyName) {
		super(fullName, propertyName);
	}

	@Override
	protected Property getProperty(Game game, Map map, GamePlayer player) throws ScriptException {
		// get property
		Property property = getToken(map, player).getProperty(propertyName);
		if(property == null) {
			throw new ScriptException("Token has no property "+propertyName);
		}
		return property;
	}

	@Override
	protected Access getAccessLevel(Game game, Map map, GamePlayer player) throws ScriptException {
		return getToken(map, player).getAccessLevel(player);
	}

	@Override
	protected void saveSourceAfterSet(Game game, Map map, GamePlayer player) throws ScriptException {
		EntityManager.MAP.save(map);
		MessageService.send(new UpdateToken(getToken(map, player)), game, map);
	}
	
	private Token getToken(Map map, GamePlayer player) throws ScriptException {
		Token token = PlayerService.getSelectedToken(map, player, true);
		if(token == null) {
			throw new ScriptException("No (single) token selected");
		}
		return token;
	}
}
