package me.andre111.d20server.command;

import me.andre111.d20common.model.entity.ChatEntry;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.model.property.Type;
import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.expression.Expression;
import me.andre111.d20server.scripting.expression.Parser;
import me.andre111.d20server.scripting.expression.Result;
import me.andre111.d20server.scripting.variable.Variable;
import me.andre111.d20server.scripting.variable.parser.VariableParser;
import me.andre111.d20server.service.ChatService;
import me.andre111.d20server.service.GameService;
import me.andre111.d20server.util.RollFormatter;

public class SetCommand extends Command {
	private final boolean showPublic;
	private final boolean hidden;
	
	private final Parser parser;

	public SetCommand(String name, String[] aliases, boolean showPublic, boolean hidden) {
		super(name, aliases);
		
		this.showPublic = showPublic;
		this.hidden = hidden;
		
		parser = new Parser();
	}

	@Override
	public void execute(Profile profile, String arguments) {
		try {
			String[] split = arguments.split(" ", 3);
			if(split.length != 3) throw new ScriptException("Wrong argument count: <variable> <type> <expression>");
			
			Map map = GameService.getPlayerMap(profile);
			Context context = new Context(profile, map);
			
			Variable variable = VariableParser.parseVariable(split[0]);
			Type type = Type.valueOf(split[1].toUpperCase());
			String valueString = split[2];
			
			if(type == Type.LONG || type == Type.DOUBLE) {
				// evaluate as expression
				Expression expr = parser.parse(valueString);
				Result value = expr.eval(context);
				
				// cast and set
				if(type == Type.LONG) {
					variable.set(context, ((long) value.v));
				} else if(type == Type.DOUBLE) {
					variable.set(context, value.v);
				}
				
				// send roll message
				if(!hidden) {
					String rollMessage = RollFormatter.formatDiceRoll(profile, valueString, showPublic, value, null);
					long[] recipents = buildRecipents(profile, showPublic, true);
					ChatService.append(true, new ChatEntry(rollMessage, profile.id(), true, recipents));
				}
			} else if(type == Type.STRING) {
				variable.set(context, valueString);
				//TODO: send info messsage
			} else {
				//TODO: handle more types (LIGHT,LAYER,...)
				ChatService.appendError(profile, "Cannot set value of Type: "+type);
			}
		} catch (ScriptException e) {
			ChatService.appendError(profile, "Could not set "+arguments.split(" ", 2)[0]+":", e.getMessage());
		}
	}

}
