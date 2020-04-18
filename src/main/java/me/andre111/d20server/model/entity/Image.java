package me.andre111.d20server.model.entity;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;

import javax.imageio.ImageIO;

import me.andre111.d20server.model.BaseEntity;
import me.andre111.d20server.model.EntityManager;

public class Image extends BaseEntity {
	private static final byte[] PNG_HEADER = {(byte) 137, 80, 78, 71, 13, 10, 26, 10};
	
	private String name;
	private byte[] data;
	
	public Image(String name, byte[] data) {
		this.name = name;
		this.data = data;
	}
	
	public boolean isValid() {
		// check for png header
		if(data.length < PNG_HEADER.length) return false;
		for(int i=0; i<PNG_HEADER.length; i++) {
			if(data[i] != PNG_HEADER[i]) return false;
		}
		
		// check for valid image data
		try {
			BufferedImage image = ImageIO.read(new ByteArrayInputStream(data));
			return image != null;
		} catch (IOException e) {
			return false;
		}
	}
	
	public byte[] getData() {
		return data;
	}

	@Override
	public void save() {
		EntityManager.IMAGE.save(this);
	}
	
	@Override
	public String getName() {
		return name;
	}
}
