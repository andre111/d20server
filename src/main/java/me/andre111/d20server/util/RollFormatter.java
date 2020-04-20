package me.andre111.d20server.util;

import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20server.scripting.expression.Result;
import me.andre111.d20server.service.ChatService;

public class RollFormatter {

	public static String formatDiceRoll(GamePlayer player, String rollExpression, boolean showPublic, Result result, Exception e) {
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
		sb.append(rollExpression);
		sb.append(" \n");
		sb.append(" \n");
		
		if(result != null) {
			sb.append("[style \"font=Arial-18\"]");
			sb.append(result.getString());
			sb.append(" \n");
			
			sb.append("[style \"font=Arial-BOLD-18\"]");
			sb.append(" = ");
			if(Math.round(result.getValue()) == result.getValue()) {
				sb.append(Integer.toString((int) result.getValue()));
			} else {
				sb.append(Double.toString(result.getValue()));
			}
			sb.append(" \n");
		} else {
			sb.append("[style \"font=Arial-BOLD-18\"]");
			sb.append(" = ? \n");
			
			if(e != null) {
				sb.append(ChatService.STYLE_INFO);
				sb.append("(");
				sb.append(e.getMessage().replace("[", "").replace("]", "").replace("|", ""));
				sb.append(") \n");
			}
		}
		
		return sb.toString();
	}
}
