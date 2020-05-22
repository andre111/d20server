package me.andre111.d20server.handler;

import java.util.ArrayList;
import java.util.List;

import io.netty.channel.Channel;
import me.andre111.d20common.message.game.MovePlayerToMap;
import me.andre111.d20common.message.game.ActionCommand;
import me.andre111.d20common.message.game.GameMessage;
import me.andre111.d20common.message.game.NewMap;
import me.andre111.d20common.message.game.PlayEffect;
import me.andre111.d20common.message.game.SelectedTokens;
import me.andre111.d20common.message.game.ShowImage;
import me.andre111.d20common.message.game.UpdateMapProperties;
import me.andre111.d20common.message.game.chat.SendChatMessage;
import me.andre111.d20common.message.game.index.RenameAudio;
import me.andre111.d20common.message.game.index.RenameImage;
import me.andre111.d20common.message.game.token.AddToken;
import me.andre111.d20common.message.game.token.RemoveToken;
import me.andre111.d20common.message.game.token.UpdateToken;
import me.andre111.d20common.message.game.token.UpdateTokenMacros;
import me.andre111.d20common.message.game.token.list.AddTokenList;
import me.andre111.d20common.message.game.token.list.RemoveTokenList;
import me.andre111.d20common.message.game.token.list.TokenListValue;
import me.andre111.d20common.message.game.token.list.UpdateTokenList;
import me.andre111.d20common.message.game.util.Ping;
import me.andre111.d20common.message.game.wall.AddOrUpdateWall;
import me.andre111.d20common.message.game.wall.RemoveWall;
import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.entity.map.TokenList;
import me.andre111.d20common.model.entity.map.Wall;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.service.ChatService;
import me.andre111.d20server.service.GameService;
import me.andre111.d20server.service.MessageService;

//TODO: move most code (except for mostly the access checks) to separate services (so stuff like addToken/removeToken can be reused by other code without duplication)
public abstract class GameMessageHandler {
	protected static void handle(Channel channel, Profile profile, Game game, GamePlayer player, Map map, GameMessage message) {
		//
		if(message instanceof MovePlayerToMap) {
			handleEnterMap(game, player, map, (MovePlayerToMap) message);
		} else if(message instanceof NewMap) {
			handleNewMap(game, player, map, (NewMap) message);
		} else if(message instanceof SelectedTokens) {
			handleSelectedTokens(game, player, map, (SelectedTokens) message);
		} else if(message instanceof UpdateMapProperties) {
			handleUpdateMap(game, player, map, (UpdateMapProperties) message);
		
		// TOKENS: --------------------
		} else if(message instanceof AddToken) {
			handleAddToken(game, player, map, (AddToken) message);
		} else if(message instanceof RemoveToken) {
			handleRemoveToken(game, player, map, (RemoveToken) message);
		} else if(message instanceof UpdateToken) {
			handleUpdateToken(game, player, map, (UpdateToken) message);
		} else if(message instanceof UpdateTokenMacros) {
			handleUpdateTokenMacros(game, player, map, (UpdateTokenMacros) message);
			
		// TOKEN-LISTS: --------------------
		} else if(message instanceof AddTokenList) {
			handleAddTokenList(game, player, map, (AddTokenList) message);
		} else if(message instanceof RemoveTokenList) {
			handleRemoveTokenList(game, player, map, (RemoveTokenList) message);
		} else if(message instanceof TokenListValue) {
			handleTokenListValue(game, player, map, (TokenListValue) message);
		} else if(message instanceof UpdateTokenList) {
			handleUpdateTokenList(game, player, map, (UpdateTokenList) message);
		
		// WALLS: --------------------
		} else if(message instanceof AddOrUpdateWall) {
			handleAddOrUpdateWall(game, player, map, (AddOrUpdateWall) message);
		} else if(message instanceof RemoveWall) {
			handleRemoveWall(game, player, map, (RemoveWall) message);
			
		// OTHERS: --------------------
		} else if(message instanceof RenameAudio) {
			handleRenameAudio(game, player, map, (RenameAudio) message);
		} else if(message instanceof RenameImage) {
			handleRenameImage(game, player, map, (RenameImage) message);
		} else if(message instanceof ShowImage) {
			handleShowImage(game, player, map, (ShowImage) message);
		} else if(message instanceof ActionCommand) {
			handleActionCommand(game, player, map, (ActionCommand) message);
			
			
		// CHAT: --------------------
		} else if(message instanceof SendChatMessage) {
			handleChatMessage(game, player, map, (SendChatMessage) message);

		// --------------------
		} else if(message instanceof Ping) {
			handlePingMessage(game, player, map, (Ping) message);
		} else {
			System.out.println("Warning: Recieved unhandled message: "+message);
		}
	}
	
