package me.andre111.d20server.model;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;

import com.google.gson.reflect.TypeToken;

import me.andre111.d20common.util.Utils;

public class CollectionEntityManager<E extends BaseEntity> extends EntityManager<E> {
	private Map<Long, E> entities = new HashMap<>();
	
	protected CollectionEntityManager(String name, Class<E> c) {
		super(name, c);
		
		entities = Utils.readJson("entity."+name, TypeToken.getParameterized(Map.class, Long.class, c).getType());
		if(entities == null) {
			entities = new HashMap<>();
		}
	}
	
	@Override
	public E find(long id) {
		return entities.get(id);
	}

	@Override
	protected void saveElement(E e) {
		entities.put(e.id(), e);
		Utils.saveJson("entity."+name, entities);
	}

	@Override
	public Stream<E> stream() {
		return entities.values().stream();
	}
}
