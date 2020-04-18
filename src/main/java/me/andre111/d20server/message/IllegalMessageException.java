package me.andre111.d20server.message;

public class IllegalMessageException extends RuntimeException {
	private static final long serialVersionUID = -6279793632929850890L;

	public IllegalMessageException(String message) {
		super(message);
	}
}
