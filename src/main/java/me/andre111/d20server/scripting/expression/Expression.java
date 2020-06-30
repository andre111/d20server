package me.andre111.d20server.scripting.expression;

import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;

@FunctionalInterface
public interface Expression {
	public Result eval(Context context) throws ScriptException;
}
