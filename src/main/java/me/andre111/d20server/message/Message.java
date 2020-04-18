package me.andre111.d20server.message;

public abstract class Message {
	@SuppressWarnings("unused")
	private String msg;

	/**
	 * Called before serialization to store message type inside serialized data.
	 */
	public void preSerialization() {
		msg = getClass().getSimpleName();
	}
	
	/**
	 * Called after deserialization
	 */
	public void postDeserialization() {
		
	}
}
