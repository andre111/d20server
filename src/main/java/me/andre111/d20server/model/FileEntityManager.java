package me.andre111.d20server.model;

import java.util.stream.Stream;

import me.andre111.d20server.util.Utils;

public class FileEntityManager<E extends BaseEntity> extends EntityManager<E> {
	public FileEntityManager(String name, Class<E> c) {
		super(name, c);
	}
	
	@Override
	public E find(long id) {
		return Utils.read("entity."+name+"."+id, c);
	}

	@Override
	protected void saveElement(E e) {
		Utils.save("entity."+name+"."+e.id(), e);
	}
	
	@Override
	public Stream<E> stream() {
		throw new UnsupportedOperationException();
	}
}
