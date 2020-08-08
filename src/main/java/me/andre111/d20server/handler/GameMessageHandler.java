package me.andre111.d20server.handler;

import java.util.ArrayList;
import java.util.List;

import io.netty.channel.Channel;
import me.andre111.d20common.message.game.MovePlayerToMap;
import me.andre111.d20common.message.game.ActionCommand;
import me.andre111.d20common.message.game.GameMessage;
import me.andre111.d20common.message.game.PlayEffect;
import me.andre111.d20common.message.game.SelectedTokens;
import me.andre111.d20common.message.game.ShowImage;
import me.andre111.d20common.message.game.actor.SetActorDefaultToken;
import me.andre111.d20common.message.game.chat.SendChatMessage;
import me.andre111.d20common.message.game.entity.AddEntity;
import me.andre111.d20common.message.game.entity.RemoveEntity;
import me.andre111.d20common.message.game.entity.UpdateEntityProperties;
import me.andre111.d20common.message.game.token.UpdateTokenMacros;
import me.andre111.d20common.message.game.token.list.TokenListValue;
import me.andre111.d20common.message.game.util.Ping;
import me.andre111.d20common.model.Entity;
import me.andre111.d20common.model.entity.Image;
import me.andre111.d20common.model.entity.actor.Actor;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.entity.map.TokenList;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20server.model.EntityManagers;
import me.andre111.d20server.model.ServerEntityManager;
import me.andre111.d20server.service.ChatService;
import me.andre111.d20server.service.GameService;
import me.andre111.d20server.service.MessageService;
import me.andre111.d20server.service.UserService;

public abstract class GameMessageHandler {
	protected static void handle(Channel channel, Profile profile, Map map, GameMessage message) {
		//
		if(message instanceof MovePlayerToMap) {
			handleMovePlayerToMap(profile, map, (MovePlayerToMap) message);
		} else if(message instanceof SelectedTokens) {
			handleSelectedTokens(profile, map, (SelectedTokens) message);

			// TOKENS: --------------------
		} else if(message instanceof UpdateTokenMacros) {
			handleUpdateTokenMacros(profile, map, (UpdateTokenMacros) message);

			// TOKEN-LISTS: --------------------
		} else if(message instanceof TokenListValue) {
			handleTokenListValue(profile, map, (TokenListValue) message);

			// ACTORS: --------------------
		} else if(message instanceof SetActorDefaultToken) {
			handleSetActorDefaultToken(profile, map, (SetActorDefaultToken) message);

			// OTHERS: --------------------
		} else if(message instanceof ShowImage) {
			handleShowImage(profile, map, (ShowImage) message);
		} else if(message instanceof ActionCommand) {
			handleActionCommand(profile, map, (ActionCommand) message);

			// ENTITIES: --------------------
		} else if(message instanceof AddEntity) {
			handleAddEntity(profile, map, (AddEntity) message);
		} else if(message instanceof RemoveEntity) {
			handleRemoveEntity(profile, map, (RemoveEntity) message);
		} else if(message instanceof UpdateEntityProperties) {
			handleUpdateEntityProperties(profile, map, (UpdateEntityProperties) message);

			// CHAT: --------------------
		} else if(message instanceof SendChatMessage) {
			handleChatMessage(profile, map, (SendChatMessage) message);

			// --------------------
		} else if(message instanceof Ping) {
			handlePingMessage(profile, map, (Ping) message);
		} else {
			System.out.println("Warning: Recieved unhandled message: "+message);
		}
	}

	private static void handleMovePlayerToMap(Profile profile, Map map, MovePlayerToMap message) {
		long mapID = message.getMapID();
		long playerID = message.getPlayerID();
		if(EntityManagers.get(Map.class).has(mapID)) {
			if(playerID == 0) {
				if(profile.getRole() != Profile.Role.GM) return;

				// set player map id and reset overridden values for all non gms
				for(Profile otherProfile : UserService.getAllProfiles()) {
					if(otherProfile.getRole() != Profile.Role.GM) {
						otherProfile.setCurrentMap(mapID);
						EntityManagers.get(Profile.class).add(otherProfile);
					}
				}

				// (re)load maps for clients
				GameService.reloadMaps(null);
			} else {
				if(profile.getRole() == Profile.Role.GM || (playerID == profile.id() && EntityManagers.get(Map.class).find(mapID).prop("playersCanEnter").getBoolean())) {
					// set player override map id and (re)load map
					Profile otherProfile = UserService.getProfile(playerID);
					if(otherProfile != null) {
						otherProfile.setCurrentMap(mapID);
						GameService.reloadMaps(otherProfile);
						EntityManagers.get(Profile.class).add(otherProfile);
					}
				}
			}
		}
	}

