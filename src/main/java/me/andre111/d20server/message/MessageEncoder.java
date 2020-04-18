package me.andre111.d20server.message;

import com.google.gson.ExclusionStrategy;
import com.google.gson.FieldAttributes;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import me.andre111.d20server.util.IOEventEnabler;

public class MessageEncoder {
	private static final Gson gson;
	static {
		GsonBuilder builder = new GsonBuilder();
		builder.setExclusionStrategies(new ExcludeFromMessageStrategy());
		builder.registerTypeAdapterFactory(new IOEventEnabler());
		//TODO: register type adapters to encode the messages
		gson = builder.create();
	}

	
	public static String encode(Message message) {
		message.preSerialization();
		
		return gson.toJson(message);
	}

	private static final class ExcludeFromMessageStrategy implements ExclusionStrategy {
		@Override
		public boolean shouldSkipField(FieldAttributes f) {
			return f.getAnnotation(ExcludeFromMessage.class) != null;
		}

		@Override
		public boolean shouldSkipClass(Class<?> clazz) {
			return false;
		}
	}
}
