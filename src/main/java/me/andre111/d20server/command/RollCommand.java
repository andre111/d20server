package me.andre111.d20server.command;

import me.andre111.d20common.model.entity.ChatEntry;
import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.scripting.expression.Expression;
import me.andre111.d20server.scripting.expression.Parser;
import me.andre111.d20server.scripting.expression.Result;
import me.andre111.d20server.service.ChatService;
import me.andre111.d20server.util.RollFormatter;

public class RollCommand extends Command {
	private final boolean showPublic;
	private final boolean showSelf;
	
	private final Parser parser;
	
	public RollCommand(String name, String[] aliases, boolean showPublic, boolean showSelf) {
		super(name, aliases);
		
		this.showPublic = showPublic;
		this.showSelf = showSelf;
		
		this.parser = new Parser();
	}

	
	@Override
	public void execute(Game game, GamePlayer player, String arguments) {
		// parse roll and execute
		Result result = null;
		Exception exception = null;
		try {
			Expression expr = parser.parse(arguments);
			result = expr.eval(game, game.getPlayerMap(player, EntityManager.MAP::find), player);
		} catch(Exception e) {
			exception = e;
		}
		
		String rollMessage = RollFormatter.formatDiceRoll(player, arguments, showPublic, result, exception);
		
		// determine recipents
		long[] recipents = buildRecipents(player, showPublic, showSelf);
		
		// append message
		ChatService.append(game, new ChatEntry(rollMessage, player.getProfileID(), true, recipents));
	}
}
