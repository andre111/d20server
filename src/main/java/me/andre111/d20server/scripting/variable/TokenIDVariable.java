package me.andre111.d20server.scripting.variable;

import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.TokenFinder;

public class TokenIDVariable extends Variable {
	private final TokenFinder tokenFinder;
	
	public TokenIDVariable(String fullName, TokenFinder tokenFinder) {
		super(fullName);
		
		this.tokenFinder = tokenFinder;
	}

	@Override
	public void set(Context context, Object value) throws ScriptException {
		throw new ScriptException("Token id is read only!");
	}

	@Override
	public Object get(Context context) throws ScriptException {
		return tokenFinder.findToken(context).id();
	}
}
