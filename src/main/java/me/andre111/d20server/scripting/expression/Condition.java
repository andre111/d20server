package me.andre111.d20server.scripting.expression;

public class Condition {
	private final Type type;
	private final int value;
	
	public Condition(Type type, int value) {
		this.type = type;
		this.value = value;
	}
	
	public boolean matches(int input) {
		switch(type) {
		case EQUAL:
			return input == value;
		case LESS_THAN:
			return input < value;
		case LESS_THAN_OR_EQUAL:
			return input <= value;
		case GREATER_THAN:
			return input > value;
		case GREATER_THAN_OR_EQUAL:
			return input >= value;
		}
		return false;
	}
	
	public static enum Type {
		EQUAL,
		LESS_THAN,
		LESS_THAN_OR_EQUAL,
		GREATER_THAN,
		GREATER_THAN_OR_EQUAL
	}
}
