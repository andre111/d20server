package me.andre111.d20server.model;

import java.util.stream.Stream;

import me.andre111.d20common.model.entity.BinaryEntity;
import me.andre111.d20common.util.Utils;

public class BinaryEntityManager<E extends BinaryEntity> extends EntityManager<E> {
	private EntityFactory<E> factory;
	
	public BinaryEntityManager(String name, Class<E> c, EntityFactory<E> factory) {
		super(name, c);
		
		this.factory = factory;
	}
	
	@Override
	public E find(long id) {
		String entityName = getIndex().get(id);
		byte[] data = Utils.readBinary("entity."+name+"."+id);
		if(data != null) {
			return factory.create(entityName, data);
		} else {
			return null;
		}
	}

	@Override
	protected void saveElement(E e) {
		Utils.saveBinary("entity."+name+"."+e.id(), e.getData());
	}
	
	@Override
	protected void deleteElement(long id) {
		Utils.deleteBinary("entity."+name+"."+id);
	}
	
	@Override
	public Stream<E> stream() {
		throw new UnsupportedOperationException();
	}
	
	public void rename(long id, String name) {
		if(index.containsKey(id)) {
			index.put(id, name);
			saveIndex();
		}
	}
	
	public static interface EntityFactory<E extends BinaryEntity> {
		public E create(String name, byte[] data);
	}
}
