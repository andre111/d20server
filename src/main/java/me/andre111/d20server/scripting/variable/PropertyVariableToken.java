package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.message.game.token.UpdateToken;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.scripting.Context;
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
	protected Property getProperty(Context context) throws ScriptException {
		// get property
		Property property = tokenFinder.findToken(context).getProperty(propertyName);
		if(property == null) {
			throw new ScriptException("Token has no property "+propertyName);
		}
		return property;
	}

	@Override
	protected Access getAccessLevel(Context context) throws ScriptException {
		return tokenFinder.findToken(context).getAccessLevel(context.getProfile());
	}

	@Override
	protected void saveSourceAfterSet(Context context) throws ScriptException {
		EntityManager.MAP.save(context.getMap());
		MessageService.send(new UpdateToken(tokenFinder.findToken(context)), context.getMap());
	}
}
