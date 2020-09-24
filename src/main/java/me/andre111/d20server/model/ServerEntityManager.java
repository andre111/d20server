package me.andre111.d20server.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.function.Predicate;

import com.google.gson.reflect.TypeToken;

import me.andre111.d20common.message.game.entity.AddEntity;
import me.andre111.d20common.message.game.entity.ClearEntities;
import me.andre111.d20common.message.game.entity.RemoveEntity;
import me.andre111.d20common.message.game.entity.UpdateEntityProperties;
import me.andre111.d20common.model.Entity;
import me.andre111.d20common.model.EntityManager;
import me.andre111.d20common.model.Property;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.util.Utils;
import me.andre111.d20server.service.MessageService;
import me.andre111.d20server.service.UserService;

public class ServerEntityManager<E extends Entity> implements EntityManager<E> {
	protected final String name;
	protected final Class<E> c;
	protected final boolean synched;
	protected final Access addRemoveAccess;
	
	private final Map<Long, E> entities;
	
	private final List<Consumer<Map<Long, E>>> listeners = new ArrayList<>();
	private final List<Consumer<E>> entityListeners = new ArrayList<>();
	private final List<BiConsumer<Long, E>> removalListeners = new ArrayList<>();
	
	private boolean saveEnabled = true;
	
	public ServerEntityManager(String name, Class<E> c, boolean synched, Access addRemoveAccess) {
		this.name = name;
		this.c = c;
		this.synched = synched;
		this.addRemoveAccess = addRemoveAccess;
		
		Map<Long, E> loadedEntities = Utils.readJson("entity."+name, TypeToken.getParameterized(HashMap.class, Long.class, c).getType());
		entities = loadedEntities != null ? loadedEntities : new HashMap<>();
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
	public final List<E> all() {
		return new ArrayList<>(entities.values());
	}

	@Override
	public final void add(E entity) {
		entities.put(entity.id(), entity);
		if(saveEnabled) Utils.saveJson("entity."+name, entities);
		
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
		
		E entity = entities.remove(id);
		if(saveEnabled) Utils.saveJson("entity."+name, entities);
		
		UserService.forEach(profile -> {
			MessageService.send(new RemoveEntity(c, id), profile);
		});
		
		notifyListeners();
		for(var listener : removalListeners) {
			listener.accept(id, entity);
		}
	}

	@Override
	public final void updateProperties(long id, Map<String, Property> map, Access accessLevel) {
		E entity = find(id);
		if(entity == null) return;
		
		// keep track of all profiles that could see this entity
		Set<Profile> couldView = new HashSet<>();
		for(Profile profile : UserService.getAllConnectedProfiles()) {
			if(entity.canView(profile)) couldView.add(profile);
		}
		
		// transfer properties respecting access settings and keeping track of which changed
		Map<String, Property> changedProperties = new HashMap<>();
		for(Map.Entry<String, Property> e : map.entrySet()) {
			Property ownProperty = entity.prop(e.getKey());
			if(ownProperty == null) continue; // server discards new/unknown properties from client
			
			// transfer value
			if(accessLevel.ordinal() >= ownProperty.getEditAccess().ordinal()) {
				try {
					e.getValue().transferTo(ownProperty);
					changedProperties.put(e.getKey(), ownProperty);
				} catch(UnsupportedOperationException ex) {
					ex.printStackTrace(); //TODO: how to handle incorrect property updates
				}
			}
			
			// transfer access (GM only, and do not allow changing of SYSTEM level access)
			if(accessLevel == Access.GM) {
				if(e.getValue().getViewAccess() != Access.SYSTEM && ownProperty.getViewAccess() != Access.SYSTEM && e.getValue().getViewAccess() != ownProperty.getViewAccess()) {
					ownProperty.setViewAccess(e.getValue().getViewAccess());
					changedProperties.put(e.getKey(), ownProperty);
				}
				if(e.getValue().getEditAccess() != Access.SYSTEM && ownProperty.getEditAccess() != Access.SYSTEM  && e.getValue().getEditAccess() != ownProperty.getEditAccess()) {
					ownProperty.setEditAccess(e.getValue().getEditAccess());
					changedProperties.put(e.getKey(), ownProperty);
				}
			}
		}

		// save and transfer (depending on (changing) access: add, remove or only changed properties)
		if(saveEnabled) Utils.saveJson("entity."+name, entities);
		UserService.forEach(profile -> {
			if(entity.canView(profile) && !couldView.contains(profile)) {
				MessageService.send(new AddEntity(entity), profile);
			} else if(!entity.canView(profile) && couldView.contains(profile)) {
				MessageService.send(new RemoveEntity(c, id), profile); 
			} else if(entity.canView(profile)) {
				MessageService.send(new UpdateEntityProperties(c, id, changedProperties), profile);
			}
		});
		
		notifyListeners();
		for(var listener : entityListeners) {
			listener.accept(entity);
		}
	}

	
	public final void addListener(Consumer<Map<Long, E>> listener) {
		listeners.add(listener);
	}
	
	public final void addEntityListener(Consumer<E> listener) {
		entityListeners.add(listener);
	}
	
	public final void addRemovalListener(BiConsumer<Long, E> listener) {
		removalListeners.add(listener);
	}
	
	private final void notifyListeners() {
		Map<Long, E> unmodifiable = Collections.unmodifiableMap(entities);
		for(var listener : listeners) {
			listener.accept(unmodifiable);
		}
	}
	
	
	public final boolean canAddRemove(Profile profile, Entity entity) {
		Access accessLevel = entity.getAccessLevel(profile);
		return addRemoveAccess.ordinal() <= accessLevel.ordinal();
	}
	
	protected final Class<E> getEntityClass() {
		return c;
	}
	
	protected final int getAccessibleCount(Profile profile) {
		int count = 0;
		for(E entity : entities.values()) {
			if(entity.canView(profile)) {
				count++;
			}
		}
		return count;
	}
	
	protected final void fullSync(Profile profile) {
		MessageService.send(new ClearEntities(c), profile);
		for(E entity : entities.values()) {
			if(entity.canView(profile)) {
				MessageService.send(new AddEntity(entity), profile);
			}
		}
	}
	
	protected final void removeAll(Predicate<E> predicate) {
		for(E e : new ArrayList<>(entities.values())) {
			if(predicate.test(e)) remove(e.id());
		}
	}
	
	public final void setSaveEnabled(boolean saveEnabled) {
		this.saveEnabled = saveEnabled;
		if(saveEnabled) {
			Utils.saveJson("entity."+name, entities);
		}
	}
}
