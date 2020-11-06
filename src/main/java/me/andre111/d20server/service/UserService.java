package me.andre111.d20server.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.regex.Pattern;

import com.google.common.collect.BiMap;
import com.google.common.collect.HashBiMap;
import com.google.gson.reflect.TypeToken;

import io.netty.channel.Channel;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.util.Utils;

/**
 * Keeps track of all connections to the server, as well as the corresponding
 * profile if logged in.
 * 
 * @author André Schweiger
 */
public abstract class UserService {
	private static final Map<Long, Profile> allProfiles = new HashMap<>();
	private static final BiMap<Profile, Channel> channelMap = HashBiMap.create();
	private static final Map<Channel, Boolean> isWebsocketMap = new HashMap<>();
	private static final Object lock = new Object();
	static {
		Map<Long, Profile> profiles = Utils.readJson("profiles", TypeToken.getParameterized(Map.class, Long.class, Profile.class).getType());
		for(Profile profile : profiles.values()) {
			profile.setConnected(false);
			allProfiles.put(profile.id(), profile);
		}
	}
	
	public static void addAndSave(Profile profile) {
		allProfiles.put(profile.id(), profile);
		Utils.backupJson("profiles");
		Utils.saveJson("profiles", allProfiles);
	}
	
	public static void createProfile(String username, String accesskey, Profile.Role role) {
		// remove outer whitespace
		username = username.trim();
		accesskey = accesskey.trim();

		// validate
		Pattern NAME_PATTERN = Pattern.compile("\\w{3,}");
		if(!NAME_PATTERN.matcher(username).matches()) {
			throw new IllegalArgumentException("Invalid name.");
		}
		if(accesskey.length() < 5) {
			throw new IllegalArgumentException("Accesskey cannot be shorter than 5 characters.");
		}

		// check for existing profiles
		if(UserService.findByUsername(username) != null) {
			throw new IllegalArgumentException("Name taken.");
		}

		// create profile and save
		Profile profile = new Profile(accesskey, username, role);
		UserService.addAndSave(profile);
	}

	/**
	 * Call whenever a new connection to the server is made. Adds the channel to the
	 * tracking list and sends any "welcome messages".
	 * 
	 * @param channel the newly connected channel
	 */
	public static void onConnect(Channel channel, boolean isWebsocket) {
		// TODO: send welcome message/server info
		System.out.println("Connected");
		
		// track channel type
		synchronized (lock) {
			isWebsocketMap.put(channel, isWebsocket);
		}
	}

	/**
	 * Call whenever a channel disconnects. Logs out the corresponding Profile and
	 * removes the channel from the tracking list.
	 * 
	 * @param channel the disconnected channel
	 */
	public static void onDisconnect(Channel channel) {
		Profile profile = getProfileFor(channel);
		if (profile != null) {
			onSignOut(profile);
		}
		
		synchronized(lock) {
			isWebsocketMap.remove(channel);
		}

		System.out.println("Disconnected");
	}

	public static void onSignIn(Profile profile, Channel channel) {
		synchronized (lock) {
			Profile existingProfile = channelMap.inverse().remove(channel);
			if (existingProfile != null) {
				// TODO: log/warn? of logging in with a new profile on a channel without logging
				// out first?
			}
			
			// disconnect eventual existing connection for this profile
			Channel oldChannel = channelMap.put(profile, channel);
			if (oldChannel != null && !oldChannel.equals(channel)) {
				// TODO: log/warn logging in from a different location while still logged in?
				oldChannel.disconnect();
			}
		}
		
		// save lastLogin time and log
		profile.setLastLogin();
		addAndSave(profile);
		profile.setConnected(true);
		
		System.out.println("SignIn: "+profile.id());
		GameService.joinGame(profile);
	}

	public static void onSignOut(Profile profile) {
		// TODO: logging
		profile.setConnected(false);
		GameService.leaveGame(profile);
		
		synchronized (lock) {
			channelMap.remove(profile);
		}
	}

	public static Channel getChannelFor(Profile profile) {
		synchronized (lock) {
			return channelMap.get(profile);
		}
	}

	public static Profile getProfileFor(Channel channel) {
		synchronized (lock) {
			return channelMap.inverse().get(channel);
		}
	}
	
	public static List<Profile> getAllProfiles() {
		synchronized (lock) {
			return new ArrayList<>(allProfiles.values());
		}
	}

	public static List<Profile> getAllConnectedProfiles() {
		synchronized (lock) {
			return new ArrayList<>(channelMap.keySet());
		}
	}
	
	public static Profile getProfile(long id) {
		synchronized (lock) {
			return allProfiles.get(id);
		}
	}
	
	public static void forEach(Consumer<Profile> action) {
		getAllConnectedProfiles().forEach(action);
	}

	public static boolean isConnected(Profile profile) {
		return getChannelFor(profile) != null;
	}
	
	public static boolean isWebsocket(Channel channel) {
		synchronized(lock) {
			return isWebsocketMap.get(channel);
		}
	}
	
	// Profile finding methods
	public static Profile findByUsername(String username) {
		return allProfiles.values().stream().filter(p -> p.getUsername().equals(username)).findAny().orElse(null);
	}
}
