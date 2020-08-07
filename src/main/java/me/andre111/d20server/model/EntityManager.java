package me.andre111.d20server.model;

import java.util.Collections;
import java.util.HashMap;
import java.util.stream.Stream;

import com.google.gson.reflect.TypeToken;

import me.andre111.d20common.message.game.entity.EntityIndex;
import me.andre111.d20common.message.game.entity.EntityIndexChange;
import me.andre111.d20common.model.BaseEntity;
import me.andre111.d20common.model.IndexEntry;
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
import me.andre111.d20common.util.Utils;
import me.andre111.d20server.service.MessageService;
import me.andre111.d20server.service.UserService;

public abstract class EntityManager<E extends BaseEntity> {
	private static final java.util.Map<Class<? extends BaseEntity>, EntityManager<? extends BaseEntity>> MANAGERS = new HashMap<>();
	
	public static final EntityManager<Map> MAP = new FileEntityManager<>("map", Map.class, true, true, Access.NOONE);
	//public static final EntityManager<Token> TOKEN = new CollectionEntityManager<>("token", Token.class, false, true, Access.GM);
	//public static final EntityManager<Wall> WALL = new CollectionEntityManager<>("wall", Wall.class, false, true, Access.GM);
	//public static final EntityManager<TokenList> TOKEN_LIST = new CollectionEntityManager<>("token_list", TokenList.class, true, true, Access.GM);
	public static final BinaryEntityManager<Image> IMAGE = new BinaryEntityManager<>("image", Image.class, true, false, Access.GM, Image::new);
	public static final BinaryEntityManager<Audio> AUDIO = new BinaryEntityManager<>("audio", Audio.class, true, false, Access.GM, Audio::new);
	public static final EntityManager<Actor> ACTOR = new CollectionEntityManager<>("actor", Actor.class, true, true, Access.GM);
	
	public static final EntityManager<ChatData> CHAT = new FileEntityManager<>("chat", ChatData.class, false, false, Access.NOONE);
	
	public static final EntityManager<Profile> PROFILE = new CollectionEntityManager<>("profile", Profile.class, false, false, Access.NOONE);
	
	@SuppressWarnings("unchecked")
	public static <E extends BaseEntity> EntityManager<E> get(Class<E> c) {
		return (EntityManager<E>) MANAGERS.get(c);
	}
	public static void syncIndices(Profile profile) {
		for(EntityManager<? extends BaseEntity> manager : MANAGERS.values()) {
			manager.syncFullIndex(profile);
		}
	}
	
	// --------------------------------------------------
	protected final String name;
	protected final Class<E> c;
	protected final boolean indexSynced;
	protected final boolean requestable;
	protected final Access addRemoveAccess;
	
	protected java.util.Map<Long, IndexEntry> index;
	
	protected EntityManager(String name, Class<E> c, boolean indexSynced, boolean requestable, Access addRemoveAccess) {
		this.name = name;
		this.c = c;
		this.indexSynced = indexSynced;
		this.requestable = requestable;
		this.addRemoveAccess = addRemoveAccess;
		
		index = Utils.readJson("entity."+name+"_index", TypeToken.getParameterized(java.util.Map.class, Long.class, IndexEntry.class).getType());
		if(index == null) index = new HashMap<>();
		
		if(MANAGERS.get(c) != null) throw new RuntimeException("Duplicated EntityManager for "+c);
		MANAGERS.put(c, this);
	}
	
	public final void save(E e) {
		saveElement(e);
		
		index.put(e.id(), e.getIndexEntry());
		saveIndex();
		
		syncIndexEntry(e.id());
	}
	
	public final void delete(long id) {
		index.remove(id);
		saveIndex();
		
		deleteElement(id);
		
		syncIndexEntry(id);
	}
	
	protected final void saveIndex() {
		Utils.saveJson("entity."+name+"_index", index);
	}
	
	public final void syncIndexEntry(long id) {
		if(indexSynced) {
			UserService.forEach(profile -> MessageService.send(new EntityIndexChange(c, id, index.get(id), profile), profile));
		}
	}
	public final void syncFullIndex(Profile profile) {
		if(indexSynced) {
			MessageService.send(new EntityIndex(c, index, profile), profile);
		}
	}
	
	public final java.util.Map<Long, IndexEntry> getIndex() {
		return Collections.unmodifiableMap(index);
	}
	
	public final boolean has(long id) {
		return index.containsKey(id);
	}
	
	public final boolean isRequestable() {
		return requestable;
	}
	
	public final boolean canAddRemove(Profile profile) {
		Access accessLevel = profile.getRole() == Profile.Role.GM ? Access.GM : Access.EVERYONE;
		return addRemoveAccess.ordinal() <= accessLevel.ordinal();
	}
	
	public abstract E find(long id);
	public abstract Stream<E> stream();
	protected abstract void saveElement(E e);
	protected abstract void deleteElement(long id);
}
