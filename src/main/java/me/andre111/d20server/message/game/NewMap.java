package me.andre111.d20server.message.game;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.service.GameService;

public class NewMap extends GameMessage implements GMOnly {
	private String name;

	@Override
	public Message handle() {
		getGame().createMap(name);
		GameService.updateMapList(getGame());
		return null;
	}
}
