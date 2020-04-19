package me.andre111.d20server.handler;

import io.netty.channel.Channel;
import me.andre111.d20common.message.IllegalMessageException;
import me.andre111.d20common.message.Message;
import me.andre111.d20common.message.account.UnauthenticatedMessage;
import me.andre111.d20common.message.game.GMOnly;
import me.andre111.d20common.message.game.GameMessage;
import me.andre111.d20common.message.game.NoMapRequired;
import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.service.GameService;
import me.andre111.d20server.service.UserService;

public abstract class MessageHandler {
	
	public static Message handle(Channel channel, Message message) {
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
			return handleGameMessage(channel, profile, (GameMessage) message);
		} else {
			return SimpleMessageHandler.handle(channel, profile, message);
		}
	}
	
	private static Message handleGameMessage(Channel channel, Profile profile, GameMessage message) {
		// check for game present and throw error when it does not exist
		Game game = GameService.getGame(profile);
		if(game == null) {
			throw new IllegalMessageException("Not in a game");
		}
		GamePlayer player = game.getPlayer(profile);
		if(player == null) {
			throw new IllegalMessageException("Not in a game due to internal server error");
		}
		Map map = game.getPlayerMap(player, EntityManager.MAP::find);
		if(!(message instanceof NoMapRequired)) {
			if(map == null) {
				throw new IllegalMessageException("No map loaded");
			}
		}
		
		// check for gm status and throw error if not present
		if (message instanceof GMOnly) {
			if(player.getRole() != GamePlayer.Role.GM) {
				throw new IllegalMessageException("This action can only be performed by GMs");
			}
		}
		
		// handle message
		return GameMessageHandler.handle(channel, profile, game, player, map, message);
	}
}
