package me.andre111.d20server.scripting.expression;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.scripting.ScriptException;
import me.andre111.d20server.util.DiceRoller;

public class Dice implements Expression {
	private final int count;
	private final int sides;

	private Condition criticalFailureCondition;
	private Condition criticalSuccessCondition;
	
	private Condition rerollCondition;
	private int maxRerollCount = 100;
	
	private boolean explodeDice = false;
	private int maxExplodeCount = 100;
	
	private Action lowAction = Action.NOTHING;
	private int lowCount = 0;
	private Action highAction = Action.NOTHING;
	private int highCount = 0;
	
	public Dice(int count, int sides) {
		this.count = count;
		this.sides = sides;

		this.criticalFailureCondition = new Condition(Condition.Type.EQUAL, 1);
		this.criticalSuccessCondition = new Condition(Condition.Type.EQUAL, sides);
	}
	
	public void setCriticalFailureCondition(Condition criticalFailureCondition) {
		this.criticalFailureCondition = criticalFailureCondition;
	}

	public void setCriticalSuccessCondition(Condition criticalSuccessCondition) {
		this.criticalSuccessCondition = criticalSuccessCondition;
	}

	public void setRerollCondition(Condition rerollCondition) {
		this.rerollCondition = rerollCondition;
	}

	public void setMaxRerollCount(int maxRerollCount) {
		this.maxRerollCount = maxRerollCount;
	}

	public void setExplodeDice(boolean explodeDice) {
		this.explodeDice = explodeDice;
	}

	public void setMaxExplodeCount(int maxExplodeCount) {
		this.maxExplodeCount = maxExplodeCount;
	}

	public void setLowAction(Action lowAction) {
		this.lowAction = lowAction;
	}

	public void setLowCount(int lowCount) {
		this.lowCount = lowCount;
	}

	public void setHighAction(Action highAction) {
		this.highAction = highAction;
	}

	public void setHighCount(int highCount) {
		this.highCount = highCount;
	}

	@Override
	public Result eval(Map map, Profile profile) throws ScriptException {
		// calculate all required dice
		List<DiceResult> results = new ArrayList<>();
		for(int i=0; i<count; i++) {
			int roll;
			int explodeCount = 0;
			do {
				// calculate roll
				roll = DiceRoller.roll(sides);
	
				// handle re-rolling
				int rerollCount = 0;
				while(rerollCondition != null && rerollCondition.matches(roll) && rerollCount < maxRerollCount) {
					results.add(new DiceResult(roll, false));
					roll = DiceRoller.roll(sides);
					rerollCount++;
				}
				
				results.add(new DiceResult(roll, true));
			// handle exploding dice
			} while(explodeDice && roll == sides && explodeCount++ < maxExplodeCount);
		}
		
		// apply drop/keep modifiers
		List<DiceResult> sortedResults = new ArrayList<>(results);
		Collections.sort(sortedResults);
		int currentLowCount = 0;
		for(int i=0; i<sortedResults.size(); i++) {
			DiceResult result = sortedResults.get(i);
			if(result.counted) {
				if(lowAction == Action.DROP && currentLowCount < lowCount) {
					result.dropped = true;
				} else if(lowAction == Action.KEEP && currentLowCount >= lowCount) {
					result.kept = false;
				}
				currentLowCount++;
			}
		}
		int currentHighCount = 0;
		for(int i=sortedResults.size()-1; i>=0; i--) {
			DiceResult result = sortedResults.get(i);
			if(result.counted) {
				if(highAction == Action.DROP && currentHighCount < highCount) {
					result.dropped = true;
				} else if(highAction == Action.KEEP && currentHighCount >= highCount) {
					result.kept = false;
				}
				currentHighCount++;
			}
		}
		
		// calculate result
		int value = 0;
		StringBuilder sb = new StringBuilder();
		boolean hadCriticalSuccess = false;
		boolean hadCriticalFailure = false;
		if(results.size() > 1) sb.append("(");
		
		for(int i=0; i<results.size(); i++) {
			DiceResult result = results.get(i);
			// apply value
			if(result.shouldBeIncluded()) {
				value += result.value;
				if(criticalFailureCondition.matches(value)) hadCriticalFailure = true;
				else if(criticalSuccessCondition.matches(value)) hadCriticalSuccess = true;
			}
			
			// build string (with colored misses/crits)
			if(i > 0) {
				sb.append("+");
			}
			sb.append("[group \"order=STACKED;align-vertical=CENTER;align-horizontal=CENTER\"");
			//TODO: better display of uncounted dice
			if(!result.shouldBeIncluded()) sb.append("-----");
			if(sides == 4 || sides == 6 || sides == 8 || sides == 10 || sides == 12 || sides == 20) {
				sb.append("[image \"path=/dice/small/d"+sides+".png\"]");
				appendRollValue(sb, "", result, "");
			} else {
				appendRollValue(sb, "<", result, ">");
			}
			sb.append("]");
		}
		
		if(results.size() > 1) sb.append(")");
		return new Result(value, sb.toString(), hadCriticalFailure, hadCriticalSuccess);
	}

	private void appendRollValue(StringBuilder sb, String prefix, DiceResult result, String postfix) {
		sb.append("[group ");
		sb.append(prefix);
		boolean changedStyle = false;
		if(result.criticalFailure) {
			sb.append("[style \"color=#FF0000\"]");
			changedStyle = true;
		} else if(result.criticalSuccess) {
			sb.append("[style \"color=#008800\"]");
			changedStyle = true;
		}
		sb.append(result.value);
		if(changedStyle) {
			sb.append("[style \"color=#000000\"]");
		}
		sb.append(postfix);
		sb.append("]");
	}
	
	private final class DiceResult implements Comparable<DiceResult> {
		private final int value;
		private final boolean criticalFailure;
		private final boolean criticalSuccess;
		private final boolean counted;
		
		private boolean dropped = false;
		private boolean kept = true;
		
		public DiceResult(int value, boolean counted) {
			this.value = value;
			this.criticalFailure = criticalFailureCondition.matches(value);
			this.criticalSuccess = criticalSuccessCondition.matches(value);
			this.counted = counted;
		}
		
		public boolean shouldBeIncluded() {
			return counted && !dropped && kept;
		}

		@Override
		public int compareTo(DiceResult other) {
			return value - other.value;
		}
	}
	
	public static enum Action {
		NOTHING,
		DROP,
		KEEP;
	}
}
