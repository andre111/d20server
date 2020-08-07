package me.andre111.d20server.model;

import java.util.HashMap;

import me.andre111.d20common.model.BaseEntity;
import me.andre111.d20common.model.entity.Audio;
import me.andre111.d20common.model.entity.ChatData;
import me.andre111.d20common.model.entity.Image;
import me.andre111.d20common.model.entity.actor.Actor;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.model.entity.map.TokenList;
import me.andre111.d20common.model.entity.map.Wall;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.model.property.Access;

public class EntityManagers {
	private static final java.util.Map<Class<? extends BaseEntity>, ServerEntityManager<? extends BaseEntity>> MANAGERS = new HashMap<>();
	
	public static final ServerEntityManager<Map> MAP = new ServerEntityManager<>("map", Map.class, true, Access.NOONE);
	public static final ServerEntityManager<Token> TOKEN = new ServerEntityManager<>("token", Token.class, true, Access.GM);
	public static final ServerEntityManager<Wall> WALL = new ServerEntityManager<>("wall", Wall.class, true, Access.GM);
	public static final ServerEntityManager<TokenList> TOKEN_LIST = new ServerEntityManager<>("token_list", TokenList.class, true, Access.GM);
	public static final ServerEntityManager<Image> IMAGE = new ServerEntityManager<>("image", Image.class, true, Access.GM);
	public static final ServerEntityManager<Audio> AUDIO = new ServerEntityManager<>("audio", Audio.class, true, Access.GM);
	public static final ServerEntityManager<Actor> ACTOR = new ServerEntityManager<>("actor", Actor.class, true, Access.GM);
	
	public static final ServerEntityManager<ChatData> CHAT = new ServerEntityManager<>("chat", ChatData.class, false, Access.NOONE);
	
	public static final ServerEntityManager<Profile> PROFILE = new ServerEntityManager<>("profile", Profile.class, false, Access.NOONE);
	
	protected static void registerEntityManager(ServerEntityManager<? extends BaseEntity> em) {
		if(MANAGERS.get(em.getEntityClass()) != null) throw new RuntimeException("Duplicated EntityManager for "+em.getEntityClass());
		MANAGERS.put(em.getEntityClass(), em);
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
}