	private static void handleEnterMap(Game game, GamePlayer player, Map map, MovePlayerToMap message) {
		long mapID = message.getMapID();
		long playerID = message.getPlayerID();
		if(game.hasMap(mapID)) {
			if(playerID == 0) {
				if(player.getRole() != GamePlayer.Role.GM) return;
				
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
				if(player.getRole() == GamePlayer.Role.GM || (playerID == player.getProfileID() && game.getMap(mapID, EntityManager.MAP::find).getPlayersCanEnter())) {
					// set player override map id and (re)load map
					GamePlayer otherPlayer = game.getPlayer(playerID);
					if(otherPlayer != null) {
						otherPlayer.setOverrideMapID(mapID);;
						GameService.reloadMaps(game, otherPlayer);
					}
				}
			}
		}
	}
	
	private static void handleNewMap(Game game, GamePlayer player, Map map, NewMap message) {
		Map newMap = game.createMap(message.getName());
		EntityManager.MAP.save(newMap);
		EntityManager.GAME.save(game);
		GameService.updateMapList(game);
	}
	
	private static void handleSelectedTokens(Game game, GamePlayer player, Map map, SelectedTokens message) {
		List<Long> selectedTokens = message.getSelectedTokens();
		if(selectedTokens == null) {
			selectedTokens = new ArrayList<>();
		}
		
		player.setSelectedTokens(selectedTokens);
	}
	
	private static void handleUpdateMap(Game game, GamePlayer player, Map map, UpdateMapProperties message) {
		// determine access level
		Access accessLevel = map.getAccessLevel(player);
				
		// transfer values
		map.applyProperties(message.getProperties(), accessLevel);
		EntityManager.MAP.save(map);
		
		// broadcast new map properties (DO NOT REUSE MESSAGE, because clients do not apply access levels)
		MessageService.send(new UpdateMapProperties(map), game, map);
		GameService.updateMapList(game);
	}
	

