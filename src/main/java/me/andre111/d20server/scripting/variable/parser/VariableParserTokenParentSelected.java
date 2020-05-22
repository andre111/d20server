package me.andre111.d20server.scripting.variable.parser;

import me.andre111.d20server.scripting.TokenFinder;
import me.andre111.d20server.scripting.TokenFinderSelected;

public class VariableParserTokenParentSelected extends VariableParserTokenParent {
	private static final TokenFinder FINDER = new TokenFinderSelected();
	
	@Override
	protected String getChildParserName(String name) {
		String[] split = name.split("\\.", 2);
		return split[0];
	}

	@Override
	protected String getChildString(String name) {
		String[] split = name.split("\\.", 2);
		return split.length==2 ? split[1] : "";
	}

	@Override
	protected TokenFinder getTokenFinder(String name) {
		return FINDER;
	}

}
