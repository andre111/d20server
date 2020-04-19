package me.andre111.d20server.model.entity.game;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import me.andre111.d20server.model.entity.profile.Profile;

public class GamePlayer {
    private long profile;
	private String nickname;
	
	private Role role = Role.PLAYER;
	private boolean joined = false;
	
	private transient long overrideMapID = -1;
	private transient List<Long> selectedTokens = new ArrayList<>();

	public GamePlayer(Profile profile) {
		this.profile = profile.id();
		this.nickname = profile.getUsername();
		this.role = Role.PLAYER;
	}
	
	public long getProfileID() {
		return profile;
	}
	public String getNickname() {
		return nickname;
	}
	
	public Role getRole() {
		return role;
	}
	
	public boolean isJoined() {
		return joined;
	}
	public void setJoined(boolean joined) {
		this.joined = joined;
	}
	
	public long getOverrideMapID() {
		return overrideMapID;
	}
	public void setOverrideMapID(long overrideMapID) {
		this.overrideMapID = overrideMapID;
	}
	
	public List<Long> getSelectedTokens() {
		return Collections.unmodifiableList(selectedTokens);
	}
	public void setSelectedTokens(List<Long> selectedTokens) {
		this.selectedTokens = selectedTokens;
	}

	@Override
	public String toString() {
		return nickname;
	}
	
	public static enum Role {
		PLAYER,
		GM;
	}
}
