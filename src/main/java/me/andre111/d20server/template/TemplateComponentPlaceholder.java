package me.andre111.d20server.template;

import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.scripting.ScriptException;

public final class TemplateComponentPlaceholder extends TemplateComponent {
	private final int index;
	private final Placeholder placeholder;
	private String string = null;
	
	public TemplateComponentPlaceholder(int index, Placeholder placeholder) {
		this.index = index;
		this.placeholder = placeholder;
	}
	
	public int getIndex() {
		return index;
	}
	
	public void parse(Profile profile, String input) throws ScriptException {
		string = placeholder.parse(profile, input);
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
}