	private static void handleSelectedTokens(Profile profile, Map map, SelectedTokens message) {
		List<Long> selectedTokens = message.getSelectedTokens();
		if(selectedTokens == null) {
			selectedTokens = new ArrayList<>();
		}

		GameService.setSelectedTokens(profile, selectedTokens);
	}


	// ---------------------------------------------------------
	private static void handleUpdateTokenMacros(Profile profile, Map map, UpdateTokenMacros message) {
		Token token = EntityManagers.get(Token.class).find(message.getTokenID());
		java.util.Map<String, String> macros = message.getMacros();
		if(token == null || macros == null) return;

		// determine access level
		Access accessLevel = token.getAccessLevel(profile);

		if(token.prop("macroEdit").getAccessValue().ordinal() <= accessLevel.ordinal()) {
			// transfer values
			token.setMacros(macros);
			EntityManagers.get(Token.class).add(token);
		}
	}


	// ---------------------------------------------------------
	private static void handleTokenListValue(Profile profile, Map map, TokenListValue message) {
		TokenList list = EntityManagers.get(TokenList.class).find(message.getListID());
		Token token = EntityManagers.get(Token.class).find(message.getTokenID());
		if(list != null && token != null) {
			// determine access level
			Access accessLevel = list.getAccessLevel(profile, token);
			if(list.canEdit(accessLevel)) {

				// apply change
				if(message.doReset()) {
					list.removeToken(token.id());
				} else {
					list.addOrUpdateToken(token.id(), message.getValue());
				}

				EntityManagers.get(TokenList.class).add(list);
			}
		}
	}


	// ---------------------------------------------------------
	private static void handleSetActorDefaultToken(Profile profile, Map map, SetActorDefaultToken message) {
		Actor actor = EntityManagers.get(Actor.class).find(message.getActorID());
		Token token = GameService.getSelectedToken(map, profile, true);
		if(actor == null || token == null) return;
		
		// set default token
		actor.setDefaultToken(token);
		EntityManagers.get(Actor.class).add(actor);
	}


	// ---------------------------------------------------------
	private static void handleShowImage(Profile profile, Map map, ShowImage message) {
		if(EntityManagers.get(Image.class).has(message.getImageID())) {
			MessageService.broadcast(message);
		}
	}
	private static void handleActionCommand(Profile profile, Map map, ActionCommand message) {
		switch(message.getCommand()) {
		case ActionCommand.PING:
			MessageService.send(new PlayEffect("PING", message.getX(), message.getY(), 0, 1, true, profile.getRole()==Profile.Role.GM && message.isModified()), map);
			break;
		}
	}
	

	// ---------------------------------------------------------
	@SuppressWarnings({ "rawtypes", "unchecked" })
	private static void handleAddEntity(Profile profile, Map map, AddEntity message) {
		// search for manager, check access and reset id before adding if valid request
		ServerEntityManager manager = EntityManagers.get(message.getEntityClass());
		if(manager != null && manager.canAddRemove(profile)) {
			Entity entity = message.getEntity();
			entity.resetID();
			manager.add(entity);
		}
	}
	private static void handleRemoveEntity(Profile profile, Map map, RemoveEntity message) {
		// search for entity, check access and delete if valid request
		ServerEntityManager<?> manager = EntityManagers.get(message.getEntityClass());
		if(manager != null && manager.canAddRemove(profile)) {
			Entity entity = manager.find(message.getID());
			if(entity != null && entity.canEdit(profile)) {
				manager.remove(message.getID());
			}
		}
	}
	private static void handleUpdateEntityProperties(Profile profile, Map map, UpdateEntityProperties message) {
		// search for entity, check access and delete if valid request
		ServerEntityManager<?> manager = EntityManagers.get(message.getEntityClass());
		if(manager != null) {
			Entity entity = manager.find(message.getID());
			if(entity != null && entity.canEdit(profile)) {
				manager.updateProperties(entity.id(), message.getProperties(), entity.getAccessLevel(profile));
			}
		}
	}


	// ---------------------------------------------------------
	private static void handleChatMessage(Profile profile, Map map, SendChatMessage message) {
		ChatService.onMessage(profile, message.getMessage());
	}
	private static void handlePingMessage(Profile profile, Map map, Ping message) {
		MessageService.send(message, profile);
	}
}
