package me.andre111.d20server.template;

import java.util.ArrayList;
import java.util.List;

import me.andre111.d20common.model.chat.ChatEntry.TriggeredContent;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.scripting.ScriptException;
import me.andre111.d20common.scripting.expression.DiceRoll;

public final class TemplateComponentPlaceholder extends TemplateComponent {
	private final int index;
	private final Placeholder placeholder;
	private String string = null;
	private List<DiceRoll> diceRolls = null;
	private List<TriggeredContent> triggeredContent = null;
	
	public TemplateComponentPlaceholder(int index, Placeholder placeholder) {
		this.index = index;
		this.placeholder = placeholder;
	}
	
	public int getIndex() {
		return index;
	}
	
	public void parse(Profile profile, String input) throws ScriptException {
		diceRolls = new ArrayList<>();
		triggeredContent = new ArrayList<>();
		string = placeholder.parse(profile, input, diceRolls, triggeredContent);
	}
	
	@Override
	public String getString() {
		if(string == null) {
			throw new IllegalStateException("Placeholder was not parsed before getting string.");
		}
		String currentString = string;
		string = null;
		return currentString;
	}

	@Override
	public List<DiceRoll> getDiceRolls() {
		if(diceRolls == null) {
			throw new IllegalStateException("Placeholder was not parsed before getting dice rolls.");
		}
		var currentDiceRolls = diceRolls;
		diceRolls = null;
		return currentDiceRolls;
	}

	@Override
	public List<TriggeredContent> getTriggeredContent() {
		if(triggeredContent == null) {
			throw new IllegalStateException("Placeholder was not parsed before getting triggered content.");
		}
		var currentTriggeredContent = triggeredContent;
		triggeredContent = null;
		return currentTriggeredContent;
	}
}
