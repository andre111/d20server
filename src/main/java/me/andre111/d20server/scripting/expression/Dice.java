package me.andre111.d20server.scripting.expression;

import me.andre111.d20common.model.entity.game.Game;
import me.andre111.d20common.model.entity.game.GamePlayer;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.util.DiceRoller;

public class Dice implements Expression {
	private final int count;
	private final int sides;
	
	public Dice(int count, int sides) {
		this.count = count;
		this.sides = sides;
	}

	@Override
	public Result eval(Game game, Map map, GamePlayer player) throws ScriptException {
		int value = 0;
		StringBuilder sb = new StringBuilder();
		if(count > 1) sb.append("(");
		
		for(int i=0; i<count; i++) {
			// calculate roll
			int roll = DiceRoller.roll(sides);
			value += roll;
			
			// build string (with colored misses/crits)
			// TODO: replace <> with image based? dice formatting 
			if(i > 0) {
				sb.append("+");
			}
			if(sides == 4 || sides == 6 || sides == 8 || sides == 10 || sides == 12 || sides == 20) {
				sb.append("[group \"order=STACKED;align-vertical=CENTER;align-horizontal=CENTER\"");
				sb.append("[image \"path=/dice/small/d"+sides+".png\"]");
				appendRollValue(sb, roll);
				sb.append("]");
			} else {
				sb.append("<");
				appendRollValue(sb, roll);
				sb.append(">");
			}
		}
		
		if(count > 1) sb.append(")");
		return new Result(value, sb.toString());
	}

	private void appendRollValue(StringBuilder sb, int roll) {
		boolean changedStyle = false;
		if(roll == 1) {
			sb.append("[style \"color=#FF0000\"]");
			changedStyle = true;
		} else if(roll == sides) {
			sb.append("[style \"color=#008800\"]");
			changedStyle = true;
		}
		sb.append(roll);
		if(changedStyle) {
			sb.append("[style \"color=#000000\"]");
		}
	}
}
