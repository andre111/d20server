package me.andre111.d20server.message.game;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.model.entity.map.Wall;
import me.andre111.d20server.service.MessageService;

public class RemoveWall extends GameMessage implements GMOnly {
	private long wallID;
	
	public RemoveWall(Wall wall) {
		this.wallID = wall.id();
	}

	@Override
	public Message handle() {
		getMap().removeWall(getMap().getWall(wallID));
		MessageService.send(this, getGame(), getMap());
		return null;
	}
}
