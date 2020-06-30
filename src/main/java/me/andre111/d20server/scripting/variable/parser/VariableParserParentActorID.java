package me.andre111.d20server.scripting.variable.parser;

import me.andre111.d20server.scripting.ActorFinderID;
import me.andre111.d20server.scripting.ParserContext;

public class VariableParserParentActorID extends VariableParserParent {
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
	protected void updateContext(ParserContext context, String name) {
		String[] split = name.split("\\.", 3);
		long actorID = -1;
		try {
			actorID = Long.parseLong(split[0]);
		} catch(NumberFormatException e) {
		}
		context.setActorFinder(new ActorFinderID(actorID));
	}
}
