package me.andre111.d20server.model.entity.game;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;

import me.andre111.d20server.model.BaseEntity;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.model.entity.ChatData;
import me.andre111.d20server.model.entity.map.Map;
import me.andre111.d20server.model.entity.profile.Profile;
import me.andre111.d20server.util.PostLoad;

public class Game extends BaseEntity implements PostLoad {
	private List<GamePlayer> players = new ArrayList<>();
	private List<Long> maps = new ArrayList<>();
	private long playerMapID = -1;
	
	private transient java.util.Map<Long, Map> loadedMaps = new HashMap<>();
	private transient ChatData chatData;
	
	@Override
	public void postLoad() {
		// add atleast one map
		if(maps.isEmpty()) {
			Map map = new Map("New Map");
			map.save();
			maps.add(map.id());
			loadedMaps.put(map.id(), map);
		}
		if(getMap(playerMapID) == null) {
			playerMapID = loadedMaps.values().iterator().next().id();
		}
		
		// load chat data
		chatData = EntityManager.CHAT.find(id());
		if(chatData == null) {
			chatData = new ChatData(this);
		}
		
		// save(); //TODO: cannot save from postLoad as manager is not yet registered
	}

	@Override
	public void save() {
		EntityManager.GAME.save(this);
	}
	
	
	public void join(Profile profile) {
		GamePlayer player = getPlayer(profile);
		if(player == null) {
			player = new GamePlayer(profile);
			players.add(player);
			save();
		}
		
		player.setJoined(true);
	}
	public void leave(Profile profile) {
		GamePlayer player = getPlayer(profile);
		if(player != null) {
			player.setJoined(false);
		}
	}
	
	public List<GamePlayer> getPlayers() {
		return Collections.unmodifiableList(players);
	}
	public GamePlayer getPlayer(Profile profile) {
		return getPlayer(profile.id());
	}
	public GamePlayer getPlayer(long profileID) {
		for(GamePlayer player : players) {
			if(player.getProfileID() == profileID) {
				return player;
			}
		}
		return null;
	}
	
	public void setPlayerMapID(long mapID) {
		if(hasMap(mapID)) {
			playerMapID = mapID;
		}
	}
	
	public void createMap(String name) {
		Map map = new Map(name);
		maps.add(map.id());
		loadedMaps.put(map.id(), map);
		map.save();
		save();
	}
	public List<Long> getMaps() {
		return Collections.unmodifiableList(maps);
	}
	public boolean hasMap(long id) {
		for(long mapID : maps) {
			if(mapID == id) {
				return true;
			}
		}
		return false;
	}
	public Map getMap(long id) {
		// do NOT load maps that are not part of this game
		if(!hasMap(id)) return null;
		
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
	public Map getPlayerMap(GamePlayer player) {
		long mapID = playerMapID;
		if(player.getOverrideMapID() > 0 && hasMap(player.getOverrideMapID())) {
			mapID = player.getOverrideMapID();
		}
		
		return getMap(mapID);
	}
	
	public ChatData getChatData() {
		return chatData;
	}
}
