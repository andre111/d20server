package me.andre111.d20server.command;

import java.util.HashMap;
import java.util.Map;

import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;

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
		
		new GetCommand("get", new String[] {"g"});
		new SetCommand("set", new String[] {"s"}, true, false);
		new SetCommand("gmset", new String[] {"gs"}, false, false);
		new SetCommand("hiddenset", new String[] {"hs"}, false, true);
		
		new WhisperCommand("whisper", new String[] {"w"});
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
	
	protected long[] buildRecipents(GamePlayer sender, boolean showPublic, boolean showSelf) {
		long[] recipents = null;
		if(!showPublic) {
			if(showSelf) {
				recipents = new long[] { sender.getProfileID() };
			} else {
				recipents = new long[] { -1 };
			}
		}
		return recipents;
	}
}
