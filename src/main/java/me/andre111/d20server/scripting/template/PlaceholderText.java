package me.andre111.d20server.scripting.template;

import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20server.scripting.ScriptException;

public class PlaceholderText extends Placeholder {

	@Override
	public String parse(Game game, GamePlayer player, String input) throws ScriptException {
		return input;
	}

}
