package me.andre111.d20server.template;

import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20common.scripting.Context;
import me.andre111.d20common.scripting.ScriptException;
import me.andre111.d20common.scripting.variable.Variable;
import me.andre111.d20common.scripting.variable.parser.VariableParser;

public class PlaceholderText extends Placeholder {

	@Override
	public String parse(Profile profile, String input) throws ScriptException {
		// find and parse {variables} in string //TODO: Should this happen in normal chat messages or only in templates?
		StringBuilder sb = new StringBuilder();
		int index = 0;
		int startIndex = 0;
		while(startIndex < input.length()) {
			// read normal string
			index = input.indexOf('{', startIndex);
			if(index == -1) index = input.length();
			sb.append(input.substring(startIndex, index));
			startIndex = index;
			
			// read variable
			if(startIndex < input.length()) {
				index = input.indexOf('}', startIndex);
				if(index == -1) throw new ScriptException("Unclosed variable parenthesis");
				index = index + 1;
				String variableName = input.substring(startIndex+1, index-1);
				startIndex = index;
				
				Variable variable = VariableParser.parseVariable(variableName);
				Object value = variable.get(new Context(profile, profile.getMap(), null));
				sb.append(value);
			}
		}
		
		return sb.toString();
	}
}