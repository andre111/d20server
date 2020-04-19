package me.andre111.d20server.scripting.expression;

import me.andre111.d20server.model.entity.game.Game;
import me.andre111.d20server.model.entity.game.GamePlayer;
import me.andre111.d20server.model.entity.map.Map;
import me.andre111.d20server.scripting.ScriptException;

@FunctionalInterface
public interface Expression {
	public Result eval(Game game, Map map, GamePlayer player) throws ScriptException;
}
