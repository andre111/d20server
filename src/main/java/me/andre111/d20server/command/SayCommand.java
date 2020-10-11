package me.andre111.d20server.command;

import me.andre111.d20common.model.chat.ChatEntry;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.scripting.Context;
import me.andre111.d20common.scripting.ScriptException;
import me.andre111.d20common.scripting.variable.Variable;
import me.andre111.d20common.scripting.variable.parser.VariableParser;
import me.andre111.d20server.service.ChatService;

public class SayCommand extends Command {
	public SayCommand(String name, String[] aliases) {
		super(name, aliases);
	}

	@Override
	public void execute(Profile profile, String arguments) {
		try {
			Variable variable = VariableParser.parseVariable("selected.property.name");
			Object name = variable.get(new Context(profile, profile.getMap(), null));
			
			StringBuilder sb = new StringBuilder();
			sb.append(ChatService.STYLE_SENDER);
			sb.append(name);
			sb.append(ChatService.STYLE_SENDER_TINY);
			sb.append(" (");
			sb.append(profile.getName());
			sb.append(")");
			sb.append(ChatService.STYLE_SENDER);
			sb.append(": \n");
			sb.append(arguments);
			
			ChatService.append(true, new ChatEntry(sb.toString(), profile.id()));
		} catch (ScriptException e) {
			ChatService.appendError(profile, "Could not send message:", e.getMessage());
		}
	}
}
