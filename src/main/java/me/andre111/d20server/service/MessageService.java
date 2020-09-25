package me.andre111.d20server.service;

import io.netty.channel.Channel;
import io.netty.channel.ChannelFuture;
import io.netty.channel.group.ChannelGroupFuture;
import me.andre111.d20common.message.IllegalMessageException;
import me.andre111.d20common.message.Message;
import me.andre111.d20common.message.MessageEncoder;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.handler.MessageHandler;

public abstract class MessageService {
	
	public static void recieve(Channel channel, Message message) {
		try {
			MessageHandler.handle(channel, message);
		} catch(IllegalMessageException e) {
			//reply = new ErrorMessage(e.getMessage());
		}
	}
	
	/**
	 * Sends a message to all clients joined into the game.
	 * If the map is not null, the message will only be send to players on that map.
	 * 
	 * @param message the message to send
	 * @param game    the game
	 * @param map     the map or null
	 */
	public static void send(Message message, Map map) {
		for(Profile profile : UserService.getAllConnectedProfiles()) {
			if(map != null && !map.equals(profile.getMap())) continue;
			
			send(message, profile);
		}
	}

	/**
	 * Sends a message to all clients logged into the provided profiles.
	 * 
	 * @param message  the message to send
	 * @param profiles the profiles
	 */
	public static void send(Message message, Profile... profiles) {
		for (Profile profile : profiles) {
			send(message, UserService.getChannelFor(profile));
		}
	}

	/**
	 * Sends a message to the provided channel.
	 * 
	 * @param message the message to send
	 * @param channel the channel
	 * @return a ChannelFuture for the operation
	 */
	public static ChannelFuture send(Message message, Channel channel) {
		if (message == null || channel == null || !channel.isActive())
			return null;

		// TODO: logging
		String json = MessageEncoder.encode(message);
		return channel.writeAndFlush(json);
	}

	/**
	 * Sends a message to all connected clients. Including clients that are not
	 * logged into any profile.
	 * 
	 * @param message the message to send
	 * @return a ChannelGroupFuture for the operation
	 */
	public static ChannelGroupFuture broadcast(Message message) {
		String json = MessageEncoder.encode(message);
		return UserService.getAllChannels().writeAndFlush(json);
	}
}
