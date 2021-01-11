package me.andre111.d20server.handler;

import java.util.ArrayList;
import java.util.List;

import io.netty.channel.Channel;
import me.andre111.d20common.message.game.MovePlayerToMap;
import me.andre111.d20common.D20Common;
import me.andre111.d20common.message.game.ActionCommand;
import me.andre111.d20common.message.game.GameMessage;
import me.andre111.d20common.message.game.PlayEffect;
import me.andre111.d20common.message.game.PlayerList;
import me.andre111.d20common.message.game.SelectedTokens;
import me.andre111.d20common.message.game.SetPlayerColor;
import me.andre111.d20common.message.game.actor.SetActorDefaultToken;
import me.andre111.d20common.message.game.chat.SendChatMessage;
import me.andre111.d20common.message.game.entity.AddEntity;
import me.andre111.d20common.message.game.entity.RemoveEntity;
import me.andre111.d20common.message.game.entity.UpdateEntityProperties;
import me.andre111.d20common.message.game.token.list.TokenListValue;
import me.andre111.d20common.message.game.util.EntityLoading;
import me.andre111.d20common.message.game.util.Ping;
import me.andre111.d20common.model.Entity;
import me.andre111.d20common.model.EntityManager;
import me.andre111.d20common.model.TokenListHelper;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20server.model.ServerEntityManager;
import me.andre111.d20server.service.ChatService;
import me.andre111.d20server.service.GameService;
import me.andre111.d20server.service.MessageService;
import me.andre111.d20server.service.UserService;

public abstract class GameMessageHandler {
	protected static void handle(Channel channel, Profile profile, Entity map, GameMessage message) {
		//
		if(message instanceof MovePlayerToMap) {
			handleMovePlayerToMap(profile, map, (MovePlayerToMap) message);
		} else if(message instanceof SelectedTokens) {
			handleSelectedTokens(profile, map, (SelectedTokens) message);

			// TOKEN-LISTS: --------------------
		} else if(message instanceof TokenListValue) {
			handleTokenListValue(profile, map, (TokenListValue) message);

			// ACTORS: --------------------
		} else if(message instanceof SetActorDefaultToken) {
			handleSetActorDefaultToken(profile, map, (SetActorDefaultToken) message);

			// OTHERS: --------------------
		} else if(message instanceof ActionCommand) {
			handleActionCommand(profile, map, (ActionCommand) message);
		} else if(message instanceof PlayEffect) {
			handlePlayEffect(profile, map, (PlayEffect) message);
		} else if(message instanceof SetPlayerColor) {
			handleSetPlayerColor(profile, map, (SetPlayerColor) message);

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
		} else if(message instanceof EntityLoading) {
			// discard client callbacks for now
		} else {
			System.out.println("Warning: Recieved unhandled message: "+message);
		}
	}

	private static void handleMovePlayerToMap(Profile profile, Entity map, MovePlayerToMap message) {
		long mapID = message.getMapID();
		long playerID = message.getPlayerID();
		if(D20Common.getEntityManager("map").has(mapID)) {
			if(playerID == 0) {
				if(profile.getRole() != Profile.Role.GM) return;

				// set player map id and reset overridden values for all non gms
				for(Profile otherProfile : UserService.getAllProfiles()) {
					if(otherProfile.getRole() != Profile.Role.GM) {
						otherProfile.setCurrentMap(mapID);
						UserService.addAndSave(otherProfile);
					}
				}

				// (re)load maps for clients
				GameService.reloadMaps(null);
			} else {
				if(profile.getRole() == Profile.Role.GM || (playerID == profile.id() && D20Common.getEntityManager("map").find(mapID).prop("playersCanEnter").getBoolean())) {
					// set player override map id and (re)load map
					Profile otherProfile = UserService.getProfile(playerID);
					if(otherProfile != null) {
						otherProfile.setCurrentMap(mapID);
						GameService.reloadMaps(otherProfile);
						UserService.addAndSave(otherProfile);
					}
				}
			}
		}
	}

	private static void handleSelectedTokens(Profile profile, Entity map, SelectedTokens message) {
		List<Long> selectedTokens = message.getSelectedTokens();
		if(selectedTokens == null) {
			selectedTokens = new ArrayList<>();
		}

		profile.setSelectedTokens(selectedTokens);
	}


