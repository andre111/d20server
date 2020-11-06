package me.andre111.d20server.command;

import me.andre111.d20common.model.chat.ChatEntry;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20server.service.ChatService;
import me.andre111.d20server.service.UserService;

public class WhisperCommand extends Command {

	public WhisperCommand(String name, String[] aliases) {
		super(name, aliases);
	}

	@Override
	public void execute(Profile profile, String arguments) {
		String[] split = arguments.split(" ", 2);
		if(split.length != 2) {
			ChatService.appendError(profile, "Usage: /whisper <name> <message>");
			return;
		}
		
		String name = split[0].toLowerCase();
		String message = split[1];
		
		// find receiver
		Profile reciever = null;
		for(Profile other : UserService.getAllProfiles()) {
			if(name.equals(other.getName().toLowerCase())) {
				reciever = other;
			}
		}
		if(reciever == null) {
			ChatService.appendError(profile, "Unknown player: "+split[0]);
			return;
		}
		
		// build message
		StringBuilder sb = new StringBuilder();
		sb.append("<p class=\"chat-sender chat-sender-special\">");
		sb.append(ChatService.escape(profile.getName()));
		sb.append(" to ");
		sb.append(ChatService.escape(reciever.getName()));
		sb.append(": ");
		sb.append("</p>");
		sb.append("<p class=\"chat-message\">");
		sb.append(ChatService.escape(message));
		sb.append("</p>");
		
		// determine recipents
		long[] recipents = new long[] { profile.id(), reciever.id() };
		
		// append message
		ChatService.append(true, new ChatEntry(sb.toString(), profile.id(), false, recipents));
	}

}
