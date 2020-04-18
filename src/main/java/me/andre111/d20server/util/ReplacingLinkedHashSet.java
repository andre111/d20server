package me.andre111.d20server.util;

import java.util.LinkedHashSet;

public class ReplacingLinkedHashSet<T> extends LinkedHashSet<T> {
	private static final long serialVersionUID = -23153470316087907L;

	@SuppressWarnings("unchecked")
	public boolean update(T t) {
		if(contains(t)) {
			// replace existing entry
			T[] entries = (T[]) toArray();
			clear();
			for(T entry : entries) {
				if(entry.equals(t)) {
					add(t);
				} else {
					add(entry);
				}
			}
			return true;
		} else {
			add(t);
			return false;
		}
	}
}
