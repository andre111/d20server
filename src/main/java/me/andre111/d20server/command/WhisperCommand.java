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
		for(Profile other : UserService.getAllConnectedProfiles()) {
			if(name.equals(other.getName().toLowerCase())) {
				reciever = other;
			}
		}
		if(reciever == null) {
			ChatService.appendError(profile, "Unknown player: "+name);
			return;
		}
		
		// build message
		StringBuilder sb = new StringBuilder();
		sb.append(ChatService.STYLE_SENDER_ITALIC);
		sb.append(profile.getName());
		sb.append(" to ");
		sb.append(reciever.getName());
		sb.append(": \n");
		sb.append(message);
		
		// determine recipents
		long[] recipents = new long[] { profile.id(), reciever.id() };
		
		// append message
		ChatService.append(true, new ChatEntry(sb.toString(), profile.id(), false, recipents));
	}

}
