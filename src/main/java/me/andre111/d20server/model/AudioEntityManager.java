package me.andre111.d20server.model;

import java.util.stream.Stream;

import me.andre111.d20common.model.entity.Audio;
import me.andre111.d20common.util.Utils;

public class AudioEntityManager extends EntityManager<Audio> {
	public AudioEntityManager(String name) {
		super(name, Audio.class);
	}
	
	@Override
	public Audio find(long id) {
		String imageName = getIndex().get(id);
		byte[] data = Utils.readBinary("entity."+name+"."+id);
		if(data != null) {
			return new Audio(imageName, data);
		} else {
			return null;
		}
	}

	@Override
	protected void saveElement(Audio e) {
		Utils.saveBinary("entity."+name+"."+e.id(), e.getData());
	}
	
	@Override
	public Stream<Audio> stream() {
		throw new UnsupportedOperationException();
	}
}
