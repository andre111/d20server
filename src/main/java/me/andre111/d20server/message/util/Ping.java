package me.andre111.d20server.message.util;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.message.RecievableMessage;
import me.andre111.d20server.message.UnauthenticatedMessage;

public class Ping extends RecievableMessage implements UnauthenticatedMessage {
	public long time;
	
	@Override
	public Message handle() {
		return this;
	}
}
