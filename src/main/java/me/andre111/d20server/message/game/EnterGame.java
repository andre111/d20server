package me.andre111.d20server.message.game;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.model.entity.game.GamePlayer;

@SuppressWarnings("unused")
public class EnterGame extends Message {
	private GamePlayer player;
	
	public EnterGame(GamePlayer player) {
		this.player = player;
	}
}
