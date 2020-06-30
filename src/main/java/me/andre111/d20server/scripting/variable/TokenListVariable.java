package me.andre111.d20server.scripting.variable;

import me.andre111.d20common.message.game.token.list.TokenListValue;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.entity.map.TokenList;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.scripting.Context;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.scripting.TokenFinder;
import me.andre111.d20server.service.MessageService;

public class TokenListVariable extends Variable {
	private final String listName;
	private final TokenFinder tokenFinder;
	
	public TokenListVariable(String fullName, String listName, TokenFinder tokenFinder) {
		super(fullName);
		
		this.listName = listName;
		this.tokenFinder = tokenFinder;
	}

	@Override
	public final void set(Context context, Object value) throws ScriptException {
		Token token = tokenFinder.findToken(context);
		TokenList list = getList(context);
		
		// check access
		Access accessLevel = list.getAccessLevel(context.getProfile(), token);
		if(!list.canEdit(accessLevel)) {
			throw new ScriptException("No edit access to "+getFullName());
		}
		
		if(!(value instanceof Long)) {
			throw new ScriptException("Value is not a valid list entry: "+value);
		}
		
		// set
		list.addOrUpdateToken(token, (Long) value);
		
		// save and broadcast
		EntityManager.MAP.save(context.getMap());
		MessageService.send(new TokenListValue(list, token, (Long) value, false), context.getMap());
	}

	@Override
	public final Object get(Context context) throws ScriptException {
		Token token = tokenFinder.findToken(context);
		TokenList list = getList(context);
		
		Access accessLevel = list.getAccessLevel(context.getProfile(), token);
		if(!list.canView(accessLevel)) {
			throw new ScriptException("No view access to "+getFullName());
		}
		
		return list.getValue(token);
	}
	
	private TokenList getList(Context context) throws ScriptException {
		TokenList list = context.getMap().getTokenList(listName);
		if(list != null) {
			return list;
		}
		
		throw new ScriptException("Could not find list: "+listName);
	}
}
