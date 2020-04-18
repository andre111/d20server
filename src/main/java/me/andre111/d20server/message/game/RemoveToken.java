package me.andre111.d20server.message.game;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.model.entity.map.Token;
import me.andre111.d20server.service.MessageService;

public class RemoveToken extends GameMessage implements GMOnly {
	private long tokenID;
	
	public RemoveToken(Token token) {
		this.tokenID = token.id();
	}

	@Override
	public Message handle() {
		getMap().removeToken(getMap().getToken(tokenID));
		MessageService.send(this, getGame(), getMap());
		return null;
	}
}
