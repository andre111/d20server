package me.andre111.d20server.model.entity.map;

import me.andre111.d20common.util.ReplacingLinkedHashSet;
import me.andre111.d20server.model.BaseEntity;
import me.andre111.d20server.model.EntityManager;

public class Map extends BaseEntity {
	//TODO: move to properties system
	private String name;
	private MapSettings mapSettings = new MapSettings();

	private ReplacingLinkedHashSet<Wall> walls = new ReplacingLinkedHashSet<>();
	private ReplacingLinkedHashSet<Token> tokens = new ReplacingLinkedHashSet<>();
	
	private ReplacingLinkedHashSet<TokenList> lists = new ReplacingLinkedHashSet<>();
	
	public Map(String name) {
		this.name = name;
	}
	
	public MapSettings getSettings() {
		return mapSettings;
	}
	public void setSettings(MapSettings mapSettings) {
		this.mapSettings = mapSettings;
		save();
	}
	
	public void addOrUpdateWall(Wall wall) {
		if(!walls.contains(wall)) {
			wall.resetID(); // reset ID to generate one from the DB
		}
		walls.update(wall);
		save();
	}
	public void removeWall(Wall wall) {
		walls.remove(wall);
		save();
	}
	public Wall getWall(long id) {
		for(Wall wall : walls) {
			if(wall.id() == id) {
				return wall;
			}
		}
		return null;
	}

	public void addOrUpdateToken(Token token) {
		if(!tokens.contains(token)) {
			token.resetID(); // reset ID to generate one from the DB
		}
		tokens.update(token);
		save();
	}
	public void removeToken(Token token) {
		tokens.remove(token);
		save();
	}
	public Token getToken(long id) {
		for(Token token : tokens) {
			if(token.id() == id) {
				return token;
			}
		}
		return null;
	}
	
	public void addOrUpdateTokenList(TokenList list) {
		lists.update(list);
		save();
	}
	public void removeTokenList(TokenList list) {
		lists.remove(list);
		save();
	}
	public TokenList getTokenList(String name) {
		for(TokenList list : lists) {
			if(list.getName().equals(name)) {
				return list;
			}
		}
		return null;
	}

	@Override
	public void save() {
		EntityManager.MAP.save(this);
	}
	
	@Override
	public String getName() {
		return name;
	}
}
