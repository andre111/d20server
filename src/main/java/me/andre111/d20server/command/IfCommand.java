package me.andre111.d20server.command;

import me.andre111.d20common.model.Entity;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.scripting.Context;
import me.andre111.d20common.scripting.ScriptException;
import me.andre111.d20common.scripting.expression.Expression;
import me.andre111.d20common.scripting.expression.Parser;
import me.andre111.d20common.scripting.expression.Result;
import me.andre111.d20server.service.ChatService;

public class IfCommand extends Command {
	private final Parser parser;

	public IfCommand(String name, String[] aliases) {
		super(name, aliases);
		
		parser = new Parser();
	}

	@Override
	public void execute(Profile profile, String arguments) {
		try {
			// parse components
			arguments = arguments.stripLeading();
			if(arguments.charAt(0) != '[') throw new ScriptException("Wrong arguments: [<expression>] <condition> [<expression>] ...");
			int endIndex = arguments.indexOf(']');
			if(endIndex < 0) throw new ScriptException("Wrong arguments: [<expression>] <condition> [<expression>] ...");
			String firstExpression = arguments.substring(1, endIndex);
			
			arguments = arguments.substring(endIndex+1).stripLeading();
			endIndex = arguments.indexOf(' ');
			if(endIndex < 0) throw new ScriptException("Wrong arguments: [<expression>] <condition> [<expression>] ...");
			String comparison = arguments.substring(0, endIndex);
			
			arguments = arguments.substring(endIndex+1).stripLeading();
			if(arguments.charAt(0) != '[') throw new ScriptException("Wrong arguments: [<expression>] <condition> [<expression>] ...");
			endIndex = arguments.indexOf(']');
			if(endIndex < 0) throw new ScriptException("Wrong arguments: [<expression>] <condition> [<expression>] ...");
			String secondExpression = arguments.substring(1, endIndex);
			
			String message = arguments.substring(endIndex+1).stripLeading();
			
			// create context, parse and evalute expressions
			Entity map = profile.getMap();
			Context context = new Context(profile, map, null);
			
			Expression expr1 = parser.parse(firstExpression);
			Result value1 = expr1.eval(context);
			Expression expr2 = parser.parse(secondExpression);
			Result value2 = expr2.eval(context);
			
			// compare
			boolean isTrue = switch(comparison) {
				case "==" -> value1.v == value2.v;
				case "!=" -> value1.v != value2.v;
				case ">" -> value1.v > value2.v;
				case "<" -> value1.v < value2.v;
				case ">=" -> value1.v >= value2.v;
				case "<=" -> value1.v <= value2.v;
				default -> throw new ScriptException("Unknown comparison type: "+comparison);
			};
			
			// send message/command if isTrue
			if(isTrue) {
				ChatService.onMessage(profile, message);
			}
		} catch (ScriptException e) {
			ChatService.appendError(profile, "Could not execute if command:", e.getMessage());
		}
	}
}
