package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20server.service.GameService;

public class TokenFinderSelected extends TokenFinder {
	@Override
	public Token findToken(Context context) throws ScriptException {
		Token token = GameService.getSelectedToken(context.map(), context.profile(), true);
		if(token == null) {
			throw new ScriptException("No (single) token selected");
		}
		return token;
	}
}
