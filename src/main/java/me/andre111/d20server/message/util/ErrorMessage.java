package me.andre111.d20server.message.util;

import me.andre111.d20server.message.Message;

public class ErrorMessage extends Message {
	private String msg;
	
	public ErrorMessage(String msg) {
		this.msg = msg;
	}
	
	public String getMessage() {
		return msg;
	}
}
