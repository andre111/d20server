package me.andre111.d20server.command;

import me.andre111.d20common.model.entity.ChatEntry;
import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.template.Template;
import me.andre111.d20server.service.ChatService;

public class TemplateCommand extends Command {
	private final boolean showPublic;
	private final boolean showSelf;
	private final boolean showGM;
	
	public TemplateCommand(String name, String[] aliases, boolean showPublic, boolean showSelf, boolean showGM) {
		super(name, aliases);
		
		this.showPublic = showPublic;
		this.showSelf = showSelf;
		this.showGM = showGM;
	}

	@Override
	public void execute(Game game, GamePlayer player, String arguments) {
		String[] split = arguments.split(" ", 2);
		if(split.length != 2) {
			ChatService.appendError(game, player, "Usage: /template <name> <argument>[;<argument>[;...]]");
			return;
		}
		
		String name = split[0].toLowerCase();
		String templateArguments = split[1];
		
		// find template
		Template template = Template.getTemplate(name);
		if(template == null) {
			ChatService.appendError(game, player, "Unknown template: "+name);
			return;
		}
		
		// parse template
		String parsed = "";
		try {
			parsed = template.parse(game, player, templateArguments.split(";", -1));
		} catch (ScriptException e) {
			ChatService.appendError(game, player, "Template parsing error: "+e.getMessage());
			return;
		}
		
		// build message
		StringBuilder sb = new StringBuilder();
		sb.append(ChatService.STYLE_SENDER);
		sb.append(player.getNickname());
		sb.append(": \n");
		sb.append(parsed);
		
		// determine recipents
		long[] recipents = buildRecipents(player, showPublic, showSelf);
		
		// append message
		ChatService.append(game, true, new ChatEntry(sb.toString(), player.getProfileID(), showGM, recipents));
	}

}
