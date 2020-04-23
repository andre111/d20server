package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20server.service.PlayerService;

public class TokenFinderSelected extends TokenFinder {
	@Override
	public Token findToken(Game game, Map map, GamePlayer player) throws ScriptException {
		Token token = PlayerService.getSelectedToken(map, player, true);
		if(token == null) {
			throw new ScriptException("No (single) token selected");
		}
		return token;
	}
}
