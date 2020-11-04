package me.andre111.d20server.command;

import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.scripting.ScriptException;
import me.andre111.d20server.service.ChatService;

public class TriggerCommand extends Command {
	public TriggerCommand(String name, String[] aliases) {
		super(name, aliases);
	}

	@Override
	public void execute(Profile profile, String arguments) {
		try {
			String[] split = arguments.split(" ");
			if(split.length != 2) throw new ScriptException("Wrong argument count: <messageid> <contentid>");
			
			long messageID = Long.parseLong(split[0]);
			long contentID = Long.parseLong(split[1]);
			
			ChatService.triggerContent(profile, messageID, contentID);
		} catch (ScriptException | NumberFormatException e) {
			ChatService.appendError(profile, "Could execute trigger:", e.getMessage());
		}
	}
}
