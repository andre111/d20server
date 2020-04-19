package me.andre111.d20server.model.entity.map;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;

public class TokenList {
	private String name;
	//TODO: move to properties system (displayName,display,access rules,...)
	private String displayName;
	private boolean displayInWindow;
	
	private List<Long> tokens;
	private java.util.Map<Long, Long> values;
	
	public TokenList(String name, String displayName, boolean displayInWindow) {
		this.name = name; //TODO: verfy name is valid identifier (just letters and numbers)
		this.displayName = displayName;
		this.displayInWindow = displayInWindow;
		
		this.tokens = new ArrayList<>();
		this.values = new HashMap<>();
	}
	
	public String getName() {
		return name;
	}
	public String getDisplayName() {
		return displayName;
	}
	public boolean doDisplayInWindow() {
		return displayInWindow;
	}
	
	public List<Long> getTokens() {
		return Collections.unmodifiableList(tokens);
	}
	public void addOrUpdateToken(long tokenID, long value) {
		if(!tokens.contains(tokenID)) {
			tokens.add(tokenID);
		}
		
		values.put(tokenID, value);
	}
	public void removeToken(long tokenID) {
		tokens.remove(tokenID);
		values.remove(tokenID);
	}
	
	public long getValue(long tokenID) {
		return values.get(tokenID);
	}
	
	@Override
	public final boolean equals(Object other) {
		if(other == null) return false;
		if(!getClass().equals(other.getClass())) return false;
		
		return name.equals(((TokenList) other).name);
	}
	
	@Override
	public final int hashCode() {
		return name.hashCode();
	}
}
