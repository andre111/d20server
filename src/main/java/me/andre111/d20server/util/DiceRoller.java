package me.andre111.d20server.util;

import java.security.SecureRandom;

public class DiceRoller {
	private static final SecureRandom random = new SecureRandom();
	
	public static int roll(int sides) {
		return random.nextInt(sides) + 1;
	}
}
