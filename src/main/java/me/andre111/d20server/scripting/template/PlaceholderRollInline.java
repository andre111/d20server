package me.andre111.d20server.scripting.template;

import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.expression.Expression;
import me.andre111.d20server.scripting.expression.Parser;
import me.andre111.d20server.scripting.expression.Result;
import me.andre111.d20server.util.RollFormatter;

public class PlaceholderRollInline extends Placeholder {
	private final Parser parser = new Parser();

	@Override
	public String parse(Game game, GamePlayer player, String input) throws ScriptException {
		// parse roll and execute
		Result result = null;
		Exception exception = null;
		try {
			Expression expr = parser.parse(input);
			result = expr.eval(game, game.getPlayerMap(player, EntityManager.MAP::find), player);
		} catch(Exception e) {
			exception = e;
		}
		
		return RollFormatter.formatInlineDiceRoll(player, input, result, exception);
	}
}