	// ---------------------------------------------------------
	private static void handleAddToken(Game game, GamePlayer player, Map map, AddToken message) {
		Token token = message.getToken();
		if(map.getToken(token.id()) == null) {
			token.resetID(); // reset ID to generate one from the DB
		}
		
		// and and save
		map.addOrUpdateToken(token); // update token and get correct id //TODO: only add token, not update?
		EntityManager.MAP.save(map);
		MessageService.send(message, game, map); // and broadcast change
	}
	private static void handleRemoveToken(Game game, GamePlayer player, Map map, RemoveToken message) {
		Token token = map.getToken(message.getTokenID());
		if(token == null) return;
		
		// remove token from lists
		for(TokenList list : map.getTokenLists()) {
			list.removeToken(token);
			MessageService.send(new TokenListValue(list, token, 0, true), game, map);
		}
		
		// remove token
		map.removeToken(token);
		EntityManager.MAP.save(map);
		MessageService.send(message, game, map);
	}
	private static void handleUpdateToken(Game game, GamePlayer player, Map map, UpdateToken message) {
		Token token = map.getToken(message.getTokenID());
		java.util.Map<String, Property> properties = message.getProperties();
		if(token == null || properties == null || properties.isEmpty()) return;
		
		// determine access level
		Access accessLevel = token.getAccessLevel(player);
		
		// transfer values
		token.applyProperties(properties, accessLevel);
		EntityManager.MAP.save(map);
		
		// broadcast new token properties (DO NOT REUSE MESSAGE, because clients do not apply access levels)
		MessageService.send(new UpdateToken(token), game, map);
	}
	private static void handleUpdateTokenMacros(Game game, GamePlayer player, Map map, UpdateTokenMacros message) {
		Token token = map.getToken(message.getTokenID());
		java.util.Map<String, String> macros = message.getMacros();
		if(token == null || macros == null) return;
		
		// determine access level
		Access accessLevel = token.getAccessLevel(player);
		
		if(token.canEditMacro(accessLevel)) {
			// transfer values
			token.setMacros(macros);
			EntityManager.MAP.save(map);
			
			// broadcast new token properties (DO NOT REUSE MESSAGE, because clients do not apply access levels)
			MessageService.send(new UpdateTokenMacros(token), game, map);
		}
	}
	
	
	// ---------------------------------------------------------
	private static void handleAddTokenList(Game game, GamePlayer player, Map map, AddTokenList message) {
		TokenList list = message.getTokenList();
		if(map.getTokenList(list.id()) == null) {
			list.resetID(); // reset ID to generate one from the DB
		}
		
		// add and save
		map.addOrUpdateTokenList(list);
		EntityManager.MAP.save(map);
		MessageService.send(message, game, map); // and broadcast change
	}
	private static void handleRemoveTokenList(Game game, GamePlayer player, Map map, RemoveTokenList message) {
		map.removeTokenList(map.getTokenList(message.getListID()));
		EntityManager.MAP.save(map);
		MessageService.send(message, game, map);
	}
	private static void handleTokenListValue(Game game, GamePlayer player, Map map, TokenListValue message) {
		TokenList list = map.getTokenList(message.getListID());
		Token token = map.getToken(message.getTokenID());
		if(list != null && token != null) {
			// determine access level
			Access accessLevel = list.getAccessLevel(player, token);
			if(list.canEdit(accessLevel)) {
				
				// apply change
				if(message.doReset()) {
					list.removeToken(token);
				} else {
					list.addOrUpdateToken(token, message.getValue());
				}
				
				EntityManager.MAP.save(map);
				MessageService.send(message, game, map); // and broadcast change
			}
		}
	}
	private static void handleUpdateTokenList(Game game, GamePlayer player, Map map, UpdateTokenList message) {
		TokenList list = map.getTokenList(message.getListID());
		java.util.Map<String, Property> properties = message.getProperties();
		if(list == null || properties == null || properties.isEmpty()) return;
		
		// determine access level
		Access accessLevel = list.getAccessLevel(player);
		
		// transfer values
		list.applyProperties(properties, accessLevel);
		EntityManager.MAP.save(map);
		
		// broadcast new tokenlist properties (DO NOT REUSE MESSAGE, because clients do not apply access levels)
		MessageService.send(new UpdateTokenList(list), game, map);
	}
	

	// ---------------------------------------------------------
	private static void handleAddOrUpdateWall(Game game, GamePlayer player, Map map, AddOrUpdateWall message) {
		Wall wall = message.getWall();
		if(map.getWall(wall.id()) == null) {
			wall.resetID(); // reset ID to generate one from the DB
		}
		
		// add and save
		map.addOrUpdateWall(wall); // update wall and get correct id
		EntityManager.MAP.save(map);
		MessageService.send(message, game, map); // and broadcast change
	}
	private static void handleRemoveWall(Game game, GamePlayer player, Map map, RemoveWall message) {
		map.removeWall(map.getWall(message.getWallID()));
		EntityManager.MAP.save(map);
		MessageService.send(message, game, map);
	}
	

	// ---------------------------------------------------------
	private static void handleRenameAudio(Game game, GamePlayer player, Map map, RenameAudio message) {
		EntityManager.AUDIO.rename(message.getAudioID(), message.getName());
		GameService.updateAudioList();
	}
	private static void handleRenameImage(Game game, GamePlayer player, Map map, RenameImage message) {
		EntityManager.IMAGE.rename(message.getImageID(), message.getName());
		GameService.updateImageList();
	}
	private static void handleShowImage(Game game, GamePlayer player, Map map, ShowImage message) {
		if(EntityManager.IMAGE.has(message.getImageID())) {
			MessageService.send(message, game, map);
		}
	}
	private static void handleActionCommand(Game game, GamePlayer player, Map map, ActionCommand message) {
		switch(message.getCommand()) {
		case ActionCommand.PING:
			MessageService.send(new PlayEffect("PING", message.getX(), message.getY(), 0, 1, true, player.getRole()==GamePlayer.Role.GM && message.isModified()), game, map);
			break;
		}
	}
	

	// ---------------------------------------------------------
	private static void handleChatMessage(Game game, GamePlayer player, Map map, SendChatMessage message) {
		ChatService.onMessage(game, player, message.getMessage());
	}
	private static void handlePingMessage(Game game, GamePlayer player, Map map, Ping message) {
		MessageService.send(message, EntityManager.PROFILE.find(player.getProfileID()));
	}
}
