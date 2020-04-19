package me.andre111.d20server.message;

import java.lang.reflect.Modifier;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;

import io.github.classgraph.ClassInfo;
import io.github.classgraph.ClassInfoList;
import me.andre111.d20common.util.IOEventEnabler;
import me.andre111.d20common.util.Utils;

public class MessageDecoder {
	private static final Map<String, Class<? extends RecievableMessage>> MESSAGE_TYPES = new HashMap<>();
	private static final Gson gson;
	static {
		GsonBuilder builder = new GsonBuilder();
		builder.registerTypeAdapterFactory(new IOEventEnabler());
		//TODO: register type adapters to decode the messages
		gson = builder.create();
		
		// register all RecievableMessages
		ClassInfoList messageClasses = Utils.CLASSPATH_SCAN.getSubclasses(RecievableMessage.class.getName());
		for(ClassInfo messageClass : messageClasses) {
			registerMessageType(messageClass.loadClass(RecievableMessage.class));
		}
	}
	
	private static void registerMessageType(Class<? extends RecievableMessage> c) {
		if(Modifier.isAbstract(c.getModifiers())) return;
		if(!RecievableMessage.class.isAssignableFrom(c)) return;
		
		if(MESSAGE_TYPES.put(c.getSimpleName(), c) != null) {
			throw new RuntimeException("Duplicated Message Name: "+c.getSimpleName());
		}
	}
	
	public static RecievableMessage decode(String json) {
		try {
			// decode json object
			JsonElement je = JsonParser.parseString(json);
			if(!je.isJsonObject()) throw new IllegalMessageException("Malformed json: not a JsonObject");
			JsonObject jo = je.getAsJsonObject();
			
			// find message type
			Class<? extends RecievableMessage> msgClass;
			JsonElement msg = jo.get("msg");
			if(msg == null || !msg.isJsonPrimitive() || (msgClass = MESSAGE_TYPES.get(msg.getAsString())) == null) {
				throw new IllegalMessageException("Unknown message type: "+msg);
			}
			
			// decode message
			RecievableMessage message = gson.fromJson(jo, msgClass);
			message.postDeserialization();
			return message;
		} catch(JsonSyntaxException e) {
			throw new IllegalMessageException("Malformed json");
		}
	}
}
