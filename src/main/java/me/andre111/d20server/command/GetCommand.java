package me.andre111.d20server.command;

import me.andre111.d20common.model.entity.ChatEntry;
import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.VariableParser;
import me.andre111.d20server.scripting.variable.Variable;
import me.andre111.d20server.service.ChatService;

public class GetCommand extends Command {
	public GetCommand(String name, String[] aliases) {
		super(name, aliases);
	}

	@Override
	public void execute(Game game, GamePlayer player, String arguments) {
		// TODO Auto-generated method stub
		try {
			Variable variable = VariableParser.parseVariable(arguments);
			Object value = variable.get(game, game.getPlayerMap(player, EntityManager.MAP::find), player);
			
			StringBuilder sb = new StringBuilder();
			sb.append(ChatService.STYLE_INFO);
			sb.append(arguments);
			sb.append(" = ");
			sb.append(value);
			
			ChatService.append(game, new ChatEntry(sb.toString(), ChatService.SYSTEM_SOURCE, false, player.getProfileID()));
		} catch (ScriptException e) {
			ChatService.appendError(game, player, "Could not get "+arguments+":", e.getMessage());
		}
	}
}
