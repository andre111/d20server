package me.andre111.d20server.command;

import me.andre111.d20common.model.entity.ChatEntry;
import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.scripting.expression.Expression;
import me.andre111.d20server.scripting.expression.Parser;
import me.andre111.d20server.scripting.expression.Result;
import me.andre111.d20server.service.ChatService;

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
		// build "header"
		StringBuilder sb = new StringBuilder();
		sb.append(ChatService.STYLE_SENDER);
		sb.append(player.getNickname());
		if(!showPublic) {
			sb.append(" (to GM)");
		}
		sb.append(": \n");
		
		sb.append(ChatService.STYLE_INFO);
		sb.append("rolling ");
		sb.append(arguments);
		sb.append(" \n");
		sb.append(" \n");
		
		// parse roll and execute
		try {
			Expression expr = parser.parse(arguments);
			Result result = expr.eval(game, game.getPlayerMap(player, EntityManager.MAP::find), player);
			
			sb.append("[group \"align-vertical=CENTER\"");
			sb.append("[style \"font=Arial-18\"]");
			sb.append(result.getString());
			sb.append("] \n");
			
			sb.append("[style \"font=Arial-BOLD-18\"]");
			sb.append(" = ");
			if(Math.round(result.getValue()) == result.getValue()) {
				sb.append(Integer.toString((int) result.getValue()));
			} else {
				sb.append(Double.toString(result.getValue()));
			}
			sb.append(" \n");
		} catch(Exception e) {
			sb.append("[style \"font=Arial-BOLD-18\"]");
			sb.append(" = ? \n");
			
			sb.append(ChatService.STYLE_INFO);
			sb.append("(");
			sb.append(e.getMessage().replace("[", "").replace("]", "").replace("|", ""));
			sb.append(") \n");
		}
		
		// determine recipents
		long[] recipents = null;
		if(!showPublic) {
			if(showSelf) {
				recipents = new long[] { player.getProfileID() };
			} else {
				recipents = new long[] { -1 };
			}
		}
		
		// append message
		ChatService.append(game, new ChatEntry(sb.toString(), player.getProfileID(), true, recipents));
	}
}
