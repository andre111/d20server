package me.andre111.d20server.scripting.expression;

public class Result {
	public final double v;
	public final String s;
	public final boolean cf;
	public final boolean cs;
	
	public Result(double value, String string, boolean hadCriticalFailure, boolean hadCriticalSuccess) {
		this.v = value;
		this.s = string;
		this.cf = hadCriticalFailure;
		this.cs = hadCriticalSuccess;
	}
	
	public double getValue() {
		return v;
	}
	
	public String getString() {
		return s;
	}
}
