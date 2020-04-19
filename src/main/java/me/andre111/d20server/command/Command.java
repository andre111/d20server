package me.andre111.d20server.command;

import java.util.HashMap;
import java.util.Map;

import me.andre111.d20server.model.entity.game.Game;
import me.andre111.d20server.model.entity.game.GamePlayer;

public abstract class Command {
	private static final Map<String, Command> COMMANDS = new HashMap<>();
	private static final void register(Command command, String name) {
		name = name.toLowerCase();
		if(COMMANDS.containsKey(name)) {
			throw new IllegalArgumentException("Command with name "+name+" was registered twice!");
		}
		COMMANDS.put(name, command);
	}
	private static final void register(Command command) {
		register(command, command.name);
		if(command.aliases != null) {
			for(String alias : command.aliases) {
				register(command, alias);
			}
		}
	}
	static {
		// Create all Commands:
		new RollCommand("roll", new String[] {"r"}, true, true);
		new RollCommand("gmroll", new String[] {"gmr"}, false, true);
		new RollCommand("hiddenroll", new String[] {"hr"}, false, false);
		
		new GetCommand("get", new String[] {});
	}
	
	public static final Command get(String name) {
		name = name.toLowerCase();
		return COMMANDS.get(name);
	}
	
	
	//---------------------------------------------------------
	private final String name;
	private final String[] aliases;
	
	public Command(String name, String[] aliases) {
		this.name = name;
		this.aliases = aliases;
		
		Command.register(this);
	}
	
	public abstract void execute(Game game, GamePlayer player, String arguments);
}
