package me.andre111.d20server.message.account;

import java.util.regex.Pattern;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.message.RecievableMessage;
import me.andre111.d20server.message.UnauthenticatedMessage;
import me.andre111.d20server.model.entity.profile.Profile;

//TODO: throttle account creation
public class RegisterAccount extends RecievableMessage implements UnauthenticatedMessage {
	private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?");
	private static final Pattern NAME_PATTERN = Pattern.compile("\\w{3,}");
	
	private String email;
	private String username;
	private String password;
	
	@Override
	public Message handle() {
		// remove outer whitespace
		email = email.trim();
		username = username.trim();
		password = password.trim();
		
		// validate
		if(!EMAIL_PATTERN.matcher(email).matches()) {
			return responseFail("Invalid email.");
		}
		if(!NAME_PATTERN.matcher(username).matches()) {
			return responseFail("Invalid username.");
		}
		if(password.length() < 8) {
			return responseFail("Password cannot be shorter than 8 characters.");
		}
		
		// check for existing profiles
		if(Profile.findByEmail(email) != null) {
			return responseFail("Email is allready registered.");
		}
		if(Profile.findByUsername(username) != null) {
			return responseFail("Username taken.");
		}
		
		// create profile and save
		new Profile(email, password, username).save();
		return responseOk();
	}

}
