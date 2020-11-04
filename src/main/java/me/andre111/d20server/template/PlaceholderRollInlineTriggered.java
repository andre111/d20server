package me.andre111.d20server.template;

import java.util.List;

import me.andre111.d20common.model.chat.ChatEntry;
import me.andre111.d20common.model.chat.ChatEntry.TriggeredContent;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.scripting.Context;
import me.andre111.d20common.scripting.ScriptException;
import me.andre111.d20common.scripting.expression.DiceRoll;
import me.andre111.d20common.scripting.expression.Expression;
import me.andre111.d20common.scripting.expression.Parser;
import me.andre111.d20common.scripting.expression.Result;
import me.andre111.d20server.util.RollFormatter;

public class PlaceholderRollInlineTriggered extends Placeholder {
	private final Parser parser = new Parser();

	@Override
	public String parse(Profile profile, String input, List<DiceRoll> diceRolls, List<TriggeredContent> triggeredContent) throws ScriptException {
		// parse roll and execute
		Result result = null;
		Exception exception = null;
		try {
			Expression expr = parser.parse(input);
			result = expr.eval(new Context(profile, profile.getMap(), null));
		} catch(Exception e) {
			exception = e;
		}
		
		// store as triggered roll
		ChatEntry entry = new ChatEntry(RollFormatter.formatInlineDiceRoll(input, result, exception != null ? exception.getMessage() : null), 0);
		if(result != null) { entry.setRolls(result.getDiceRolls()); /*System.out.println(result.getValue());*/ }
		TriggeredContent triggered = new TriggeredContent(entry);
		triggeredContent.add(triggered);
		
		// build replaceable button
		StringBuilder sb = new StringBuilder();
		sb.append("<span id=\""+triggered.getID()+"\" class=\"chat-dice-inline chat-button replaceable\">");
		sb.append("Roll");
		sb.append("</span>");
		return sb.toString();
	}
}
