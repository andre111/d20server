package me.andre111.d20server.model.entity.map.property;

import me.andre111.d20server.model.entity.map.Layer;

public class Property {
	private Type type;
	private Access editAccess;
	private Access viewAccess;
	
	private String value;
	
	public Property(Type type, Access editAccess, Access viewAccess, Object value) {
		this.type = type;
		this.editAccess = editAccess;
		this.viewAccess = viewAccess;
		
		this.value = value.toString();
	}
	
	public Type getType() {
		return type;
	}
	public Access getEditAccess() {
		return editAccess;
	}
	public void setEditAccess(Access editAccess) {
		this.editAccess = editAccess;
	}
	public Access getViewAccess() {
		return viewAccess;
	}
	public void setViewAccess(Access viewAccess) {
		this.viewAccess = viewAccess;
	}
	
	public String getString() {
		checkType(Type.STRING);
		return value;
	}
	public void setString(String value) {
		checkType(Type.STRING);
		this.value = value;
	}
	
	public long getLong() {
		checkType(Type.LONG);
		return Long.parseLong(value);
	}
	public void setLong(long value) {
		checkType(Type.LONG);
		this.value = Long.toString(value);
	}
	
	public boolean getBoolean() {
		checkType(Type.BOOLEAN);
		return Boolean.parseBoolean(value);
	}
	public void setBoolean(boolean value) {
		checkType(Type.BOOLEAN);
		this.value = Boolean.toString(value);
	}
	
	public double getDouble() {
		checkType(Type.DOUBLE);
		return Double.parseDouble(value);
	}
	public void setDouble(double value) {
		checkType(Type.DOUBLE);
		this.value = Double.toString(value);
	}
	
	public long getPlayerID() {
		checkType(Type.PLAYER);
		return Long.parseLong(value);
	}
	public void setPlayerID(long value) {
		checkType(Type.PLAYER);
		this.value = Long.toString(value);
	}
	
	public Layer getLayer() {
		checkType(Type.LAYER);
		return Layer.valueOf(value);
	}
	public void setLayer(Layer layer) {
		checkType(Type.LAYER);
		this.value = layer.toString();
	}
	
	public void transferTo(Property other) {
		checkType(other.type);
		other.value = value;
	}
	
	public boolean canView(Access accessLevel) {
		return accessLevel.ordinal() >= viewAccess.ordinal();
	}
	public boolean canEdit(Access accessLevel) {
		return accessLevel.ordinal() >= editAccess.ordinal();
	}
	
	private void checkType(Type requiredType) {
		if(type != requiredType) throw new UnsupportedOperationException("Property is of wrong type, required "+requiredType+" but is "+type);
	}
}
