package me.andre111.d20server.message.game;

import java.util.Map;

import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.message.Message;
import me.andre111.d20server.model.entity.map.Token;
import me.andre111.d20server.service.MessageService;

public class UpdateToken extends GameMessage {
	private long tokenID;
	private Map<String, Property> properties;
	
	public UpdateToken(Token token) {
		this.tokenID = token.id();
		this.properties = token.getProperties();
	}

	@Override
	public Message handle() {
		Token token = getMap().getToken(tokenID);
		if(token == null || properties == null || properties.isEmpty()) return null;
		
		// determine access level
		Access accessLevel = token.getAccessLevel(getPlayer());
		
		// transfer values
		token.applyProperties(properties, accessLevel);
		getMap().save();
		
		// broadcast new token properties
		MessageService.send(new UpdateToken(token), getGame(), getMap());
		
		return null;
	}

}
