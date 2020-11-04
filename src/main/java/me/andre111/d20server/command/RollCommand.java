package me.andre111.d20server.command;

import me.andre111.d20common.model.chat.ChatEntry;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.scripting.Context;
import me.andre111.d20common.scripting.expression.Expression;
import me.andre111.d20common.scripting.expression.Parser;
import me.andre111.d20common.scripting.expression.Result;
import me.andre111.d20server.service.ChatService;
import me.andre111.d20server.util.RollFormatter;

public class RollCommand extends Command {
	private final boolean showPublic;
	private final boolean showSelf;
	private final boolean showGM;
	
	private final Parser parser;
	
	public RollCommand(String name, String[] aliases, boolean showPublic, boolean showSelf, boolean showGM) {
		super(name, aliases);
		
		this.showPublic = showPublic;
		this.showSelf = showSelf;
		this.showGM = showGM;
		
		this.parser = new Parser();
	}

	
	@Override
	public void execute(Profile profile, String arguments) {
		// parse roll and execute
		Result result = null;
		Exception exception = null;
		try {
			Expression expr = parser.parse(arguments);
			result = expr.eval(new Context(profile, profile.getMap(), null));
		} catch(Exception e) {
			exception = e;
		}
		
		String rollMessage = RollFormatter.formatDiceRoll(profile, arguments, showPublic, result, exception);
		
		// determine recipents
		long[] recipents = buildRecipents(profile, showPublic, showSelf);
		
		// create entry
		ChatEntry entry = new ChatEntry(rollMessage, profile.id(), showGM, recipents);
		if(result != null) entry.setRolls(result.getDiceRolls());
		
		// append message
		ChatService.append(true, entry);
	}
}
