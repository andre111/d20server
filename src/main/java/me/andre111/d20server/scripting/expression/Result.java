package me.andre111.d20server.scripting.expression;

public class Result {
	public final double v;
	public final String s;
	public final boolean hadMinRoll;
	public final boolean hadMaxRoll;
	
	public Result(double value, String string, boolean hadMinRoll, boolean hadMaxRoll) {
		this.v = value;
		this.s = string;
		this.hadMinRoll = hadMinRoll;
		this.hadMaxRoll = hadMaxRoll;
	}
	
	public double getValue() {
		return v;
	}
	
	public String getString() {
		return s;
	}
}
