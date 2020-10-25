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
import me.andre111.d20common.model.def.EntityDefinition;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.model.property.Access;
import me.andre111.d20common.util.Utils;
import me.andre111.d20server.service.MessageService;
import me.andre111.d20server.service.SaveService;
import me.andre111.d20server.service.UserService;

public class ServerEntityManager implements EntityManager {
	protected final String type;
	protected final boolean synched;
	protected final Access addRemoveAccess;
	
	private final Map<Long, Entity> entities;
	
	private final List<Consumer<Map<Long, Entity>>> listeners = new ArrayList<>();
	private final List<Consumer<Entity>> entityListeners = new ArrayList<>();
	private final List<BiConsumer<Long, Entity>> removalListeners = new ArrayList<>();
	
	private boolean saveEnabled = true;
	
	public ServerEntityManager(String type, EntityDefinition def) {
		this.type = type;
		this.synched = def.settings().synched();
		this.addRemoveAccess = def.settings().addRemoveAccess();
		
		Map<Long, Entity> loadedEntities = Utils.readJson("entity."+type, TypeToken.getParameterized(HashMap.class, Long.class, Entity.class).getType());
		entities = loadedEntities != null ? loadedEntities : new HashMap<>();
	}
	
	@Override
	public final Entity find(long id) {
		return entities.get(id);
	}
	
	@Override
	public final boolean has(long id) {
		return entities.containsKey(id);
	}
	
	@Override
	public final List<Entity> all() {
		return new ArrayList<>(entities.values());
	}
	
	@Override
	public final Map<Long, Entity> map() {
		return Collections.unmodifiableMap(entities);
	}

	@Override
	public final void add(Entity entity) {
		entities.put(entity.id(), entity);
		if(saveEnabled) Utils.saveJson("entity."+type, entities);
		
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
		
		Entity entity = entities.remove(id);
		if(saveEnabled) Utils.saveJson("entity."+type, entities);
		
		UserService.forEach(profile -> {
			MessageService.send(new RemoveEntity(type, id), profile);
		});
		
		notifyListeners();
		for(var listener : removalListeners) {
			listener.accept(id, entity);
		}
	}

	@Override
	public final void updateProperties(long id, Map<String, Property> map, Access accessLevel) {
		Entity entity = find(id);
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
			if(!e.getValue().hasValidValue()) continue; // server discards properties with invalid value
			
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
		if(saveEnabled) SaveService.requestSave(type); // request (async) save, as that could take some time
		UserService.forEach(profile -> {
			if(entity.canView(profile) && !couldView.contains(profile)) {
				MessageService.send(new AddEntity(entity), profile);
			} else if(!entity.canView(profile) && couldView.contains(profile)) {
				MessageService.send(new RemoveEntity(type, id), profile); 
			} else if(entity.canView(profile)) {
				MessageService.send(new UpdateEntityProperties(type, id, changedProperties), profile);
			}
		});
		
		notifyListeners();
		for(var listener : entityListeners) {
			listener.accept(entity);
		}
	}

	
	public final void addListener(Consumer<Map<Long, Entity>> listener) {
		listeners.add(listener);
	}
	
	public final void addEntityListener(Consumer<Entity> listener) {
		entityListeners.add(listener);
	}
	
	public final void addRemovalListener(BiConsumer<Long, Entity> listener) {
		removalListeners.add(listener);
	}
	
	private final void notifyListeners() {
		Map<Long, Entity> unmodifiable = Collections.unmodifiableMap(entities);
		for(var listener : listeners) {
			listener.accept(unmodifiable);
		}
	}
	
	
	public final boolean canAddRemove(Profile profile, Entity entity) {
		Access accessLevel = entity.getAccessLevel(profile);
		return addRemoveAccess.ordinal() <= accessLevel.ordinal();
	}
	
	protected final int getAccessibleCount(Profile profile) {
		int count = 0;
		for(Entity entity : entities.values()) {
			if(entity.canView(profile)) {
				count++;
			}
		}
		return count;
	}
	
	protected final void fullSync(Profile profile) {
		MessageService.send(new ClearEntities(type), profile);
		for(Entity entity : entities.values()) {
			if(entity.canView(profile)) {
				MessageService.send(new AddEntity(entity), profile);
			}
		}
	}
	
	protected final void removeAll(Predicate<Entity> predicate) {
		for(Entity e : new ArrayList<>(entities.values())) {
			if(predicate.test(e)) remove(e.id());
		}
	}
	
	public final void setSaveEnabled(boolean saveEnabled) {
		this.saveEnabled = saveEnabled;
		if(saveEnabled) {
			SaveService.requestSave(type);
		}
	}
	
	public final void performSave() {
		Utils.saveJson("entity."+type, entities); // request (async) save, as that could take some time
	}
}
