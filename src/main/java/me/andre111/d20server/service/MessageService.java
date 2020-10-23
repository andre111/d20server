package me.andre111.d20server.service;

import java.util.List;

import io.netty.channel.Channel;
import io.netty.channel.ChannelFuture;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import me.andre111.d20common.message.IllegalMessageException;
import me.andre111.d20common.message.Message;
import me.andre111.d20common.message.MessageEncoder;
import me.andre111.d20common.model.Entity;
import me.andre111.d20common.model.profile.Profile;
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
	public static void send(Message message, Entity map) {
		String json = MessageEncoder.encode(message);
		
		for(Profile profile : UserService.getAllConnectedProfiles()) {
			if(map != null && !map.equals(profile.getMap())) continue;
			
			send(json, UserService.getChannelFor(profile));
		}
	}

	/**
	 * Sends a message to all clients logged into the provided profiles.
	 * 
	 * @param message  the message to send
	 * @param profiles the profiles
	 */
	public static void send(Message message, Profile... profiles) {
		String json = MessageEncoder.encode(message);
		
		for (Profile profile : profiles) {
			send(json, UserService.getChannelFor(profile));
		}
	}
	
	/**
	 * Sends a message to all clients logged into the provided profiles.
	 * 
	 * @param message  the message to send
	 * @param profiles the profiles
	 */
	public static void send(Message message, List<Profile> profiles) {
		String json = MessageEncoder.encode(message);
		
		for (Profile profile : profiles) {
			send(json, UserService.getChannelFor(profile));
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
		String json = MessageEncoder.encode(message);
		return send(json, channel);
	}
	
	public static ChannelFuture send(String json, Channel channel) {
		if (channel == null || !channel.isActive())
			return null;

		if(UserService.isWebsocket(channel)) {
			//TODO: might need splitting into multiple frames if text is to long?
			return channel.writeAndFlush(new TextWebSocketFrame(json));
		} else {
			return channel.writeAndFlush(json);
		}
	}
}
