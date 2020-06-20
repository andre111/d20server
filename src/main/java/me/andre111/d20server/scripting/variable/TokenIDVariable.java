package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.TokenFinder;

public class TokenIDVariable extends Variable {
	private final TokenFinder tokenFinder;
	
	public TokenIDVariable(String fullName, TokenFinder tokenFinder) {
		super(fullName);
		
		this.tokenFinder = tokenFinder;
	}

	@Override
	public void set(Map map, Profile profile, Object value) throws ScriptException {
		throw new ScriptException("Token id is read only!");
	}

	@Override
	public Object get(Map map, Profile profile) throws ScriptException {
		return tokenFinder.findToken(map, profile).id();
	}
}
