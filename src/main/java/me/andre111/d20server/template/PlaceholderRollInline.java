package me.andre111.d20server.template;

import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.scripting.Context;
import me.andre111.d20common.scripting.ScriptException;
import me.andre111.d20common.scripting.expression.Expression;
import me.andre111.d20common.scripting.expression.Parser;
import me.andre111.d20common.scripting.expression.Result;
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
			result = expr.eval(new Context(profile, profile.getMap(), null));
		} catch(Exception e) {
			exception = e;
		}
		
		return RollFormatter.formatInlineDiceRoll(input, result, exception);
	}
}
