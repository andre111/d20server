package me.andre111.d20server.message.game;

import java.util.ArrayList;
import java.util.List;

import me.andre111.d20server.message.Message;

public class SelectedTokens extends GameMessage {
	private List<Long> selectedTokens;
	
	@Override
	public Message handle() {
		if(selectedTokens == null) {
			selectedTokens = new ArrayList<>();
		}
		
		getPlayer().setSelectedTokens(selectedTokens);
		return null;
	}

}
