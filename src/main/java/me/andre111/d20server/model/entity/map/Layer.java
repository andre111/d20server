package me.andre111.d20server.model.entity.map;

public enum Layer {
	BACKGROUND("Background"),
	MAIN("Main"),
	GMOVERLAY("GM Overlay");
	
	private final String name;
	
	private Layer(String name) {
		this.name = name;
	}
	
	public String getName() {
		return name;
	}
}
