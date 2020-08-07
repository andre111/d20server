package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.map.Token;

public class TokenFinderID extends TokenFinder {
	private final long tokenID;
	
	public TokenFinderID(long tokenID) {
		this.tokenID = tokenID;
	}
	
	@Override
	public Token findToken(Context context) throws ScriptException {
		Token token = context.map().getToken(tokenID);
		if(token == null) {
			throw new ScriptException("Token with id "+tokenID+" not found");
		}
		return token;
	}
}
