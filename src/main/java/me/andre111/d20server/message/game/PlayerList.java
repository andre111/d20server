package me.andre111.d20server.message.game;

import java.util.List;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.model.entity.game.GamePlayer;

@SuppressWarnings("unused")
public class PlayerList extends Message {
	private List<GamePlayer> players;
	
	public PlayerList(List<GamePlayer> players) {
		this.players = players;
	}
}
