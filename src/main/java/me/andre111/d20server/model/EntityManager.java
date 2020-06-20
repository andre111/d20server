package me.andre111.d20server.model;

import java.util.Collections;
import java.util.HashMap;
import java.util.stream.Stream;

import com.google.gson.reflect.TypeToken;

import me.andre111.d20common.model.BaseEntity;
import me.andre111.d20common.model.entity.Audio;
import me.andre111.d20common.model.entity.ChatData;
import me.andre111.d20common.model.entity.Image;
import me.andre111.d20common.model.entity.actor.Actor;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.util.Utils;

public abstract class EntityManager<E extends BaseEntity> {
	public static final EntityManager<Map> MAP = new FileEntityManager<>("map", Map.class);
	public static final BinaryEntityManager<Image> IMAGE = new BinaryEntityManager<>("image", Image.class, Image::new);
	public static final BinaryEntityManager<Audio> AUDIO = new BinaryEntityManager<>("audio", Audio.class, Audio::new);
	public static final CollectionEntityManager<Actor> ACTOR = new CollectionEntityManager<>("actor", Actor.class);
	
	public static final EntityManager<ChatData> CHAT = new FileEntityManager<>("chat", ChatData.class);
	
	public static final EntityManager<Profile> PROFILE = new CollectionEntityManager<>("profile", Profile.class);
	
	// --------------------------------------------------
	protected final String name;
	protected final Class<E> c;
	
	protected java.util.Map<Long, String> index;
	
	protected EntityManager(String name, Class<E> c) {
		this.name = name;
		this.c = c;
		
		index = Utils.readJson("entity."+name+"_index", TypeToken.getParameterized(java.util.Map.class, Long.class, String.class).getType());
		if(index == null) index = new HashMap<>();
	}
	
	public void save(E e) {
		saveElement(e);
		
		index.put(e.id(), e.getName());
		saveIndex();
	}
	
	public void delete(long id) {
		index.remove(id);
		saveIndex();
		
		deleteElement(id);
	}
	
	protected void saveIndex() {
		Utils.saveJson("entity."+name+"_index", index);
	}
	
	public abstract E find(long id);
	protected abstract void saveElement(E e);
	protected abstract void deleteElement(long id);
	public abstract Stream<E> stream();
	
	public E findFirst() {
		return stream().findFirst().orElse(null); //TODO: recode using index
	}
	
	public java.util.Map<Long, String> getIndex() {
		return Collections.unmodifiableMap(index);
	}
	
	public boolean has(long id) {
		return index.containsKey(id);
	}
}
