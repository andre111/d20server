package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.message.game.token.UpdateToken;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.TokenFinder;
import me.andre111.d20server.service.MessageService;

public class PropertyVariableToken extends PropertyVariable {
	private final TokenFinder tokenFinder;
	
	public PropertyVariableToken(String fullName, String propertyName, TokenFinder tokenFinder) {
		super(fullName, propertyName);
		
		this.tokenFinder = tokenFinder;
	}

	@Override
	protected Property getProperty(Map map, Profile profile) throws ScriptException {
		// get property
		Property property = tokenFinder.findToken(map, profile).getProperty(propertyName);
		if(property == null) {
			throw new ScriptException("Token has no property "+propertyName);
		}
		return property;
	}

	@Override
	protected Access getAccessLevel(Map map, Profile profile) throws ScriptException {
		return tokenFinder.findToken(map, profile).getAccessLevel(profile);
	}

	@Override
	protected void saveSourceAfterSet(Map map, Profile profile) throws ScriptException {
		EntityManager.MAP.save(map);
		MessageService.send(new UpdateToken(tokenFinder.findToken(map, profile)), map);
	}
}
