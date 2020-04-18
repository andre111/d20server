package me.andre111.d20server.message.game.lists;

import java.util.Map;

public class MapList extends IndexedListMessage {
	public MapList(Map<Long, String> maps) {
		super(maps);
	}
}
