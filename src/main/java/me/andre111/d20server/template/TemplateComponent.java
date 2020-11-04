package me.andre111.d20server.template;

import java.util.List;

import me.andre111.d20common.model.chat.ChatEntry.TriggeredContent;
import me.andre111.d20common.scripting.expression.DiceRoll;

public abstract class TemplateComponent {
	public abstract String getString();
	public abstract List<DiceRoll> getDiceRolls();
	public abstract List<TriggeredContent> getTriggeredContent();
}
