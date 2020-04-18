package me.andre111.d20server.model;

//TODO: Doc: Implements the base of each entity with identity and hashcode based on its id
public abstract class BaseEntity {
	private long id = ID.next(getClass()); //TODO: note this also increases the next id for every LOADED entity, that should probably not happen
	
	public BaseEntity() {
	}
	public BaseEntity(long forcedID) {
		this.id = forcedID;
	}
	
	public final long id() {
		return id;
	}
	
	public final void resetID() {
		id = ID.next(getClass());
	}
	
	@Override
	public final boolean equals(Object other) {
		if(other == null) return false;
		if(!getClass().equals(other.getClass())) return false;
		
		return id == ((BaseEntity) other).id;
	}
	
	@Override
	public final int hashCode() {
		return Long.hashCode(id);
	}
	
	//TODO: toString implementation
	
	//TODO: see if I can make this in the baseclass somehow
	// -> this just needs to call: EntityManager.get(.class).save(this);
	public abstract void save();
	
	public String getName() {
		return "";
	}
}