	// ---------------------------------------------------------
	private static void handleTokenListValue(Profile profile, Entity map, TokenListValue message) {
		Entity list = D20Common.getEntityManager("token_list").find(message.getListID());
		Entity token = D20Common.getEntityManager("token").find(message.getTokenID());
		if(list != null && token != null) {
			// determine access level
			Access accessLevel = TokenListHelper.getAccessLevel(profile, list, token);
			if(list.canEdit(accessLevel)) {
				// apply change
				if(message.doReset()) {
					TokenListHelper.removeToken(list, token.id());
				} else {
					TokenListHelper.addOrUpdateToken(list, token.id(), message.getValue(), accessLevel == Access.GM && message.isHidden());
				}

				D20Common.getEntityManager("token_list").add(list);
			}
		}
	}


	// ---------------------------------------------------------
	private static void handleSetActorDefaultToken(Profile profile, Entity map, SetActorDefaultToken message) {
		if(profile.getRole() != Profile.Role.GM) return;
		
		Entity actor = D20Common.getEntityManager("actor").find(message.getActorID());
		Entity token = profile.getSelectedToken(true);
		if(actor == null || token == null) return;
		
		// remove old default token
		EntityManager em = D20Common.getEntityManager("token");
		em.remove(actor.prop("defaultToken").getLong());
		
		// save token clone
		token = token.clone();
		token.resetID();
		token.prop("map").setLong(-1);
		em.add(token);
		
		// add default token
		actor.prop("defaultToken").setLong(token.id());
		D20Common.getEntityManager("actor").add(actor);
	}


	// ---------------------------------------------------------
	private static void handleActionCommand(Profile profile, Entity map, ActionCommand message) {
		// create new command instance with set sender and gm state
		long sender = profile.id();
		boolean gm = profile.getRole() == Profile.Role.GM;
		ActionCommand command = new ActionCommand(message.getCommand(), message.getID(), message.getX(), message.getY(), message.isModified(), message.getText(), sender, gm);
		
		// broadcast to all clients
		MessageService.send(command, UserService.getAllConnectedProfiles());
	}
	private static void handlePlayEffect(Profile profile, Entity map, PlayEffect message) {
		// send to all players in map (and only allow camera focus for gms)
		MessageService.send(new PlayEffect(message.getEffect(), message.getX(), message.getY(), message.getRotation(), message.getScale(), message.isAboveOcclusion(), profile.getRole()==Profile.Role.GM && message.isFocusCamera(), message.getParameters()), map);
	}
	private static void handleSetPlayerColor(Profile profile, Entity map, SetPlayerColor message) {
		profile.setColor(message.getColor());
		UserService.addAndSave(profile);
		
		// update players (to all)
		MessageService.send(new PlayerList(UserService.getAllProfiles()), (Entity) null);
	}
	

	// ---------------------------------------------------------
	private static void handleAddEntity(Profile profile, Entity map, AddEntity message) {
		// search for manager, check access and reset id before adding if valid request
		ServerEntityManager manager = (ServerEntityManager) D20Common.getEntityManager(message.getEntity().getType());
		if(manager != null) {
			Entity entity = message.getEntity();
			if(manager.canAddRemove(profile, entity)) {
				entity.resetID();
				manager.add(entity);
			}
		}
	}
	private static void handleRemoveEntity(Profile profile, Entity map, RemoveEntity message) {
		// search for entity, check access and delete if valid request
		ServerEntityManager manager = (ServerEntityManager) D20Common.getEntityManager(message.getType());
		if(manager != null) {
			Entity entity = manager.find(message.getID());
			if(entity != null && entity.canEdit(profile) && manager.canAddRemove(profile, entity)) {
				manager.remove(message.getID());
			}
		}
	}
	private static void handleUpdateEntityProperties(Profile profile, Entity map, UpdateEntityProperties message) {
		// search for entity, check access and update if valid request
		ServerEntityManager manager = (ServerEntityManager) D20Common.getEntityManager(message.getType());
		if(manager != null) {
			Entity entity = manager.find(message.getID());
			if(entity != null && entity.canEdit(profile)) {
				manager.updateProperties(entity.id(), message.getProperties(), entity.getAccessLevel(profile));
			}
		}
	}


	// ---------------------------------------------------------
	private static void handleChatMessage(Profile profile, Entity map, SendChatMessage message) {
		ChatService.onMessage(profile, message.getMessage());
	}
	private static void handlePingMessage(Profile profile, Entity map, Ping message) {
		MessageService.send(message, profile);
	}
}
