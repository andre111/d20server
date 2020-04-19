package me.andre111.d20server.handler;

import java.util.regex.Pattern;

import io.netty.channel.Channel;
import me.andre111.d20common.message.Message;
import me.andre111.d20common.message.account.RegisterAccount;
import me.andre111.d20common.message.account.SignIn;
import me.andre111.d20common.message.account.SignOut;
import me.andre111.d20common.message.response.ResponseFail;
import me.andre111.d20common.message.response.ResponseOk;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.model.EntityManager;
import me.andre111.d20server.service.MessageService;
import me.andre111.d20server.service.UserService;

public abstract class SimpleMessageHandler {
	private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?");
	private static final Pattern NAME_PATTERN = Pattern.compile("\\w{3,}");
	
	protected static Message handle(Channel channel, Profile profile, Message message) {
		if(message instanceof RegisterAccount) {
			return handleRegisterAccount((RegisterAccount) message);
		} else if(message instanceof SignIn) {
			return handleSignIn(channel, (SignIn) message);
		} else if(message instanceof SignOut) {
			return handleSignOut(profile, (SignOut) message);
		} else {
			System.out.println("Warning: Recieved unhandled message: "+message);
			return null;
		}
	}
	
	private static Message handleRegisterAccount(RegisterAccount message) {
		// remove outer whitespace
		String email = message.getEmail().trim();
		String username = message.getUsername().trim();
		String password = message.getPassword().trim();
		
		// validate
		if(!EMAIL_PATTERN.matcher(email).matches()) {
			return responseFail(message, "Invalid email.");
		}
		if(!NAME_PATTERN.matcher(username).matches()) {
			return responseFail(message, "Invalid username.");
		}
		if(password.length() < 8) {
			return responseFail(message, "Password cannot be shorter than 8 characters.");
		}
		
		// check for existing profiles
		if(UserService.findByEmail(email) != null) {
			return responseFail(message, "Email is allready registered.");
		}
		if(UserService.findByUsername(username) != null) {
			return responseFail(message, "Username taken.");
		}
		
		// create profile and save
		Profile profile = new Profile(email, password, username);
		EntityManager.PROFILE.save(profile);
		return responseOk(message);
	}
	
	private static Message handleSignIn(Channel channel, SignIn message) {
		// remove outer whitespace
		String email = message.getEmail().trim();
		String password = message.getPassword().trim();

		// find profile and verify password
		Profile profile = UserService.findByEmail(email);
		if(profile != null && !profile.isPasswordCorrect(password)) {
			profile = null;
		}
		if(profile == null) {
			return responseFail(message, "Incorrect email or password.");
		}
		
		// sign in on userservice
		MessageService.send(responseOk(message), channel);
		UserService.onSignIn(profile, channel);
		return null;
	}
	
	private static Message handleSignOut(Profile profile, SignOut message) {
		UserService.onSignOut(profile);
		return null;
	}
	
	
	private static Message responseOk(Message to) {
		return new ResponseOk(to);
	}
	private static Message responseFail(Message to, String description) {
		return new ResponseFail(to, description);
	}
}
