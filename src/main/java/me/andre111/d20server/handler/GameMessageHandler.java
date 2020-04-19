package me.andre111.d20server.handler;

import java.util.ArrayList;
import java.util.List;

import io.netty.channel.Channel;
import me.andre111.d20common.message.Message;
import me.andre111.d20common.message.game.AddOrUpdateWall;
import me.andre111.d20common.message.game.AddToken;
import me.andre111.d20common.message.game.MovePlayerToMap;
import me.andre111.d20common.message.game.GameMessage;
import me.andre111.d20common.message.game.NewMap;
import me.andre111.d20common.message.game.RemoveToken;
import me.andre111.d20common.message.game.RemoveWall;
import me.andre111.d20common.message.game.SelectedTokens;
import me.andre111.d20common.message.game.UpdateMap;
import me.andre111.d20common.message.game.UpdateToken;
import me.andre111.d20common.message.game.chat.SendChatMessage;
import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.entity.map.Wall;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.service.ChatService;
import me.andre111.d20server.service.GameService;
import me.andre111.d20server.service.MessageService;

public abstract class GameMessageHandler {
	protected static Message handle(Channel channel, Profile profile, Game game, GamePlayer player, Map map, GameMessage message) {
		//TODO: implement
		if(message instanceof AddOrUpdateWall) {
			return handleAddOrUpdateWall(game, player, map, (AddOrUpdateWall) message);
		} else if(message instanceof AddToken) {
			return handleAddToken(game, player, map, (AddToken) message);
		} else if(message instanceof MovePlayerToMap) {
			return handleEnterMap(game, player, map, (MovePlayerToMap) message);
		} else if(message instanceof NewMap) {
			return handleNewMap(game, player, map, (NewMap) message);
		} else if(message instanceof RemoveToken) {
			return handleRemoveToken(game, player, map, (RemoveToken) message);
		} else if(message instanceof RemoveWall) {
			return handleRemoveWall(game, player, map, (RemoveWall) message);
		} else if(message instanceof SelectedTokens) {
			return handleSelectedTokens(game, player, map, (SelectedTokens) message);
		} else if(message instanceof UpdateMap) {
			return handleUpdateMap(game, player, map, (UpdateMap) message);
		} else if(message instanceof UpdateToken) {
			return handleUpdateToken(game, player, map, (UpdateToken) message);

		// --------------------
		} else if(message instanceof SendChatMessage) {
			return handleChatMessage(game, player, map, (SendChatMessage) message);
		} else {
			System.out.println("Warning: Recieved unhandled message: "+message);
			return null;
		}
	}
	
	private static Message handleAddOrUpdateWall(Game game, GamePlayer player, Map map, AddOrUpdateWall message) {
		Wall wall = message.getWall();
		if(map.getWall(wall.id()) == null) {
			wall.resetID(); // reset ID to generate one from the DB (TODO: only on server side!)
		}
		
		// add and save
		map.addOrUpdateWall(wall); // update wall and get correct id
		EntityManager.MAP.save(map);
		MessageService.send(message, game, map); // and broadcast change
		return null;
	}
	
	private static Message handleAddToken(Game game, GamePlayer player, Map map, AddToken message) {
		Token token = message.getToken();
		if(map.getToken(token.id()) == null) {
			token.resetID(); // reset ID to generate one from the DB (TODO: only on server side!)
		}
		
		// and and save
		map.addOrUpdateToken(token); // update token and get correct id //TODO: only add token, not update?
		EntityManager.MAP.save(map);
		MessageService.send(message, game, map); // and broadcast change
		return null;
	}
	
	private static Message handleEnterMap(Game game, GamePlayer player, Map map, MovePlayerToMap message) {
		long mapID = message.getMapID();
		long playerID = message.getPlayerID();
		if(game.hasMap(mapID)) {
			if(playerID == 0) {
				// set player map id and reset overridden values for all non gams
				game.setPlayerMapID(mapID);
				for(GamePlayer otherPlayer : game.getPlayers()) {
					if(otherPlayer.getRole() != GamePlayer.Role.GM) {
						otherPlayer.setOverrideMapID(0);
					}
				}
				
				// (re)load maps for clients
				GameService.reloadMaps(game, null);
			} else {
				// set player override map id and (re)load map
				GamePlayer otherPlayer = game.getPlayer(playerID);
				if(otherPlayer != null) {
					otherPlayer.setOverrideMapID(mapID);;
					GameService.reloadMaps(game, otherPlayer);
				}
			}
		}
		
		return null;
	}
	
	private static Message handleNewMap(Game game, GamePlayer player, Map map, NewMap message) {
		Map newMap = game.createMap(message.getName());
		EntityManager.MAP.save(newMap);
		EntityManager.GAME.save(game);
		GameService.updateMapList(game);
		return null;
	}
	
	private static Message handleRemoveToken(Game game, GamePlayer player, Map map, RemoveToken message) {
		map.removeToken(map.getToken(message.getTokenID()));
		EntityManager.MAP.save(map);
		MessageService.send(message, game, map);
		return null;
	}
	
	private static Message handleRemoveWall(Game game, GamePlayer player, Map map, RemoveWall message) {
		map.removeWall(map.getWall(message.getWallID()));
		EntityManager.MAP.save(map);
		MessageService.send(message, game, map);
		return null;
	}
	
	private static Message handleSelectedTokens(Game game, GamePlayer player, Map map, SelectedTokens message) {
		List<Long> selectedTokens = message.getSelectedTokens();
		if(selectedTokens == null) {
			selectedTokens = new ArrayList<>();
		}
		
		player.setSelectedTokens(selectedTokens);
		return null;
	}
	
	private static Message handleUpdateMap(Game game, GamePlayer player, Map map, UpdateMap message) {
		// determine access level
		Access accessLevel = map.getAccessLevel(player);
				
		// transfer values
		map.applyProperties(message.getProperties(), accessLevel);
		EntityManager.MAP.save(map);
		
		// broadcast new map properties (DO NOT REUSE MESSAGE, because clients do not apply access levels)
		MessageService.send(new UpdateMap(map), game, map);
		return null;
	}
	
	private static Message handleUpdateToken(Game game, GamePlayer player, Map map, UpdateToken message) {
		Token token = map.getToken(message.getTokenID());
		java.util.Map<String, Property> properties = message.getProperties();
		if(token == null || properties == null || properties.isEmpty()) return null;
		
		// determine access level
		Access accessLevel = token.getAccessLevel(player);
		
		// transfer values
		token.applyProperties(properties, accessLevel);
		EntityManager.MAP.save(map);
		
		// broadcast new token properties (DO NOT REUSE MESSAGE, because clients do not apply access levels)
		MessageService.send(new UpdateToken(token), game, map);
		return null;
	}
	
	

	// ---------------------------------------------------------
	private static Message handleChatMessage(Game game, GamePlayer player, Map map, SendChatMessage message) {
		ChatService.onMessage(game, player, message.getMessage());
		return null;
	}
}
