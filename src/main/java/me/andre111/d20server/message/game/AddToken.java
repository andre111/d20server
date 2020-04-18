package me.andre111.d20server.message.game;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.model.entity.map.Token;
import me.andre111.d20server.service.MessageService;

public class AddToken extends GameMessage implements GMOnly {
	private Token token;
	
	public AddToken(Token token) {
		this.token = token;
	}

	@Override
	public Message handle() {
		getMap().addOrUpdateToken(token); // update token and get correct id //TODO: only add token, not update?
		MessageService.send(this, getGame(), getMap()); // and broadcast change
		return null;
	}
}
