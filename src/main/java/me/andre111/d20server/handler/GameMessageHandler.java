package me.andre111.d20server.handler;

import java.util.ArrayList;
import java.util.List;

import io.netty.channel.Channel;
import me.andre111.d20common.message.game.MovePlayerToMap;
import me.andre111.d20common.message.game.ActionCommand;
import me.andre111.d20common.message.game.GameMessage;
import me.andre111.d20common.message.game.NewMap;
import me.andre111.d20common.message.game.PlayEffect;
import me.andre111.d20common.message.game.SelectedTokens;
import me.andre111.d20common.message.game.ShowImage;
import me.andre111.d20common.message.game.UpdateMapProperties;
import me.andre111.d20common.message.game.actor.SetActorDefaultToken;
import me.andre111.d20common.message.game.actor.UpdateActor;
import me.andre111.d20common.message.game.chat.SendChatMessage;
import me.andre111.d20common.message.game.entity.AddEntity;
import me.andre111.d20common.message.game.entity.EntityRequest;
import me.andre111.d20common.message.game.entity.EntityRequestDenied;
import me.andre111.d20common.message.game.entity.RemoveEntity;
import me.andre111.d20common.message.game.index.RenameAudio;
import me.andre111.d20common.message.game.index.RenameImage;
import me.andre111.d20common.message.game.token.AddToken;
import me.andre111.d20common.message.game.token.RemoveToken;
import me.andre111.d20common.message.game.token.UpdateToken;
import me.andre111.d20common.message.game.token.UpdateTokenMacros;
import me.andre111.d20common.message.game.token.list.AddTokenList;
import me.andre111.d20common.message.game.token.list.RemoveTokenList;
import me.andre111.d20common.message.game.token.list.TokenListValue;
import me.andre111.d20common.message.game.token.list.UpdateTokenList;
import me.andre111.d20common.message.game.util.Ping;
import me.andre111.d20common.message.game.wall.AddOrUpdateWall;
import me.andre111.d20common.message.game.wall.RemoveWall;
import me.andre111.d20common.model.BaseEntity;
import me.andre111.d20common.model.entity.actor.Actor;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.entity.map.TokenList;
import me.andre111.d20common.model.entity.map.Wall;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.model.property.Property;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.service.ChatService;
import me.andre111.d20server.service.GameService;
import me.andre111.d20server.service.MessageService;
import me.andre111.d20server.service.UserService;

