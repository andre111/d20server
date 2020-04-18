package me.andre111.d20server.message.game;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.model.entity.map.Map;

public class LoadMap extends Message {
	@SuppressWarnings("unused")
	private Map map;
	
	public LoadMap(Map map) {
		this.map = map;
	}
}
