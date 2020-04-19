package me.andre111.d20server.service;

import java.util.ArrayList;
import java.util.List;

import me.andre111.d20server.command.Command;
import me.andre111.d20server.message.game.chat.ChatEntries;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.model.entity.ChatData;
import me.andre111.d20server.model.entity.ChatEntry;
import me.andre111.d20server.model.entity.game.Game;
import me.andre111.d20server.model.entity.game.GamePlayer;

public abstract class ChatService {
	public static final String STYLE_SENDER = "[style \"font=Arial-BOLD-14\"]";
	public static final String STYLE_INFO = "[style \"font=Arial-ITALIC-12\"]";

	public static final long SYSTEM_SOURCE = 0;
	
	public static void onMessage(Game game, GamePlayer player, String message) {
		// strip formatting stuff
		message = message.replace("[", "");
		message = message.replace("]", "");
		message = message.replace("|", "");
		
		if(message.startsWith("/")) {
			// extract command name and arguments
			int endIndex = message.indexOf(' ');
			if(endIndex == -1) endIndex = message.length();
			String commandName = message.substring(1, endIndex);
			String arguments = message.substring(Math.min(endIndex+1, message.length()));
			
			Command command = Command.get(commandName);
			if(command != null) {
				// handle command
				command.execute(game, player, arguments);
			} else {
				appendError(game, player, "Unknown command: "+commandName);
			}
		} else {
			// handle simple message
			StringBuilder sb = new StringBuilder();
			sb.append(STYLE_SENDER);
			sb.append(player.getNickname());
			sb.append(": \n");
			sb.append(message);
			
			append(game, new ChatEntry(sb.toString(), player.getProfileID()));
		}
	}
	
	public static void appendError(Game game, GamePlayer player, String... lines) {
		StringBuilder sb = new StringBuilder();
		for(String line : lines) {
			sb.append(STYLE_INFO);
			sb.append(line);
			sb.append("\n");
		}
		
		append(game, new ChatEntry(sb.toString(), SYSTEM_SOURCE, false, player.getProfileID()));
	}
	
	public static void append(Game game, ChatEntry... entries) {
		// store chat entries on server side
		ChatData chatData = game.getChatData();
		for(ChatEntry entry : entries) {
			chatData.append(entry);
		}
		chatData.save();
		
		// send chat entries to client
		sendToClients(game, true, entries);
	}
	
	public static void sendHistory(Game game, GamePlayer player, int amount) {
		List<ChatEntry> playerEntries = new ArrayList<>();
		
		// determine all relevant entries
		ChatData chatData = game.getChatData();
		int start = Math.max(0, chatData.getEntries().size() - amount);
		for(int i=start; i<chatData.getEntries().size(); i++) {
			ChatEntry entry = chatData.getEntries().get(i);
			if(canRecieve(player, entry)) {
				playerEntries.add(entry);
			}
		}
		
		// send message
		MessageService.send(new ChatEntries(playerEntries, false), EntityManager.PROFILE.find(player.getProfileID()));
	}
	
	public static void sendToClients(Game game, boolean append, ChatEntry... entries) {
		List<ChatEntry> playerEntries = new ArrayList<>();
		for(GamePlayer player : game.getPlayers()) {
			if(player.isJoined()) {
				// determine all relevant entries
				playerEntries.clear();
				for(ChatEntry entry : entries) {
					if(canRecieve(player, entry)) {
						playerEntries.add(entry);
					}
				}
				
				// send message
				MessageService.send(new ChatEntries(playerEntries, append), EntityManager.PROFILE.find(player.getProfileID()));
			}
		}
	}
	
	private static boolean canRecieve(GamePlayer player, ChatEntry entry) {
		if(entry.getRecipents() == null || entry.getRecipents().length == 0) return true;
		if(entry.doIncludeGMs() && player.getRole() == GamePlayer.Role.GM) return true;
		
		for(long recipent : entry.getRecipents()) {
			if(recipent == player.getProfileID()) {
				return true;
			}
		}
		
		return false;
	}
}
