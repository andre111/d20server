package me.andre111.d20server.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import me.andre111.d20common.message.game.EnterGame;
import me.andre111.d20common.message.game.EnterMap;
import me.andre111.d20common.message.game.PlayerList;
import me.andre111.d20common.message.game.entity.AddEntity;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.model.EntityManagers;

public abstract class GameService {
	private static java.util.Map<Long, ProfileStatus> joinedProfiles = new HashMap<>();
	
	public static void init() {
		// add atleast one map
		if(EntityManagers.get(Map.class).all().isEmpty()) {
			Map map = new Map("New Map");
			EntityManagers.get(Map.class).add(map);
		}
		
		// reset player states
		joinedProfiles.clear();
	}
	
	public static void joinGame(Profile profile) {
		// leave current game
		if(joinedProfiles.containsKey(profile.id())) leaveGame(profile);

		// update state before joining into game (-> do not recieve messages before loading is finished?)
		updateClientState(profile);
		
		// join new game
		joinedProfiles.put(profile.id(), new ProfileStatus());
	}
	
	public static void updateClientState(Profile profile) {
		// sync data -> moves client into loading state
		EntityManagers.fullSync(profile);
		
		// send enter message -> moves client into main state and sets client role (PLAYER/GM)
		MessageService.send(new EnterGame(profile), profile);
		
		// update players (to all)
		MessageService.send(new PlayerList(UserService.getAllProfiles()), (Map) null);
		
		//TODO: send gamestate (to player) (->LoadMap message, last X chat entries, ...)
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
		List<Profile> profiles = profile != null ? List.of(profile) : UserService.getAllConnectedProfiles();
		
		// update all players
		for(Profile otherProfile : profiles) {
			Map map = getPlayerMap(otherProfile);
			if(map != null) {
				MessageService.send(new AddEntity(map), otherProfile); // send map because client could have no independent access
				MessageService.send(new EnterMap(map), otherProfile);
			}
		}
	}

	
	public static Map getPlayerMap(Profile profile) {
		long mapID = profile.getCurrentMap();
		return EntityManagers.get(Map.class).find(mapID);
	}
	
	public static Token getSelectedToken(Map map, Profile profile, boolean forceSingle) {
		List<Long> selectedTokens = joinedProfiles.get(profile.id()).selectedTokens;
		if(selectedTokens == null || selectedTokens.isEmpty()) return null;
		if(forceSingle && selectedTokens.size() != 1) return null;
		
		Token token = EntityManagers.get(Token.class).find(selectedTokens.get(0));
		return token;
	}
	public static void setSelectedTokens(Profile profile, List<Long> selectedTokens) {
		joinedProfiles.get(profile.id()).selectedTokens = selectedTokens;
	}
	
	private static final class ProfileStatus {
		private List<Long> selectedTokens = new ArrayList<>();
	}
}
