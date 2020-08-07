package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.model.BaseEntity;
import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.TokenFinder;

public class PropertyVariableToken extends PropertyVariable {
	private final TokenFinder tokenFinder;
	
	public PropertyVariableToken(String fullName, String propertyName, TokenFinder tokenFinder) {
		super(fullName, propertyName);
		
		this.tokenFinder = tokenFinder;
	}

	@Override
	protected BaseEntity getEntity(Context context) throws ScriptException {
		return tokenFinder.findToken(context);
	}
}
