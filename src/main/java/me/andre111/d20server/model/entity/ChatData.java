package me.andre111.d20server.model.entity;

import java.util.ArrayList;
import java.util.List;

import me.andre111.d20server.model.BaseEntity;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.model.entity.game.Game;

public class ChatData extends BaseEntity {
	private List<ChatEntry> entries = new ArrayList<>();
	
	public ChatData(Game game) {
		super(game.id());
	}
	
	@Override
	public void save() {
		EntityManager.CHAT.save(this);
	}
	
	public void append(ChatEntry entry) {
		entries.add(entry);
	}
	
	public List<ChatEntry> getEntries() {
		return entries;
	}
}
