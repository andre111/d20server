package me.andre111.d20server.message.game.chat;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.message.game.GameMessage;
import me.andre111.d20server.service.ChatService;

public class ChatMessage extends GameMessage {
	private String message;
	
	@Override
	public Message handle() {
		ChatService.onMessage(getGame(), getPlayer(), message);
		return null;
	}
}
