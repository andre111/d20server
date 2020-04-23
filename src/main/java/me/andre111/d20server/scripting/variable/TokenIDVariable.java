package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.TokenFinder;

public class TokenIDVariable extends Variable {
	private final TokenFinder tokenFinder;
	
	public TokenIDVariable(String fullName, TokenFinder tokenFinder) {
		super(fullName);
		
		this.tokenFinder = tokenFinder;
	}

	@Override
	public void set(Game game, Map map, GamePlayer player, Object value) throws ScriptException {
		throw new ScriptException("Token id is read only!");
	}

	@Override
	public Object get(Game game, Map map, GamePlayer player) throws ScriptException {
		return tokenFinder.findToken(game, map, player).id();
	}
}
