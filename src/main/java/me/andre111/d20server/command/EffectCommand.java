package me.andre111.d20server.command;

import java.util.Arrays;
import java.util.List;

import me.andre111.d20common.message.game.PlayEffect;
import me.andre111.d20common.model.Entity;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.scripting.Context;
import me.andre111.d20common.scripting.ScriptException;
import me.andre111.d20common.scripting.expression.Parser;
import me.andre111.d20common.scripting.expression.Result;
import me.andre111.d20server.service.ChatService;
import me.andre111.d20server.service.MessageService;

public class EffectCommand extends Command {
	private static final List<String> EFFECTS = Arrays.asList("PING"); //TODO: move to a global definition (in D20Common?)
	private final Parser parser;

	public EffectCommand(String name, String[] aliases) {
		super(name, aliases);
		
		parser = new Parser();
	}

	@Override
	public void execute(Profile profile, String arguments) {
		try {
			String[] split = arguments.split(" ", 6);
			if(split.length != 6) throw new ScriptException("Wrong argument count: <type> <x:expression> <y:expression> <rotation:expression> <scale:expression> <aboveOcc>");
			
			Entity map = profile.getMap();
			Context context = new Context(profile, map, null);
			
			String type = split[0];
			if(!EFFECTS.contains(type)) throw new ScriptException("Unknown effect type: "+type);
			
			Result x = parser.parse(split[1]).eval(context);
			Result y = parser.parse(split[2]).eval(context);
			Result rotation = parser.parse(split[3]).eval(context);
			Result scale = parser.parse(split[4]).eval(context);
			
			boolean aboveOcc = Boolean.parseBoolean(split[5]);
			
			MessageService.send(new PlayEffect("PING", (int) x.v, (int) y.v, (float) rotation.v, (float) scale.v, aboveOcc, false), map);
		} catch (ScriptException e) {
			ChatService.appendError(profile, "Could not create effect:", e.getMessage());
		}
	}

}
