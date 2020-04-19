package me.andre111.d20server.model.entity;

import java.time.Instant;

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
	
	private long time;
	
	public ChatEntry(String text, long source) {
		this.text = text;
		this.source = source;
		this.time = Instant.now().getEpochSecond();
	}
	public ChatEntry(String text, long source, boolean includeGMs, long...recipents) {
		this.text = text;
		this.recipents = recipents;
		this.includeGMs = includeGMs;
		this.source = source;
		this.time = Instant.now().getEpochSecond();
	}
	
	public long[] getRecipents() {
		return recipents;
	}
	
	public boolean doIncludeGMs() {
		return includeGMs;
	}
}