package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.service.GameService;

public class TokenFinderSelected extends TokenFinder {
	@Override
	public Token findToken(Map map, Profile profile) throws ScriptException {
		Token token = GameService.getSelectedToken(map, profile, true);
		if(token == null) {
			throw new ScriptException("No (single) token selected");
		}
		return token;
	}
}
