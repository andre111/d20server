package me.andre111.d20server.message.util;

import me.andre111.d20server.message.Message;

public class ResponseOk extends Message {
	public final String to;
	
	public ResponseOk(Message message) {
		this.to = message.getClass().getSimpleName();
	}
}
