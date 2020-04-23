package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;

public abstract class TokenFinder {
	public abstract Token findToken(Game game, Map map, GamePlayer player) throws ScriptException;
}
