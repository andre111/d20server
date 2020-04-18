package me.andre111.d20server.message.game.lists;

import java.util.Map;

import me.andre111.d20server.message.Message;

public class IndexedListMessage extends Message {
	private Map<Long, String> list;
	
	public IndexedListMessage(Map<Long, String> list) {
		this.list = list;
	}
	
	public Map<Long, String> getIndexedList() {
		return list;
	}
}
