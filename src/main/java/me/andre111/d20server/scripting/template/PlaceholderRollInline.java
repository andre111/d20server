package me.andre111.d20server.scripting.template;

import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.expression.Expression;
import me.andre111.d20server.scripting.expression.Parser;
import me.andre111.d20server.scripting.expression.Result;
import me.andre111.d20server.service.GameService;
import me.andre111.d20server.util.RollFormatter;

public class PlaceholderRollInline extends Placeholder {
	private final Parser parser = new Parser();

	@Override
	public String parse(Profile profile, String input) throws ScriptException {
		// parse roll and execute
		Result result = null;
		Exception exception = null;
		try {
			Expression expr = parser.parse(input);
			result = expr.eval(GameService.getPlayerMap(profile), profile);
		} catch(Exception e) {
			exception = e;
		}
		
		return RollFormatter.formatInlineDiceRoll(input, result, exception);
	}
}
