package me.andre111.d20server.message.game;

import me.andre111.d20server.message.IllegalMessageException;
import me.andre111.d20server.message.RecievableMessage;
import me.andre111.d20server.model.entity.game.Game;
import me.andre111.d20server.model.entity.game.GamePlayer;
import me.andre111.d20server.model.entity.map.Map;
import me.andre111.d20server.service.GameService;

public abstract class GameMessage extends RecievableMessage {
	private transient Game game;
	private transient GamePlayer player;
	private transient Map map;
	
	@Override
	public final void init() {
		// check for game present and throw error when it does not exist
		game = GameService.getGame(getProfile());
		if(game == null) {
			throw new IllegalMessageException("Not in a game");
		}
		player = game.getPlayer(getProfile());
		if(player == null) {
			throw new IllegalMessageException("Not in a game due to internal server error");
		}
		map = game.getPlayerMap(player);
		if(!(this instanceof NoMapRequired)) {
			if(map == null) {
				throw new IllegalMessageException("No map loaded");
			}
		}
		
		// check for gm status and throw error if not present
		if (this instanceof GMOnly) {
			if(player.getRole() != GamePlayer.Role.GM) {
				throw new IllegalMessageException("This action can only be performed by GMs");
			}
		}
	}
	
	public Game getGame() {
		return game;
	}
	public GamePlayer getPlayer() {
		return player;
	}
	public Map getMap() {
		return map;
	}
}
