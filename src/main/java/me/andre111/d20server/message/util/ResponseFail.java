package me.andre111.d20server.message.util;

import me.andre111.d20server.message.Message;

public class ResponseFail extends Message {
	public final String to;
	public final String description;
	
	public ResponseFail(Message message, String description) {
		this.to = message.getClass().getSimpleName();
		this.description = description;
	}
}
