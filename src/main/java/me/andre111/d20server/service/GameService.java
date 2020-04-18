package me.andre111.d20server.service;

import java.util.HashMap;
import java.util.Map;

import me.andre111.d20server.message.game.LoadMap;
import me.andre111.d20server.message.game.PlayerList;
import me.andre111.d20server.message.game.lists.ImageList;
import me.andre111.d20server.message.game.lists.MapList;
import me.andre111.d20server.message.game.EnterGame;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.model.entity.game.Game;
import me.andre111.d20server.model.entity.game.GamePlayer;
import me.andre111.d20server.model.entity.profile.Profile;

public abstract class GameService {
	//TODO: remove this and use an actual game creation and joining system
	private static Game baseGame;
	private static Map<Profile, Game> gameMap = new HashMap<>();
	
	public static void init() {
		baseGame = EntityManager.GAME.findFirst();
		if(baseGame == null) {
			baseGame = new Game();
			baseGame.postLoad();
			baseGame.save();
		}
	}
	
	public static void joinGame(Profile profile, Game game) {
		// leave current game
		leaveGame(profile);
		
		// join new game
		gameMap.put(profile, game);
		game.join(profile);

		updateClientState(profile);
	}
	
	public static void updateClientState(Profile profile) {
		Game game = gameMap.get(profile);
		if(game == null) return;
		
		// send enter message -> moves client into main state and sets client role (PLAYER/GM)
		MessageService.send(new EnterGame(game.getPlayer(profile)), profile);
		
		// update players
		MessageService.send(new PlayerList(game.getPlayers()), game, null);
		
		//TODO: send gamestate to player (->LoadMap message and last X chat entries)
		GamePlayer player = game.getPlayer(profile);
		me.andre111.d20server.model.entity.map.Map map = game.getPlayerMap(player);
		if(map != null) {
			MessageService.send(new LoadMap(map), profile);
		}
		updateImageList();
		updateMapList(game);
		ChatService.sendHistory(game, player, 100);
	}
	
	public static void leaveGame(Profile profile) {
		Game game = gameMap.remove(profile);
		if(game != null) {
			game.leave(profile);
			
			// update players
			MessageService.send(new PlayerList(game.getPlayers()), game, null);
		}
	}
	
	public static void updateImageList() {
		for(Profile profile : gameMap.keySet()) {
			Game game = gameMap.get(profile);
			GamePlayer player = game.getPlayer(profile);
			
			if(player.getRole() == GamePlayer.Role.GM && player.isJoined()) {
				MessageService.send(new ImageList(EntityManager.IMAGE.getIndex()), profile);
			}
		}
	}
	public static void updateMapList(Game game) {
		for(Profile profile : gameMap.keySet()) {
			GamePlayer player = game.getPlayer(profile);
			
			if(player.getRole() == GamePlayer.Role.GM && player.isJoined()) {
				Map<Long, String> mapIndex = EntityManager.MAP.getIndex();
				Map<Long, String> mapMap = new HashMap<>();
				for(long mapID : game.getMaps()) {
					mapMap.put(mapID, mapIndex.get(mapID));
				}
				MessageService.send(new MapList(mapMap), profile);
			}
		}
	}
	
	public static void reloadMaps(Game game, GamePlayer player) {
		if(player == null) {
			// update all players
			for(Profile profile : gameMap.keySet()) {
				player = game.getPlayer(profile);
				
				me.andre111.d20server.model.entity.map.Map map = game.getPlayerMap(player);
				if(map != null) {
					MessageService.send(new LoadMap(map), profile);
				}
			}
		} else {
			// update single player
			me.andre111.d20server.model.entity.map.Map map = game.getPlayerMap(player);
			if(map != null) {
				MessageService.send(new LoadMap(map), EntityManager.PROFILE.find(player.getProfileID()));
			}
		}
	}
	
	public static Game getGame(Profile profile) {
		return gameMap.get(profile);
	}
	
	public static Game getBaseGame() {
		return baseGame;
	}
}
