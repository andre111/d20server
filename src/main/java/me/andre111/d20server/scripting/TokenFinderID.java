package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;

public class TokenFinderID extends TokenFinder {
	private final long tokenID;
	
	public TokenFinderID(long tokenID) {
		this.tokenID = tokenID;
	}
	
	@Override
	public Token findToken(Game game, Map map, GamePlayer player) throws ScriptException {
		Token token = map.getToken(tokenID);
		if(token == null) {
			throw new ScriptException("Token with id "+tokenID+" not found");
		}
		return token;
	}
}
