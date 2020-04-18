package me.andre111.d20server.model.entity.map;

import me.andre111.d20server.model.BaseEntity;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.util.ReplacingLinkedHashSet;

public class Map extends BaseEntity {
	private String name;
	private MapSettings mapSettings = new MapSettings();

	private ReplacingLinkedHashSet<Wall> walls = new ReplacingLinkedHashSet<>();
	private ReplacingLinkedHashSet<Token> tokens = new ReplacingLinkedHashSet<>();
	
	public Map(String name) {
		this.name = name;
	}
	
	public MapSettings getSettings() {
		return mapSettings;
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

	@Override
	public void save() {
		EntityManager.MAP.save(this);
	}
	
	@Override
	public String getName() {
		return name;
	}
}
