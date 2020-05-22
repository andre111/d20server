package me.andre111.d20server.scripting.variable.parser;

import me.andre111.d20server.scripting.TokenFinder;
import me.andre111.d20server.scripting.TokenFinderID;

public class VariableParserTokenParentID extends VariableParserTokenParent {

	@Override
	protected String getChildParserName(String name) {
		String[] split = name.split("\\.", 3);
		return split.length>1 ? split[1] : "";
	}

	@Override
	protected String getChildString(String name) {
		String[] split = name.split("\\.", 3);
		return split.length==3 ? split[2] : "";
	}

	@Override
	protected TokenFinder getTokenFinder(String name) {
		String[] split = name.split("\\.", 3);
		long tokenID = -1;
		try {
			tokenID = Long.parseLong(split[0]);
		} catch(NumberFormatException e) {
		}
		return new TokenFinderID(tokenID);
	}
}
