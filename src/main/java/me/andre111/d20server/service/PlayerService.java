package me.andre111.d20server.service;

import java.util.List;

import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;

public abstract class PlayerService {

	public static Token getSelectedToken(Map map, GamePlayer player, boolean forceSingle) {
		List<Long> selectedTokens = player.getSelectedTokens();
		if(selectedTokens == null || selectedTokens.isEmpty()) return null;
		if(forceSingle && selectedTokens.size() != 1) return null;
		
		Token token = map.getToken(selectedTokens.get(0));
		return token;
	}
}
