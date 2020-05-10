package me.andre111.d20server.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import me.andre111.d20common.message.game.chat.ChatEntries;
import me.andre111.d20common.model.entity.ChatData;
import me.andre111.d20common.model.entity.ChatEntry;
import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20server.command.Command;
import me.andre111.d20server.model.EntityManager;

public abstract class ChatService {
	public static final String STYLE_SENDER = "[style \"font=Arial-BOLD-14\"]";
	public static final String STYLE_SENDER_ITALIC = "[style \"font=Arial-ITALIC-14\"]";
	public static final String STYLE_INFO = "[style \"font=Arial-ITALIC-12\"]";

	public static final long SYSTEM_SOURCE = 0;
	
	private static final java.util.Map<Long, ChatData> loadedChats = new HashMap<>();
	
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
				return;
			}
		} else if(message.startsWith("!")) {
			// extract macro name
			String macroName = message.substring(1);
			
			// find token and check access
			Token token = PlayerService.getSelectedToken(game.getPlayerMap(player, EntityManager.MAP::find), player, true);
			if(token == null) {
				appendError(game, player, "No (single) token selected");
				return;
			}
			Access accessLevel = token.getAccessLevel(player);
			if(!token.canUseMacro(accessLevel)) {
				appendError(game, player, "No access to macros on this token");
				return;
			}
			
			// find macro
			String macro = token.getMacro(macroName);
			if(macro == null) {
				appendError(game, player, "Could not find macro: "+macroName);
				return;
			}
			
			// execute macro
			String[] macroLines = macro.split("\n");
			for(String macroLine : macroLines) {
				ChatService.onMessage(game, player, macroLine);
			}
		} else {
			// handle simple message
			StringBuilder sb = new StringBuilder();
			sb.append(STYLE_SENDER);
			sb.append(player.getNickname());
			sb.append(": \n");
			sb.append(message);
			
			append(game, true, new ChatEntry(sb.toString(), player.getProfileID()));
		}
	}
	
	public static void appendError(Game game, GamePlayer player, String... lines) {
		StringBuilder sb = new StringBuilder();
		for(String line : lines) {
			sb.append(STYLE_INFO);
			sb.append(line);
			sb.append("\n");
		}
		
		append(game, false, new ChatEntry(sb.toString(), SYSTEM_SOURCE, false, player.getProfileID()));
	}
	
	public static void append(Game game, boolean store, ChatEntry... entries) {
		// store chat entries on server side
		if(store) {
			ChatData chatData = getChatData(game);
			for(ChatEntry entry : entries) {
				chatData.append(entry);
			}
			EntityManager.CHAT.save(chatData);
		}
		
		// send chat entries to client
		sendToClients(game, true, entries);
	}
	
	public static void sendHistory(Game game, GamePlayer player, int amount) {
		List<ChatEntry> playerEntries = new ArrayList<>();
		
		// determine all relevant entries
		ChatData chatData = getChatData(game);
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
	
	private static ChatData getChatData(Game game) {
		if(!loadedChats.containsKey(game.id())) {
			ChatData chatData = EntityManager.CHAT.find(game.id());
			if(chatData == null) {
				chatData = new ChatData(game);
			}
			
			loadedChats.put(game.id(), chatData);
		}
		
		return loadedChats.get(game.id());
	}
}
