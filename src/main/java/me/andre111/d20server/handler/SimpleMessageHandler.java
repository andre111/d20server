package me.andre111.d20server.handler;

import java.util.regex.Pattern;

import io.netty.channel.Channel;
import me.andre111.d20common.D20Common;
import me.andre111.d20common.message.Message;
import me.andre111.d20common.message.account.RegisterAccount;
import me.andre111.d20common.message.account.SignIn;
import me.andre111.d20common.message.account.SignOut;
import me.andre111.d20common.message.response.ResponseFail;
import me.andre111.d20common.message.response.ResponseOk;
import me.andre111.d20common.model.entity.profile.Profile;
import me.andre111.d20server.model.EntityManagers;
import me.andre111.d20server.service.MessageService;
import me.andre111.d20server.service.UserService;

public abstract class SimpleMessageHandler {
	private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?");
	private static final Pattern NAME_PATTERN = Pattern.compile("\\w{3,}");
	
	protected static void handle(Channel channel, Profile profile, Message message) {
		if(message instanceof RegisterAccount) {
			handleRegisterAccount(channel, (RegisterAccount) message);
		} else if(message instanceof SignIn) {
			handleSignIn(channel, (SignIn) message);
		} else if(message instanceof SignOut) {
			handleSignOut(profile, (SignOut) message);
		} else {
			System.out.println("Warning: Recieved unhandled message: "+message);
		}
	}
	
	private static void handleRegisterAccount(Channel channel, RegisterAccount message) {
		// check version
		if(message.getAppVersion() != D20Common.APP_VERSION) {
			responseFail(channel, message, "Version not matching server.");
			return;
		}
		
		// remove outer whitespace
		String email = message.getEmail().trim();
		String username = message.getUsername().trim();
		String password = message.getPassword().trim();
		
		// validate
		if(!EMAIL_PATTERN.matcher(email).matches()) {
			responseFail(channel, message, "Invalid email.");
			return;
		}
		if(!NAME_PATTERN.matcher(username).matches()) {
			responseFail(channel, message, "Invalid username.");
			return;
		}
		if(password.length() < 8) {
			responseFail(channel, message, "Password cannot be shorter than 8 characters.");
			return;
		}
		
		// check for existing profiles
		if(UserService.findByEmail(email) != null) {
			responseFail(channel, message, "Email is allready registered.");
			return;
		}
		if(UserService.findByUsername(username) != null) {
			responseFail(channel, message, "Username taken.");
			return;
		}
		
		// create profile and save
		Profile profile = new Profile(email, password, username);
		EntityManagers.get(Profile.class).add(profile);
		responseOk(channel, message);
	}
	
	private static void handleSignIn(Channel channel, SignIn message) {
		// check version
		if(message.getAppVersion() != D20Common.APP_VERSION) {
			responseFail(channel, message, "Version not matching server.");
			return;
		}
		
		// remove outer whitespace
		String email = message.getEmail().trim();
		String password = message.getPassword().trim();

		// find profile and verify password
		Profile profile = UserService.findByEmail(email);
		if(profile != null && !profile.isPasswordCorrect(password)) {
			profile = null;
		}
		if(profile == null) {
			responseFail(channel, message, "Incorrect email or password.");
			return;
		}
		
		// sign in on userservice
		responseOk(channel, message);
		UserService.onSignIn(profile, channel);
	}
	
	private static void handleSignOut(Profile profile, SignOut message) {
		UserService.onSignOut(profile);
	}
	
	
	private static void responseOk(Channel channel, Message to) {
		MessageService.send(new ResponseOk(to), channel);
	}
	private static void responseFail(Channel channel, Message to, String description) {
		MessageService.send(new ResponseFail(to, description), channel);
	}
}
