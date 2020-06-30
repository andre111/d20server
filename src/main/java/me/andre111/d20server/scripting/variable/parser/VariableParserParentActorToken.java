package me.andre111.d20server.scripting.variable.parser;

import me.andre111.d20server.scripting.ActorFinderToken;
import me.andre111.d20server.scripting.ParserContext;

public class VariableParserParentActorToken extends VariableParserParent {
	@Override
	protected void updateContext(ParserContext context, String name) {
		//TODO: check for TokenFinder present!
		context.setActorFinder(new ActorFinderToken(context.getTokenFinder()));
	}
}
