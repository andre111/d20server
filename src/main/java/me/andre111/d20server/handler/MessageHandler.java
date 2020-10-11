package me.andre111.d20server.handler;

import io.netty.channel.Channel;
import me.andre111.d20common.message.IllegalMessageException;
import me.andre111.d20common.message.Message;
import me.andre111.d20common.message.account.UnauthenticatedMessage;
import me.andre111.d20common.message.game.GMOnly;
import me.andre111.d20common.message.game.GameMessage;
import me.andre111.d20common.message.game.MapRequired;
import me.andre111.d20common.model.Entity;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20server.service.UserService;

public abstract class MessageHandler {
	
	public static void handle(Channel channel, Message message) {
		// get profile
		Profile profile = null;
		if (!(message instanceof UnauthenticatedMessage)) {
			profile = UserService.getProfileFor(channel);
			if (profile == null) {
				throw new IllegalMessageException("Not authenticated");
			}
		}
		
		// handle message
		if(message instanceof GameMessage) {
			handleGameMessage(channel, profile, (GameMessage) message);
		} else {
			SimpleMessageHandler.handle(channel, profile, message);
		}
	}
	
	private static void handleGameMessage(Channel channel, Profile profile, GameMessage message) {
		Entity map = profile.getMap();
		if(message instanceof MapRequired) {
			if(map == null) {
				throw new IllegalMessageException("No map loaded");
			}
		}
		
		// check for gm status and throw error if not present
		if (message instanceof GMOnly) {
			if(profile.getRole() != Profile.Role.GM) {
				throw new IllegalMessageException("This action can only be performed by GMs");
			}
		}
		
		// handle message
		GameMessageHandler.handle(channel, profile, map, message);
	}
}
