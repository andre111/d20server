package me.andre111.d20server.message.game;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.model.entity.map.MapSettings;
import me.andre111.d20server.service.MessageService;

public class UpdateMapSettings extends GameMessage implements GMOnly {
	private MapSettings mapSettings;

	@Override
	public Message handle() {
		getMap().setSettings(mapSettings);
		MessageService.send(this, getGame(), getMap()); // and broadcast change
		return null;
	}
}
