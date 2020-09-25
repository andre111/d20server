package me.andre111.d20server.util;

import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.scripting.expression.Result;
import me.andre111.d20server.service.ChatService;

public class RollFormatter {
	//TODO: this should not include the player specific part
	public static String formatDiceRoll(Profile profile, String rollExpression, boolean showPublic, Result result, Exception e) {
		// build "header"
		StringBuilder sb = new StringBuilder();
		sb.append(ChatService.STYLE_SENDER);
		sb.append(profile.getName());
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
			appendResultValue(sb, result);
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
	
	public static String formatInlineDiceRoll(String rollExpression, Result result, Exception e) {
		StringBuilder sb = new StringBuilder();
		sb.append("[group ");
		
		sb.append("[table \"bg-color=#EEEEEE;stroke-color=#000000;stroke-width=2;margin=4\" ");
		
		// color format
		String color = "#000000";
		if(result != null) {
			if(result.cf && result.cs) {
				color = "#0000FF";
			} else if(result.cf) {
				color = "#FF0000";
			} else if(result.cs) {
				color = "#008800";
			}
		}
		sb.append("[style \"color=");
		sb.append(color);
		sb.append("\"]");
		
		// total value
		if(result != null) {
			appendResultValue(sb, result);
		} else {
			sb.append("?");
		}
		sb.append("]");
		
		// show full expression on hover
		sb.append("|");
		sb.append("[table \"bg-color=#EEEEEE;stroke-color=#000000;stroke-width=2;margin=4;align-vertical=CENTER\" ");
		sb.append("[group \"forced-width=300;auto-wrap=true;align-vertical=CENTER\" ");
		sb.append("[style \"color=#000000;font=Arial-18\"]");
		if(result != null) {
			sb.append(result.getString());
		} else {
			sb.append(rollExpression);
		}
		sb.append("[style \"font=Arial-12\"]");
		sb.append("]");
		sb.append("]");
		
		sb.append("]");
		return sb.toString();
	}
	
	private static void appendResultValue(StringBuilder sb, Result result) {
		if(Math.round(result.getValue()) == result.getValue()) {
			sb.append(Integer.toString((int) result.getValue()));
		} else {
			sb.append(Double.toString(result.getValue()));
		}
	}
}
