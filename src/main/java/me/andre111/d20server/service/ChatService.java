package me.andre111.d20server.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import me.andre111.d20common.D20Common;
import me.andre111.d20common.message.game.chat.ChatEntries;
import me.andre111.d20common.model.Entity;
import me.andre111.d20common.model.chat.ChatData;
import me.andre111.d20common.model.chat.ChatEntry;
import me.andre111.d20common.model.chat.ChatEntry.TriggeredContent;
import me.andre111.d20common.model.def.MacroDefinition;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.scripting.ScriptException;
import me.andre111.d20common.util.Utils;
import me.andre111.d20server.command.Command;

public abstract class ChatService {
	public static final long SYSTEM_SOURCE = 0;
	
	private static ChatData loadedChat = null;
	
	public static void onMessage(Profile profile, String message) {
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
			Entity token = profile.getSelectedToken(true);
			if(token == null) {
				appendError(profile, "No (single) token selected");
				return;
			}
			Access accessLevel = token.getAccessLevel(profile);
			if(token.prop("macroUse").getAccessValue().ordinal() > accessLevel.ordinal()) {
				appendError(profile, "No access to macros on this token");
				return;
			}
			
			// find macro (!<name> -> custom in token, !!<name> -> predefined)
			String macro = null;
			if(macroName.startsWith("!")) {
				macroName = macroName.substring(1);
				
				Map<String, MacroDefinition> macros = token.getPredefinedMacros();
				if(macros.containsKey(macroName)) {
					macro = macros.get(macroName).commands().stream().collect(Collectors.joining("\n"));
				}
				
				Entity actor = D20Common.getEntityManager("actor").find(token.prop("actorID").getLong());
				if(actor != null) {
					macros = actor.getPredefinedMacros();
					if(macros.containsKey(macroName)) {
						macro = macros.get(macroName).commands().stream().collect(Collectors.joining("\n"));
					}
				}
			} else {
				Map<String, String> tokenMacros = token.prop("macros").getStringMap();
				macro = tokenMacros.get(macroName);
			}
			if(macro == null) {
				appendError(profile, "Could not find macro: "+macroName);
				return;
			}
			
			// execute macro
			String[] macroLines = macro.split("\n");
			for(String macroLine : macroLines) {
				if(macroLine.isBlank()) continue;
				
				ChatService.onMessage(profile, macroLine);
			}
		} else {
			// handle simple message
			StringBuilder sb = new StringBuilder();
			sb.append("<p class=\"chat-sender\">");
			sb.append(escape(profile.getName())+": ");
			sb.append("</p>");
			sb.append("<p class=\"chat-message\">");
			sb.append(escape(message));
			sb.append("</p>");
			
			append(true, new ChatEntry(sb.toString(), profile.id()));
		}
	}
	
	public static String escape(String string) {
		string = string.replace("<", "&lt;");
		string = string.replace(">", "&gt;");
		return string;
	}
	
	public static void appendError(Profile profile, String... lines) {
		StringBuilder sb = new StringBuilder();
		sb.append("<p class=\"chat-info\">");
		for(String line : lines) {
			sb.append(escape(line)+"<br>");
		}
		sb.append("</p>");
		
		append(false, new ChatEntry(sb.toString(), SYSTEM_SOURCE, false, profile.id()));
	}
	
	public static void appendNote(String... lines) {
		StringBuilder sb = new StringBuilder();
		sb.append("<p class=\"chat-info\">");
		for(String line : lines) {
			sb.append(escape(line)+"<br>");
		}
		sb.append("</p>");
		
		append(false, new ChatEntry(sb.toString(), SYSTEM_SOURCE, true));
	}
	
	public static void append(boolean store, ChatEntry... entries) {
		// store chat entries on server side
		if(store) {
			ChatData chatData = getChatData();
			for(ChatEntry entry : entries) {
				chatData.append(entry);
			}
			Utils.saveJson("chat", chatData);
		}
		
		// send chat entries to client
		sendToClients(true, entries);
	}
	
	public static void triggerContent(Profile profile, long messageID, long contentID) throws ScriptException {
		// find entry
		ChatData chatData = getChatData();
		ChatEntry entry = null;
		for(int i=chatData.getEntries().size()-1; i>=Math.max(0, chatData.getEntries().size()-200); i--) {
			if(chatData.getEntries().get(i).getID() == messageID) {
				entry = chatData.getEntries().get(i);
				break;
			}
		}
		if(entry == null) throw new ScriptException("Parent not found");
		
		// check sender
		if(entry.getSource() != profile.id()) throw new ScriptException("Not original sender");
		
		// find triggered content
		TriggeredContent triggeredContent = null;
		if(entry.getTriggeredContent() != null) {
			for(TriggeredContent triggered : entry.getTriggeredContent()) {
				if(triggered.getID() == contentID) {
					triggeredContent = triggered;
				}
			}
		}
		if(triggeredContent == null) throw new ScriptException("Content not found");
		if(triggeredContent.isTriggerd()) throw new ScriptException("Already triggered");
		
		// send trigger
		triggeredContent.setTriggered();
		triggeredContent.getEntry().resetTime();
		append(true, triggeredContent.getEntry());
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
		MessageService.send(new ChatEntries(playerEntries, false, true), profile);
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
			MessageService.send(new ChatEntries(playerEntries, append, false), profile);
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
			ChatData chatData = Utils.readJson("chat", ChatData.class);
			if(chatData == null) {
				chatData = new ChatData();
			}
			loadedChat = chatData;
		}
		
		return loadedChat;
	}
	
	public static void forceChatDataSave() {
		Utils.saveJson("chat", getChatData());
	}
}
