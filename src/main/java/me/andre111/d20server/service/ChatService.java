package me.andre111.d20server.service;

import java.util.ArrayList;
import java.util.List;

import me.andre111.d20common.message.game.chat.ChatEntries;
import me.andre111.d20common.model.entity.ChatData;
import me.andre111.d20common.model.entity.ChatEntry;
import me.andre111.d20common.model.entity.actor.Actor;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20server.command.Command;
import me.andre111.d20server.model.EntityManager;

public abstract class ChatService {
	public static final String STYLE_SENDER = "[style \"font=Arial-BOLD-14\"]";
	public static final String STYLE_SENDER_ITALIC = "[style \"font=Arial-ITALIC-14\"]";
	public static final String STYLE_INFO = "[style \"font=Arial-ITALIC-12\"]";

	public static final long SYSTEM_SOURCE = 0;
	
	private static ChatData loadedChat = null;
	
	public static void onMessage(Profile profile, String message) {
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
				command.execute(profile, arguments);
			} else {
				appendError(profile, "Unknown command: "+commandName);
				return;
			}
		} else if(message.startsWith("!")) {
			// extract macro name
			String macroName = message.substring(1);
			
			// find token and check access
			Token token = GameService.getSelectedToken(GameService.getPlayerMap(profile), profile, true);
			if(token == null) {
				appendError(profile, "No (single) token selected");
				return;
			}
			Access accessLevel = token.getAccessLevel(profile);
			if(!token.canUseMacro(accessLevel)) {
				appendError(profile, "No access to macros on this token");
				return;
			}
			
			// find macro (!<name> -> custom in token, !!<name> -> premade in actor)
			String macro = null;
			if(macroName.startsWith("!")) {
				Actor actor = EntityManager.ACTOR.find(token.getActorID());
				if(actor != null) {
					macro = actor.getType().getMacroCommands(macroName.substring(1));
				}
			} else {
				macro = token.getMacro(macroName);
			}
			if(macro == null) {
				appendError(profile, "Could not find macro: "+macroName);
				return;
			}
			
			// execute macro
			String[] macroLines = macro.split("\n");
			for(String macroLine : macroLines) {
				ChatService.onMessage(profile, macroLine);
			}
		} else {
			// handle simple message
			StringBuilder sb = new StringBuilder();
			sb.append(STYLE_SENDER);
			sb.append(profile.getName());
			sb.append(": \n");
			sb.append(message);
			
			append(true, new ChatEntry(sb.toString(), profile.id()));
		}
	}
	
	public static void appendError(Profile profile, String... lines) {
		StringBuilder sb = new StringBuilder();
		for(String line : lines) {
			sb.append(STYLE_INFO);
			sb.append(line);
			sb.append("\n");
		}
		
		append(false, new ChatEntry(sb.toString(), SYSTEM_SOURCE, false, profile.id()));
	}
	
	public static void appendNote(String... lines) {
		StringBuilder sb = new StringBuilder();
		for(String line : lines) {
			sb.append(STYLE_INFO);
			sb.append(line);
			sb.append("\n");
		}
		
		append(false, new ChatEntry(sb.toString(), SYSTEM_SOURCE, true));
	}
	
	public static void append(boolean store, ChatEntry... entries) {
		// store chat entries on server side
		if(store) {
			ChatData chatData = getChatData();
			for(ChatEntry entry : entries) {
				chatData.append(entry);
			}
			EntityManager.CHAT.save(chatData);
		}
		
		// send chat entries to client
		sendToClients(true, entries);
	}
	
	public static void sendHistory(Profile profile, int amount) {
		List<ChatEntry> playerEntries = new ArrayList<>();
		
		// determine all relevant entries
		ChatData chatData = getChatData();
		int start = Math.max(0, chatData.getEntries().size() - amount);
		for(int i=start; i<chatData.getEntries().size(); i++) {
			ChatEntry entry = chatData.getEntries().get(i);
			if(canRecieve(profile, entry)) {
				playerEntries.add(entry);
			}
		}
		
		// send message
		MessageService.send(new ChatEntries(playerEntries, false), profile);
	}
	
	public static void sendToClients(boolean append, ChatEntry... entries) {
		List<ChatEntry> playerEntries = new ArrayList<>();
		for(Profile profile : UserService.getAllConnectedProfiles()) {
			// determine all relevant entries
			playerEntries.clear();
			for(ChatEntry entry : entries) {
				if(canRecieve(profile, entry)) {
					playerEntries.add(entry);
				}
			}
			
			// send message
			MessageService.send(new ChatEntries(playerEntries, append), profile);
		}
	}
	
	private static boolean canRecieve(Profile profile, ChatEntry entry) {
		if(entry.getRecipents() == null || entry.getRecipents().length == 0) return true;
		if(entry.doIncludeGMs() && profile.getRole() == Profile.Role.GM) return true;
		
		for(long recipent : entry.getRecipents()) {
			if(recipent == profile.id()) {
				return true;
			}
		}
		
		return false;
	}
	
	private static ChatData getChatData() {
		if(loadedChat == null) {
			ChatData chatData = EntityManager.CHAT.find(1);
			if(chatData == null) {
				chatData = new ChatData(1);
			}
			loadedChat = chatData;
		}
		
		return loadedChat;
	}
}
