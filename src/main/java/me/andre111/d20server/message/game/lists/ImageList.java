package me.andre111.d20server.message.game.lists;

import java.util.Map;

public class ImageList extends IndexedListMessage {
	public ImageList(Map<Long, String> images) {
		super(images);
	}
}
