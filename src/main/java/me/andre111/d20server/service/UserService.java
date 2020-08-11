package me.andre111.d20server.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

import com.google.common.collect.BiMap;
import com.google.common.collect.HashBiMap;

import io.netty.channel.Channel;
import io.netty.channel.group.ChannelGroup;
import io.netty.channel.group.DefaultChannelGroup;
import io.netty.util.concurrent.GlobalEventExecutor;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.model.EntityManagers;

/**
 * Keeps track of all connections to the server, as well as the corresponding
 * profile if logged in.
 * 
 * @author André Schweiger
 */
public abstract class UserService {
	private static final ChannelGroup allChannels = new DefaultChannelGroup(GlobalEventExecutor.INSTANCE);
	private static final Map<Long, Profile> allProfiles = new HashMap<>();
	private static final BiMap<Profile, Channel> channelMap = HashBiMap.create();
	private static final Object lock = new Object();
	static {
		// load all profiles
		EntityManagers.get(Profile.class).all().forEach(p -> {
			p.setConnected(false);
			allProfiles.put(p.id(), p);
		});
	}

	/**
	 * Call whenever a new connection to the server is made. Adds the channel to the
	 * tracking list and sends any "welcome messages".
	 * 
	 * @param channel the newly connected channel
	 */
	public static void onConnect(Channel channel) {
		synchronized (lock) {
			allChannels.add(channel);
		}
		// TODO: send welcome message/server info
		System.out.println("Connected");
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

		synchronized (lock) {
			allChannels.remove(channel);
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
		EntityManagers.get(Profile.class).add(profile);
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

	public static ChannelGroup getAllChannels() {
		return allChannels;
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
	
	// Profile finding methods
	public static Profile findByEmail(String email) {
		return allProfiles.values().stream().filter(p -> p.getEmail().equals(email)).findAny().orElse(null);
	}
	public static Profile findByUsername(String username) {
		return allProfiles.values().stream().filter(p -> p.getUsername().equals(username)).findAny().orElse(null);
	}
}
