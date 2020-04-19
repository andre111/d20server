package me.andre111.d20server.model;

import java.util.stream.Stream;

import me.andre111.d20common.model.entity.Image;
import me.andre111.d20common.util.Utils;

public class ImageEntityManager extends EntityManager<Image> {
	public ImageEntityManager(String name) {
		super(name, Image.class);
	}
	
	@Override
	public Image find(long id) {
		String imageName = getIndex().get(id);
		byte[] data = Utils.readBinary("entity."+name+"."+id);
		if(data != null) {
			return new Image(imageName, data);
		} else {
			return null;
		}
	}

	@Override
	protected void saveElement(Image e) {
		Utils.saveBinary("entity."+name+"."+e.id(), e.getData());
	}
	
	@Override
	public Stream<Image> stream() {
		throw new UnsupportedOperationException();
	}
}