//TODO: move most code (except for mostly the access checks) to separate services (so stuff like addToken/removeToken can be reused by other code without duplication)
public abstract class GameMessageHandler {
	protected static void handle(Channel channel, Profile profile, Map map, GameMessage message) {
		//
		if(message instanceof MovePlayerToMap) {
			handleEnterMap(profile, map, (MovePlayerToMap) message);
		} else if(message instanceof NewMap) {
			handleNewMap(profile, map, (NewMap) message);
		} else if(message instanceof SelectedTokens) {
			handleSelectedTokens(profile, map, (SelectedTokens) message);
		} else if(message instanceof UpdateMapProperties) {
			handleUpdateMap(profile, map, (UpdateMapProperties) message);

			// TOKENS: --------------------
		} else if(message instanceof AddToken) {
			handleAddToken(profile, map, (AddToken) message);
		} else if(message instanceof RemoveToken) {
			handleRemoveToken(profile, map, (RemoveToken) message);
		} else if(message instanceof UpdateToken) {
			handleUpdateToken(profile, map, (UpdateToken) message);
		} else if(message instanceof UpdateTokenMacros) {
			handleUpdateTokenMacros(profile, map, (UpdateTokenMacros) message);

			// TOKEN-LISTS: --------------------
		} else if(message instanceof AddTokenList) {
			handleAddTokenList(profile, map, (AddTokenList) message);
		} else if(message instanceof RemoveTokenList) {
			handleRemoveTokenList(profile, map, (RemoveTokenList) message);
		} else if(message instanceof TokenListValue) {
			handleTokenListValue(profile, map, (TokenListValue) message);
		} else if(message instanceof UpdateTokenList) {
			handleUpdateTokenList(profile, map, (UpdateTokenList) message);

			// WALLS: --------------------
		} else if(message instanceof AddOrUpdateWall) {
			handleAddOrUpdateWall(profile, map, (AddOrUpdateWall) message);
		} else if(message instanceof RemoveWall) {
			handleRemoveWall(profile, map, (RemoveWall) message);

			// ACTORS: --------------------
		} else if(message instanceof UpdateActor) {
			handleUpdateActor(profile, map, (UpdateActor) message);
		} else if(message instanceof SetActorDefaultToken) {
			handleSetActorDefaultToken(profile, map, (SetActorDefaultToken) message);

			// OTHERS: --------------------
		} else if(message instanceof RenameAudio) {
			handleRenameAudio(profile, map, (RenameAudio) message);
		} else if(message instanceof RenameImage) {
			handleRenameImage(profile, map, (RenameImage) message);
		} else if(message instanceof ShowImage) {
			handleShowImage(profile, map, (ShowImage) message);
		} else if(message instanceof ActionCommand) {
			handleActionCommand(profile, map, (ActionCommand) message);

			// ENTITIES: --------------------
		} else if(message instanceof EntityRequest) {
			handleEntityDataRequest(profile, map, (EntityRequest) message);
		} else if(message instanceof AddEntity) {
			handleAddEntity(profile, map, (AddEntity) message);
		} else if(message instanceof RemoveEntity) {
			handleRemoveEntity(profile, map, (RemoveEntity) message);

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

	private static void handleEnterMap(Profile profile, Map map, MovePlayerToMap message) {
		long mapID = message.getMapID();
		long playerID = message.getPlayerID();
		if(EntityManager.MAP.has(mapID)) {
			if(playerID == 0) {
				if(profile.getRole() != Profile.Role.GM) return;

				// set player map id and reset overridden values for all non gams
				GameService.setBaseMapID(mapID);
				for(Profile otherProfile : UserService.getAllConnectedProfiles()) {
					if(otherProfile.getRole() != Profile.Role.GM) {
						GameService.setPlayerOverrideMapID(otherProfile, mapID);
					}
				}

				// (re)load maps for clients
				GameService.reloadMaps(null);
			} else {
				if(profile.getRole() == Profile.Role.GM || (playerID == profile.id() && GameService.getMap(mapID).getPlayersCanEnter())) {
					// set player override map id and (re)load map
					Profile otherProfile = UserService.getProfile(playerID);
					if(otherProfile != null) {
						GameService.setPlayerOverrideMapID(otherProfile, mapID);
						GameService.reloadMaps(otherProfile);
					}
				}
			}
		}
	}

	private static void handleNewMap(Profile profile, Map map, NewMap message) {
		Map newMap = new Map(message.getName());
		EntityManager.MAP.save(newMap);
	}

	private static void handleSelectedTokens(Profile profile, Map map, SelectedTokens message) {
		List<Long> selectedTokens = message.getSelectedTokens();
		if(selectedTokens == null) {
			selectedTokens = new ArrayList<>();
		}

		GameService.setSelectedTokens(profile, selectedTokens);
	}

	private static void handleUpdateMap(Profile profile, Map map, UpdateMapProperties message) {
		// transfer values (includes access check)
		map.applyProperties(message.getProperties(), profile);
		EntityManager.MAP.save(map);

		// broadcast new map properties (DO NOT REUSE MESSAGE, because clients do not apply access levels)
		MessageService.send(new UpdateMapProperties(map), map);
	}


	// ---------------------------------------------------------
	private static void handleAddToken(Profile profile, Map map, AddToken message) {
		Token token = message.getToken();
		token.resetID(); // reset ID to generate one from the DB

		// and and save
		map.addOrUpdateToken(token); // update token and get correct id //TODO: only add token, not update?
		EntityManager.MAP.save(map);
		MessageService.send(message, map); // and broadcast change
	}
	private static void handleRemoveToken(Profile profile, Map map, RemoveToken message) {
		Token token = map.getToken(message.getTokenID());
		if(token == null) return;

		// remove token from lists
		for(TokenList list : map.getTokenLists()) {
			list.removeToken(token);
			MessageService.send(new TokenListValue(list, token, 0, true), map);
		}

		// remove token
		map.removeToken(token);
		EntityManager.MAP.save(map);
		MessageService.send(message, map);
	}
	private static void handleUpdateToken(Profile profile, Map map, UpdateToken message) {
		Token token = map.getToken(message.getTokenID());
		java.util.Map<String, Property> properties = message.getProperties();
		if(token == null || properties == null || properties.isEmpty()) return;

		// transfer values (includes access check)
		token.applyProperties(properties, profile);
		EntityManager.MAP.save(map);

		// broadcast new token properties (DO NOT REUSE MESSAGE, because clients do not apply access levels)
		MessageService.send(new UpdateToken(token), map);
	}
	private static void handleUpdateTokenMacros(Profile profile, Map map, UpdateTokenMacros message) {
		Token token = map.getToken(message.getTokenID());
		java.util.Map<String, String> macros = message.getMacros();
		if(token == null || macros == null) return;

		// determine access level
		Access accessLevel = token.getAccessLevel(profile);

		if(token.canEditMacro(accessLevel)) {
			// transfer values
			token.setMacros(macros);
			EntityManager.MAP.save(map);

			// broadcast new token properties (DO NOT REUSE MESSAGE, because clients do not apply access levels)
			MessageService.send(new UpdateTokenMacros(token), map);
		}
	}


	// ---------------------------------------------------------
	private static void handleAddTokenList(Profile profile, Map map, AddTokenList message) {
		TokenList list = message.getTokenList();
		if(map.getTokenList(list.id()) == null) {
			list.resetID(); // reset ID to generate one from the DB
		}

		// add and save
		map.addOrUpdateTokenList(list);
		EntityManager.MAP.save(map);
		MessageService.send(message, map); // and broadcast change
	}
	private static void handleRemoveTokenList(Profile profile, Map map, RemoveTokenList message) {
		map.removeTokenList(map.getTokenList(message.getListID()));
		EntityManager.MAP.save(map);
		MessageService.send(message, map);
	}
	private static void handleTokenListValue(Profile profile, Map map, TokenListValue message) {
		TokenList list = map.getTokenList(message.getListID());
		Token token = map.getToken(message.getTokenID());
		if(list != null && token != null) {
			// determine access level
			Access accessLevel = list.getAccessLevel(profile, token);
			if(list.canEdit(accessLevel)) {

				// apply change
				if(message.doReset()) {
					list.removeToken(token);
				} else {
					list.addOrUpdateToken(token, message.getValue());
				}

				EntityManager.MAP.save(map);
				MessageService.send(message, map); // and broadcast change
			}
		}
	}
	private static void handleUpdateTokenList(Profile profile, Map map, UpdateTokenList message) {
		TokenList list = map.getTokenList(message.getListID());
		java.util.Map<String, Property> properties = message.getProperties();
		if(list == null || properties == null || properties.isEmpty()) return;
		
		// transfer values (includes access check)
		list.applyProperties(properties, profile);
		EntityManager.MAP.save(map);

		// broadcast new tokenlist properties (DO NOT REUSE MESSAGE, because clients do not apply access levels)
		MessageService.send(new UpdateTokenList(list), map);
	}


	// ---------------------------------------------------------
	private static void handleAddOrUpdateWall(Profile profile, Map map, AddOrUpdateWall message) {
		Wall wall = message.getWall();
		if(map.getWall(wall.id()) == null) {
			wall.resetID(); // reset ID to generate one from the DB
		}

		// add and save
		map.addOrUpdateWall(wall); // update wall and get correct id
		EntityManager.MAP.save(map);
		MessageService.send(message, map); // and broadcast change
	}
	private static void handleRemoveWall(Profile profile, Map map, RemoveWall message) {
		map.removeWall(map.getWall(message.getWallID()));
		EntityManager.MAP.save(map);
		MessageService.send(message, map);
	}


	// ---------------------------------------------------------
	private static void handleUpdateActor(Profile profile, Map map, UpdateActor message) {
		Actor actor = EntityManager.ACTOR.find(message.getActorID());
		java.util.Map<String, Property> properties = message.getProperties();
		if(actor == null || properties == null || properties.isEmpty()) return;
		
		//TODO: remove once generic update system that also updates clients exists
		MessageService.broadcast(new RemoveEntity(Actor.class, actor.id()));

		// transfer values (includes access check)
		actor.applyProperties(properties, profile);
		EntityManager.ACTOR.save(actor);
	}
	private static void handleSetActorDefaultToken(Profile profile, Map map, SetActorDefaultToken message) {
		Actor actor = EntityManager.ACTOR.find(message.getActorID());
		Token token = GameService.getSelectedToken(map, profile, true);
		if(actor == null || token == null) return;
		
		//TODO: remove once generic update system that also updates clients exists
		MessageService.broadcast(new RemoveEntity(Actor.class, actor.id()));
		
		// set default token
		actor.setDefaultToken(token);
		EntityManager.ACTOR.save(actor);
	}


	// ---------------------------------------------------------
	private static void handleRenameAudio(Profile profile, Map map, RenameAudio message) {
		EntityManager.AUDIO.rename(message.getAudioID(), message.getName());
	}
	private static void handleRenameImage(Profile profile, Map map, RenameImage message) {
		EntityManager.IMAGE.rename(message.getImageID(), message.getName());
	}
	private static void handleShowImage(Profile profile, Map map, ShowImage message) {
		if(EntityManager.IMAGE.has(message.getImageID())) {
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
	private static void handleEntityDataRequest(Profile profile, Map map, EntityRequest message) {
		// search for entity, check access and reply with data if valid request
		EntityManager<?> manager = EntityManager.get(message.getEntityClass());
		if(manager != null && manager.isRequestable()) {
			BaseEntity entity = manager.find(message.getID());
			if(entity != null && entity.canView(profile)) {
				MessageService.send(new AddEntity(entity), profile);
				return;
			}
		}
		
		// if not replied -> send deny message
		if(message.getEntityClass() != null) {
			MessageService.send(new EntityRequestDenied(message.getEntityClass(), message.getID()), profile);
		}
	}
	@SuppressWarnings({ "rawtypes", "unchecked" })
	private static void handleAddEntity(Profile profile, Map map, AddEntity message) {
		// search for manager, check access and reset id before adding if valid request
		EntityManager manager = EntityManager.get(message.getEntityClass());
		if(manager != null && manager.canAddRemove(profile)) {
			BaseEntity entity = message.getEntity();
			entity.resetID();
			manager.save(entity);
		}
	}
	private static void handleRemoveEntity(Profile profile, Map map, RemoveEntity message) {
		// search for entity, check access and delete if valid request
		EntityManager<?> manager = EntityManager.get(message.getEntityClass());
		if(manager != null && manager.canAddRemove(profile)) {
			BaseEntity entity = manager.find(message.getID());
			if(entity != null && entity.canEdit(profile)) {
				manager.delete(message.getID());
				MessageService.broadcast(message);
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
