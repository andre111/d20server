package me.andre111.d20server.model.entity;

import me.andre111.d20server.message.ExcludeFromMessage;

@SuppressWarnings("unused")
public final class ChatEntry {
	private String text;
	
	@ExcludeFromMessage
	private long[] recipents;
	@ExcludeFromMessage
	private boolean includeGMs;
	
	@ExcludeFromMessage
	private long source;
	@ExcludeFromMessage
	private long time;
	
	public ChatEntry(String text, long source) {
		this.text = text;
		this.source = source;
		this.time = System.currentTimeMillis();
	}
	public ChatEntry(String text, long source, boolean includeGMs, long...recipents) {
		this.text = text;
		this.recipents = recipents;
		this.includeGMs = includeGMs;
		this.source = source;
		this.time = System.currentTimeMillis();
	}
	
	public long[] getRecipents() {
		return recipents;
	}
	
	public boolean doIncludeGMs() {
		return includeGMs;
	}
}