package me.andre111.d20server.message.game;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.model.entity.game.GamePlayer;
import me.andre111.d20server.service.GameService;

public class EnterMap extends GameMessage implements GMOnly {
	private long playerID;
	private long mapID;
	
	@Override
	public Message handle() {
		if(getGame().hasMap(mapID)) {
			if(playerID == 0) {
				// set player map id and reset overridden values for all non gams
				getGame().setPlayerMapID(mapID);
				for(GamePlayer player : getGame().getPlayers()) {
					if(player.getRole() != GamePlayer.Role.GM) {
						player.setOverrideMapID(0);
					}
				}
				
				// (re)load maps for clients
				GameService.reloadMaps(getGame(), null);
			} else {
				// set player override map id and (re)load map
				GamePlayer player = getGame().getPlayer(playerID);
				if(player != null) {
					player.setOverrideMapID(mapID);;
					GameService.reloadMaps(getGame(), player);
				}
			}
		}
		
		return null;
	}
}
