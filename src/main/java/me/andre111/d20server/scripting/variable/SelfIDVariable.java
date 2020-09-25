package me.andre111.d20server.scripting.variable;

import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.TokenFinder;

public class SelfIDVariable extends Variable {
	public SelfIDVariable(String fullName, TokenFinder tokenFinder) {
		super(fullName);
	}

	@Override
	public void set(Context context, Object value) throws ScriptException {
		throw new ScriptException("Entity id is read only!");
	}

	@Override
	public Object get(Context context) throws ScriptException {
		return context.self().id();
	}
}
