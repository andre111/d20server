package me.andre111.d20server.message.game;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.model.entity.map.Wall;
import me.andre111.d20server.service.MessageService;

public class AddOrUpdateWall extends GameMessage implements GMOnly {
	private Wall wall;
	
	public AddOrUpdateWall(Wall wall) {
		this.wall = wall;
	}

	@Override
	public Message handle() {
		getMap().addOrUpdateWall(wall); // update wall and get correct id
		MessageService.send(this, getGame(), getMap()); // and broadcast change
		return null;
	}
}
