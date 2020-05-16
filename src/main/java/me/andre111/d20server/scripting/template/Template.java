package me.andre111.d20server.scripting.template;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20server.scripting.ScriptException;

public class Template {
	private static Map<String, Template> TEMPLATES = new HashMap<>();
	static {
		TEMPLATES.put("attack", loadInternalTemplate("attack"));
		TEMPLATES.put("button", loadInternalTemplate("button"));
	}
	
	public static Template getTemplate(String name) {
		return TEMPLATES.get(name);
	}
	
	private static Template loadInternalTemplate(String name) {
		try(BufferedReader reader = new BufferedReader(new InputStreamReader(Template.class.getResourceAsStream("/templates/"+name+".txt")))) {
			return parseTemplate(reader.lines().collect(Collectors.joining()));
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}
	private static Template parseTemplate(String string) {
		List<TemplateComponent> components = new ArrayList<>();
		
		int startIndex = 0;
		int currentIndex = 0;
		boolean inPlaceholder = false;
		
		while(currentIndex < string.length()) {
			if(string.charAt(currentIndex) == '%') {
				String part = string.substring(startIndex, currentIndex);
					
				if(inPlaceholder) {
					if(part.equals("%")) {
						components.add(new TemplateComponentText("%"));
					} else {
						components.add(new TemplateComponentPlaceholder(Placeholder.get(part)));
					}
					inPlaceholder = false;
					startIndex = currentIndex+1;
				} else {
					components.add(new TemplateComponentText(part));
					inPlaceholder = true;
					startIndex = currentIndex;
				}
			}
			currentIndex++;
		}
		
		// add remaining part
		String part = string.substring(startIndex, currentIndex);
		components.add(new TemplateComponentText(part));
		
		return new Template(components);
	}
	
	// Instance
	private final List<TemplateComponent> components;
	
	private Template(List<TemplateComponent> components) {
		this.components = Collections.unmodifiableList(new ArrayList<>(components));
	}
	
	public String parse(Game game, GamePlayer player, String[] inputs) throws ScriptException {
		// parse arguments
		int currentInput = 0;
		for(TemplateComponent component : components) {
			if(component instanceof TemplateComponentPlaceholder placeholder) {
				if(currentInput >= inputs.length) {
					throw new ScriptException("Too little arguments for placeholder.");
				}
				placeholder.parse(game, player, inputs[currentInput]);
				currentInput++;
			}
		}
		if(currentInput != inputs.length) {
			throw new ScriptException("Too many arguments for placeholder.");
		}
		
		// build string
		StringBuilder sb = new StringBuilder();
		for(TemplateComponent component : components) {
			sb.append(component.getString());
		}
		return sb.toString();
	}
}
