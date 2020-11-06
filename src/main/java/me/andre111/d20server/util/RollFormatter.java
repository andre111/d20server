package me.andre111.d20server.util;

import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.scripting.expression.Result;
import me.andre111.d20server.service.ChatService;

public class RollFormatter {
	//TODO: this should not include the player specific part
	public static String formatDiceRoll(Profile profile, String rollExpression, boolean showPublic, Result result, Exception e) {
		// build "header"
		StringBuilder sb = new StringBuilder();
		sb.append("<p class=\"chat-sender\">");
		sb.append(ChatService.escape(profile.getName()));
		if(!showPublic) {
			sb.append(" (to GM)");
		}
		sb.append(": ");
		
		sb.append("</p>");
		
		sb.append("<span class=\"hoverable\">");
		sb.append("<p class=\"chat-info\">");
		sb.append("rolling ...");
		sb.append("</p>");
		sb.append("<div class=\"onhover\">");
		sb.append(ChatService.escape(normalizeExpression(rollExpression)));
		sb.append("</div>");
		sb.append("</span>");

		// result
		sb.append("<p class=\"chat-message\">");
		if(result != null) {
			sb.append(result.getString());
			sb.append("<br>");
			sb.append(" = ");
			appendResultValue(sb, result);
		} else {
			sb.append(" = ?");
		}
		sb.append("</p>");
		
		// potential error message
		if(e != null) {
			sb.append("<p class=\"chat-info\">");
			sb.append("( ");
			sb.append(ChatService.escape(e.getMessage()));
			sb.append(" )");
			sb.append("</p>");
		}
		
		return sb.toString();
	}
	
	public static String formatInlineDiceRoll(String rollExpression, Result result, String e) {
		StringBuilder sb = new StringBuilder();
		// color format
		String color = "#000000";
		if(result != null) {
			if(result.hadCriticalFailure() && result.hadCriticalSuccess()) {
				color = "#0000FF";
			} else if(result.hadCriticalFailure()) {
				color = "#FF0000";
			} else if(result.hadCriticalSuccess()) {
				color = "#008800";
			}
		}
		
		// total value
		sb.append("<span style=\"color:"+color+"\" class=\"chat-dice-inline hoverable\">");
		if(result != null) {
			appendResultValue(sb, result);
		} else {
			sb.append("?");
		}
		// show full result on hover
		sb.append("<div class=\"onhover\">");
		sb.append(result.getString());
		sb.append("</div>");
		sb.append("</span>");
		
		// show expression on hover
		sb.append("<span class=\"hoverable\">");
		sb.append("*");
		sb.append("<div class=\"onhover\">");
		sb.append(ChatService.escape(normalizeExpression(rollExpression)));
		sb.append("</div>");
		sb.append("</span>");
		
		return sb.toString();
	}
	
	private static void appendResultValue(StringBuilder sb, Result result) {
		if(Math.round(result.getValue()) == result.getValue()) {
			sb.append(Integer.toString((int) result.getValue()));
		} else {
			sb.append(Double.toString(result.getValue()));
		}
	}
	
	private static String normalizeExpression(String expression) {
		expression = expression.replace("+", " + ");
		expression = expression.replace("-", " - ");
		expression = expression.replace("*", " * ");
		expression = expression.replace("/", " / ");
		expression = expression.replace("(", "( ");
		expression = expression.replace(",", ", ");
		expression = expression.replace(")", " )");
		expression = expression.replaceAll(" +", " ");
		return expression;
	}
}
