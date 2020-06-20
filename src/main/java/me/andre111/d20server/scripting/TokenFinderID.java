package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.entity.profile.Profile;

public class TokenFinderID extends TokenFinder {
	private final long tokenID;
	
	public TokenFinderID(long tokenID) {
		this.tokenID = tokenID;
	}
	
	@Override
	public Token findToken(Map map, Profile profile) throws ScriptException {
		Token token = map.getToken(tokenID);
		if(token == null) {
			throw new ScriptException("Token with id "+tokenID+" not found");
		}
		return token;
	}
}
