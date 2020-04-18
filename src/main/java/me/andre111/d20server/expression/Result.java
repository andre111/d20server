package me.andre111.d20server.expression;

public class Result {
	public final double v;
	public final String s;
	
	public Result(double value, String string) {
		this.v = value;
		this.s = string;
	}
	
	public double getValue() {
		return v;
	}
	
	public String getString() {
		return s;
	}
}
