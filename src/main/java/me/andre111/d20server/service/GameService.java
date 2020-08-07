package me.andre111.d20server.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import me.andre111.d20common.message.game.EnterGame;
import me.andre111.d20common.message.game.LoadMap;
import me.andre111.d20common.message.game.PlayerList;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.model.EntityManager;

public abstract class GameService {
	private static java.util.Map<Long, ProfileStatus> joinedProfiles = new HashMap<>();
	
	private static long baseMapID = -1;
	private static java.util.Map<Long, Map> loadedMaps = new HashMap<>();
	
	public static void init() {
		// add atleast one map
		if(EntityManager.MAP.getIndex().isEmpty()) {
			Map map = new Map("New Map");
			EntityManager.MAP.save(map);
		}
		if(getMap(getBaseMapID()) == null) {
			setBaseMapID(EntityManager.MAP.getIndex().keySet().iterator().next());
		}
		
		// reset player states
		joinedProfiles.clear();
	}
	
	public static void joinGame(Profile profile) {
		// leave current game
		leaveGame(profile);
		
		// join new game
		joinedProfiles.put(profile.id(), new ProfileStatus());

		updateClientState(profile);
	}
	
	public static void updateClientState(Profile profile) {
		// send enter message -> moves client into main state and sets client role (PLAYER/GM)
		MessageService.send(new EnterGame(profile), profile);
		
		// update players (to all)
		MessageService.send(new PlayerList(UserService.getAllProfiles()), (Map) null);
		
		//TODO: send gamestate (to player) (->LoadMap message, last X chat entries, ...)
		EntityManager.syncIndices(profile);
		reloadMaps(profile);
		ChatService.sendHistory(profile, 200);
		ChatService.appendNote(profile.getName()+" joined!");
	}
	
	public static void leaveGame(Profile profile) {
		joinedProfiles.remove(profile.id());
		
		// update players
		MessageService.send(new PlayerList(UserService.getAllProfiles()), (Map) null);
		ChatService.appendNote(profile.getName()+" left!");
	}
	
	public static boolean isJoined(Profile profile) {
		return joinedProfiles.containsKey(profile.id());
	}
	
	
	
	public static void reloadMaps(Profile profile) {
		if(profile == null) {
			// update all players
			for(Profile otherProfile : UserService.getAllConnectedProfiles()) {
				Map map = getPlayerMap(otherProfile);
				if(map != null) {
					MessageService.send(new LoadMap(map), otherProfile);
				}
			}
		} else {
			// update single player
			Map map = getPlayerMap(profile);
			if(map != null) {
				MessageService.send(new LoadMap(map), profile);
			}
		}
	}


	
	public static long getBaseMapID() {
		return baseMapID;
	}
	
	public static void setBaseMapID(long mapID) {
		baseMapID = mapID;
	}
	
	public static Map getMap(long id) {
		// load map
		if(!loadedMaps.containsKey(id)) {
			Map map = EntityManager.MAP.find(id);
			if(map != null) {
				loadedMaps.put(map.id(), map);
			}
		}
		
		// return
		return loadedMaps.get(id);
	}
	public static Map getPlayerMap(Profile profile) {
		long mapID = getBaseMapID();
		ProfileStatus status = joinedProfiles.get(profile.id());
		if(status != null && status.overrideMapID > 0) {
			mapID = status.overrideMapID;
		}
		
		return getMap(mapID);
	}
	public static void setPlayerOverrideMapID(Profile profile, long overrideMapID) {
		joinedProfiles.get(profile.id()).overrideMapID = overrideMapID;
	}
	
	public static Token getSelectedToken(Map map, Profile profile, boolean forceSingle) {
		List<Long> selectedTokens = joinedProfiles.get(profile.id()).selectedTokens;
		if(selectedTokens == null || selectedTokens.isEmpty()) return null;
		if(forceSingle && selectedTokens.size() != 1) return null;
		
		Token token = map.getToken(selectedTokens.get(0));
		return token;
	}
	public static void setSelectedTokens(Profile profile, List<Long> selectedTokens) {
		joinedProfiles.get(profile.id()).selectedTokens = selectedTokens;
	}
	
	private static final class ProfileStatus {
		private long overrideMapID = -1;
		private List<Long> selectedTokens = new ArrayList<>();
	}
}
