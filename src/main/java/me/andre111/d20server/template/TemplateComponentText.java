package me.andre111.d20server.template;

import java.util.Collections;
import java.util.List;

import me.andre111.d20common.model.chat.ChatEntry.TriggeredContent;
import me.andre111.d20common.scripting.expression.DiceRoll;

public final class TemplateComponentText extends TemplateComponent {
	private final String string;
	
	public TemplateComponentText(String string) {
		this.string = string;
	}
	
	@Override
	public String getString() {
		return string;
	}

	@Override
	public List<DiceRoll> getDiceRolls() {
		return Collections.emptyList();
	}

	@Override
	public List<TriggeredContent> getTriggeredContent() {
		return Collections.emptyList();
	}
}
