package me.andre111.d20server.util;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferInt;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import javax.imageio.ImageIO;

public class ImageUtil {
	public static byte[] toGrayscale(byte[] fileData) {
		try(ByteArrayInputStream is = new ByteArrayInputStream(fileData);
			ByteArrayOutputStream os = new ByteArrayOutputStream()) {
			BufferedImage image = ImageIO.read(is);
			
			BufferedImage source = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_ARGB);
			Graphics2D g2d = source.createGraphics();
			g2d.drawImage(image, 0, 0, null);
			g2d.dispose();
			
			int[] data = ((DataBufferInt) source.getRaster().getDataBuffer()).getData();
			for(int i=0; i<data.length; i++) {
				int a = (data[i] >> 24) & 0xFF;
				int r = (data[i] >> 16) & 0xFF;
				int g = (data[i] >> 8) & 0xFF;
				int b = (data[i] >> 0) & 0xFF;
				int lum = (int) (0.2126*r + 0.7152*g + 0.0722*b);
				data[i] = a << 24 | lum << 16 | lum << 8 | lum;
			}
			
			ImageIO.write(source, "PNG", os);
			return os.toByteArray();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return fileData;
	}
}
