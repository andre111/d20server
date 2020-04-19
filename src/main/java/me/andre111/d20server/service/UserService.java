package me.andre111.d20server.service;

import java.util.ArrayList;
import java.util.Collection;

import com.google.common.collect.BiMap;
import com.google.common.collect.HashBiMap;

import io.netty.channel.Channel;
import io.netty.channel.group.ChannelGroup;
import io.netty.channel.group.DefaultChannelGroup;
import io.netty.util.concurrent.GlobalEventExecutor;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.model.EntityManager;

/**
 * Keeps track of all connections to the server, as well as the corresponding
 * profile if logged in.
 * 
 * @author André Schweiger
 */
public abstract class UserService {
	private static final ChannelGroup allChannels = new DefaultChannelGroup(GlobalEventExecutor.INSTANCE);
	private static final BiMap<Profile, Channel> channelMap = HashBiMap.create();
	private static final Object lock = new Object();

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
		EntityManager.PROFILE.save(profile);
		
		//TODO: remove test stuff
		System.out.println("SignIn: "+profile.id());
		GameService.joinGame(profile, GameService.getBaseGame());
		
		// TODO: logging, notify battles, ...
	}

	public static void onSignOut(Profile profile) {
		// TODO: logging, cleanup (exit room(s), cancel trades, notify battles, ...)
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

	public static Collection<Profile> getAllConnectedProfiles() {
		synchronized (lock) {
			return new ArrayList<>(channelMap.keySet());
		}
	}

	public static boolean isConnected(Profile profile) {
		return getChannelFor(profile) != null;
	}
	
	// Profile finding methods
	public static Profile findByEmail(String email) {
		return EntityManager.PROFILE.stream().filter(p -> p.getEmail().equals(email)).findAny().orElse(null);
	}
	public static Profile findByUsername(String username) {
		return EntityManager.PROFILE.stream().filter(p -> p.getUsername().equals(username)).findAny().orElse(null);
	}
}
