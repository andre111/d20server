package me.andre111.d20server.scripting;

import me.andre111.d20common.model.entity.map.Token;

public abstract class TokenFinder {
	public abstract Token findToken(Context context) throws ScriptException;
}
