package me.andre111.d20server.message.game.chat;

import java.util.List;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.model.entity.ChatEntry;

@SuppressWarnings("unused")
public class ChatEntries extends Message {
	private List<ChatEntry> entries;
	private boolean append;
	
	public ChatEntries(List<ChatEntry> entries, boolean append) {
		this.entries = entries;
		this.append = append;
	}
}
