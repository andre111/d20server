package me.andre111.d20server.model;

import java.util.HashMap;

import me.andre111.d20common.model.BaseEntity;
import me.andre111.d20common.model.Entities;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.entity.map.TokenList;
import me.andre111.d20common.model.entity.map.Wall;
import me.andre111.d20common.model.entity.profile.Profile;

public class EntityManagers {
	private static final java.util.Map<Class<? extends BaseEntity>, ServerEntityManager<? extends BaseEntity>> MANAGERS = new HashMap<>();
	
	private static void register(ServerEntityManager<? extends BaseEntity> em) {
		if(MANAGERS.get(em.getEntityClass()) != null) throw new RuntimeException("Duplicated EntityManager for "+em.getEntityClass());
		MANAGERS.put(em.getEntityClass(), em);
	}
	
	static {
		for(Entities.Registered entity : Entities.ENTITIES) {
			register(new ServerEntityManager<>(entity.name(), entity.c(), entity.synched(), entity.addRemoveAccess()));
		}
	}
	
	
	@SuppressWarnings("unchecked")
	public static <E extends BaseEntity> ServerEntityManager<E> get(Class<E> c) {
		return (ServerEntityManager<E>) MANAGERS.get(c);
	}
	public static void fullSync(Profile profile) {
		for(ServerEntityManager<? extends BaseEntity> manager : MANAGERS.values()) {
			manager.fullSync(profile);
		}
	}
	
	static {
		// remove token list entries on token remove
		EntityManagers.get(Token.class).addRemovalListener(id -> {
			EntityManagers.get(TokenList.class).all().forEach(tokenList -> {
				if(tokenList.hasValue(id)) {
					tokenList.removeToken(id);
					EntityManagers.get(TokenList.class).add(tokenList);
				}
			});
		});
		
		// remove tokens and walls on map remove
		EntityManagers.get(Map.class).addRemovalListener(id -> {
			EntityManagers.get(Token.class).removeAll(token -> token.prop("map").getLong() == id);
			EntityManagers.get(Wall.class).removeAll(wall -> wall.prop("map").getLong() == id);
		});
	}
}
