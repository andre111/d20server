package me.andre111.d20server.command;

import me.andre111.d20common.model.chat.ChatEntry;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.scripting.ScriptException;
import me.andre111.d20server.service.ChatService;
import me.andre111.d20server.template.Template;

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
	public void execute(Profile profile, String arguments) {
		String[] split = arguments.split(" ", 2);
		if(split.length != 2) {
			ChatService.appendError(profile, "Usage: /template <name> <argument>[;<argument>[;...]]");
			return;
		}
		
		String name = split[0].toLowerCase();
		String templateArguments = split[1];
		
		// find template
		Template template = Template.getTemplate(name);
		if(template == null) {
			ChatService.appendError(profile, "Unknown template: "+name);
			return;
		}
		
		// parse template
		String parsed = "";
		try {
			String[] inputs = templateArguments.split(";", -1);
			for(int i=0; i<inputs.length; i++) inputs[i] = ChatService.escape(inputs[i]);
			
			parsed = template.parse(profile, inputs);
		} catch (ScriptException e) {
			ChatService.appendError(profile, "Template parsing error: "+e.getMessage());
			return;
		}
		
		// build message
		StringBuilder sb = new StringBuilder();
		if(ChatService.USE_HTML) {
			sb.append("<p class=\"chat-sender\">");
			sb.append(ChatService.escape(profile.getName()));
			sb.append(": ");
			sb.append("</p>");
			
			sb.append("<p class=\"chat-message\">");
			sb.append(parsed);
			sb.append("</p>");
		} else {
			sb.append(ChatService.STYLE_SENDER);
			sb.append(profile.getName());
			sb.append(": \n");
			sb.append(parsed);
		}
		
		// determine recipents
		long[] recipents = buildRecipents(profile, showPublic, showSelf);
		
		// append message
		ChatService.append(true, new ChatEntry(sb.toString(), profile.id(), showGM, recipents));
	}
}
