package me.andre111.d20server.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.stream.Stream;

import com.google.gson.reflect.TypeToken;

import me.andre111.d20common.message.game.entity.AddEntity;
import me.andre111.d20common.message.game.entity.ClearEntities;
import me.andre111.d20common.message.game.entity.RemoveEntity;
import me.andre111.d20common.message.game.entity.UpdateEntityProperties;
import me.andre111.d20common.model.BaseEntity;
import me.andre111.d20common.model.EntityManager;
import me.andre111.d20common.model.Property;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.util.Utils;
import me.andre111.d20server.service.MessageService;
import me.andre111.d20server.service.UserService;

public class ServerEntityManager<E extends BaseEntity> implements EntityManager<E> {
	protected final String name;
	protected final Class<E> c;
	protected final boolean synched;
	protected final Access addRemoveAccess;
	
	private final Map<Long, E> entities;
	
	private final List<Consumer<Map<Long, E>>> listeners = new ArrayList<>();
	private final List<Consumer<E>> entityListeners = new ArrayList<>();
	private final List<Consumer<Long>> removalListeners = new ArrayList<>();
	
	public ServerEntityManager(String name, Class<E> c, boolean synched, Access addRemoveAccess) {
		this.name = name;
		this.c = c;
		this.synched = synched;
		this.addRemoveAccess = addRemoveAccess;
		
		Map<Long, E> loadedEntities = Utils.readJson("entity."+name, TypeToken.getParameterized(HashMap.class, Long.class, c).getType());
		entities = loadedEntities != null ? loadedEntities : new HashMap<>();
		
		EntityManagers.registerEntityManager(this);
	}
	
	@Override
	public final E find(long id) {
		return entities.get(id);
	}
	
	@Override
	public final boolean has(long id) {
		return entities.containsKey(id);
	}
	
	@Override
	public final Stream<E> stream() {
		return entities.values().stream();
	}

	@Override
	public final void add(E entity) {
		entities.put(entity.id(), entity);
		Utils.saveJson("entity."+name, entities);
		
		UserService.forEach(profile -> {
			if(entity.canView(profile)) MessageService.send(new AddEntity(entity), profile);
		});
		
		notifyListeners();
		for(var listener : entityListeners) {
			listener.accept(entity);
		}
	}

	@Override
	public final void remove(long id) {
		if(!entities.containsKey(id)) return;
		
		entities.remove(id);
		Utils.saveJson("entity."+name, entities);
		
		UserService.forEach(profile -> {
			MessageService.send(new RemoveEntity(c, id), profile);
		});
		
		notifyListeners();
		for(var listener : removalListeners) {
			listener.accept(id);
		}
	}

	@Override
	public final void updateProperties(long id, Map<String, Property> map, Access accessLevel) {
		BaseEntity entity = find(id);
		if(entity == null) return;
		
		// transfer properties respecting access settings and keeping track of which changed
		Map<String, Property> changedProperties = new HashMap<>();
		for(Map.Entry<String, Property> e : map.entrySet()) {
			Property ownProperty = entity.prop(e.getKey());
			if(ownProperty == null) continue; //TODO: how to handle unknown properties?
			
			// transfer value
			if(accessLevel.ordinal() >= ownProperty.getEditAccess().ordinal()) {
				try {
					e.getValue().transferTo(ownProperty);
					changedProperties.put(e.getKey(), ownProperty);
				} catch(UnsupportedOperationException ex) {
					ex.printStackTrace(); //TODO: how to handle incorrect property updates
				}
			}
			
			// transfer access (GM only)
			if(accessLevel == Access.GM) {
				if(e.getValue().getViewAccess() != Access.NOONE && e.getValue().getViewAccess() != ownProperty.getViewAccess()) {
					ownProperty.setViewAccess(e.getValue().getViewAccess());
					changedProperties.put(e.getKey(), ownProperty);
				}
				if(e.getValue().getEditAccess() != Access.NOONE && e.getValue().getEditAccess() != ownProperty.getEditAccess()) {
					ownProperty.setEditAccess(e.getValue().getEditAccess());
					changedProperties.put(e.getKey(), ownProperty);
				}
			}
		}

		// save and transfer (only changed properties)
		Utils.saveJson("entity."+name, entities);
		UserService.forEach(profile -> {
			MessageService.send(new UpdateEntityProperties(c, id, changedProperties), profile);
		});
		
		notifyListeners();
	}

	
	public final void addListener(Consumer<Map<Long, E>> listener) {
		listeners.add(listener);
	}
	
	public final void addEntityListener(Consumer<E> listener) {
		entityListeners.add(listener);
	}
	
	public final void addRemovalListener(Consumer<Long> listener) {
		removalListeners.add(listener);
	}
	
	private final void notifyListeners() {
		Map<Long, E> unmodifiable = Collections.unmodifiableMap(entities);
		for(var listener : listeners) {
			listener.accept(unmodifiable);
		}
	}
	
	
	public final boolean canAddRemove(Profile profile) {
		Access accessLevel = profile.getRole() == Profile.Role.GM ? Access.GM : Access.EVERYONE;
		return addRemoveAccess.ordinal() <= accessLevel.ordinal();
	}
	
	protected final Class<E> getEntityClass() {
		return c;
	}
	
	protected final void fullSync(Profile profile) {
		MessageService.send(new ClearEntities(c), profile);
		for(E entity : entities.values()) {
			if(entity.canView(profile)) {
				MessageService.send(new AddEntity(entity), profile);
			}
		}
	}
}
