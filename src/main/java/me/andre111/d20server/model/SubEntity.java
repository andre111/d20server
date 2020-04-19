package me.andre111.d20server.model;

public class SubEntity extends BaseEntity {
	@Override
	public void save() {
		// sub entites are not saved on their own
		throw new UnsupportedOperationException("This entity cann't be saved on its own!");
	}
}
