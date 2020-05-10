package me.andre111.d20server.command;

import me.andre111.d20common.model.entity.ChatEntry;
import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20server.service.ChatService;

public class WhisperCommand extends Command {

	public WhisperCommand(String name, String[] aliases) {
		super(name, aliases);
	}

	@Override
	public void execute(Game game, GamePlayer player, String arguments) {
		String[] split = arguments.split(" ", 2);
		if(split.length != 2) {
			ChatService.appendError(game, player, "Usage: /whisper <name> <message>");
			return;
		}
		
		String name = split[0].toLowerCase();
		String message = split[1];
		
		// find receiver
		GamePlayer reciever = null;
		for(GamePlayer gamePlayer : game.getPlayers()) {
			if(name.equals(gamePlayer.getNickname().toLowerCase())) {
				reciever = gamePlayer;
			}
		}
		if(reciever == null) {
			ChatService.appendError(game, player, "Unknown player: "+name);
			return;
		}
		
		// build message
		StringBuilder sb = new StringBuilder();
		sb.append(ChatService.STYLE_SENDER_ITALIC);
		sb.append(player.getNickname());
		sb.append(" to ");
		sb.append(reciever.getNickname());
		sb.append(": \n");
		sb.append(message);
		
		// determine recipents
		long[] recipents = new long[] { player.getProfileID(), reciever.getProfileID() };
		
		// append message
		ChatService.append(game, true, new ChatEntry(sb.toString(), player.getProfileID(), false, recipents));
	}

}
