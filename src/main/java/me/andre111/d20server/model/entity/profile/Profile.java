package me.andre111.d20server.model.entity.profile;

import java.time.Instant;

import org.mindrot.jbcrypt.BCrypt;

import me.andre111.d20server.message.ExcludeFromMessage;
import me.andre111.d20server.model.BaseEntity;
import me.andre111.d20server.model.EntityManager;

public class Profile extends BaseEntity {
	public static Profile findByEmail(String email) {
		return EntityManager.PROFILE.stream().filter(p -> email.equals(p.email)).findAny().orElse(null);
	}
	
	public static Profile findByUsername(String username) {
		return EntityManager.PROFILE.stream().filter(p -> username.equals(p.username)).findAny().orElse(null);
	}
	
	// -------------------------------
	// INSTANCE ATTRIBUTES AND METHODS
	// -------------------------------
	// Note: Always refer to profiles by Integer id in other entities
	// NEVER by direct reference -> that creates new instances
	// separate from UserService
	@ExcludeFromMessage
	private String email;
	@ExcludeFromMessage
	private String password;
	private String username;

	private Role role;

	@ExcludeFromMessage
	private Instant created;
	@ExcludeFromMessage
	private Instant lastLogin;

	public Profile(String email, String password, String username) {
		this.email = email;
		this.password = BCrypt.hashpw(password, BCrypt.gensalt());
		this.username = username;

		this.role = Role.DEFAULT;

		this.created = Instant.now();
		this.lastLogin = created;
	}

	/**
	 * Checks if the provided password is correct for the provided profile.
	 * 
	 * @param profile  the profile
	 * @param password the password
	 * @return true if the password is correct
	 */
	public boolean isPasswordCorrect(String password) {
		return BCrypt.checkpw(password, this.password);
	}
	
	public void setLastLogin() {
		lastLogin = Instant.now();
		save();
	}
	
	public String getUsername() {
		return username;
	}

	@Override
	public void save() {
		EntityManager.PROFILE.save(this);
	}
	
	@Override
	public String getName() {
		return username;
	}

	public static enum Role {
		DEFAULT, SYSTEM, MODERATOR, ADMIN;
	}
}
