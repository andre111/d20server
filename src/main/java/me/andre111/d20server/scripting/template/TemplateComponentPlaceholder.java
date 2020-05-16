package me.andre111.d20server.scripting.template;

import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20server.scripting.ScriptException;

public final class TemplateComponentPlaceholder extends TemplateComponent {
	private final Placeholder placeholder;
	private String string = null;
	
	public TemplateComponentPlaceholder(Placeholder placeholder) {
		this.placeholder = placeholder;
	}
	
	public void parse(Game game, GamePlayer player, String input) throws ScriptException {
		string = placeholder.parse(game, player, input);
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
