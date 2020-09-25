package me.andre111.d20server.command;

import me.andre111.d20common.model.entity.ChatEntry;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.variable.Variable;
import me.andre111.d20server.scripting.variable.parser.VariableParser;
import me.andre111.d20server.service.ChatService;
import me.andre111.d20server.service.GameService;

public class GetCommand extends Command {
	public GetCommand(String name, String[] aliases) {
		super(name, aliases);
	}

	@Override
	public void execute(Profile profile, String arguments) {
		try {
			Variable variable = VariableParser.parseVariable(arguments);
			Object value = variable.get(new Context(profile, GameService.getPlayerMap(profile), null));
			
			StringBuilder sb = new StringBuilder();
			sb.append(ChatService.STYLE_INFO);
			sb.append(arguments);
			sb.append(" = ");
			sb.append(value);
			
			ChatService.append(false, new ChatEntry(sb.toString(), ChatService.SYSTEM_SOURCE, false, profile.id()));
		} catch (ScriptException e) {
			ChatService.appendError(profile, "Could not get "+arguments+":", e.getMessage());
		}
	}
}
