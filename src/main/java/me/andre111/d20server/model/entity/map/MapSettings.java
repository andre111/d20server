package me.andre111.d20server.model.entity.map;

public class MapSettings {
	private int gridSize = 70;
	private int width = 100;
	private int height = 100;
	private Light light = Light.BRIGHT;
	
	private boolean wallsBlockLight = true;
	private boolean hideWithNoMainToken = true;
	
	public int getGridSize() {
		return gridSize;
	}
	public int getWidth() {
		return width;
	}
	public int getHeight() {
		return height;
	}
	public Light getLight() {
		return light;
	}
	public boolean doWallsBlockLight() {
		return wallsBlockLight;
	}
	public boolean doHideWithNoMainToken() {
		return hideWithNoMainToken;
	}
}
