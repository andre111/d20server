package me.andre111.d20server.handler;

import io.netty.channel.Channel;
import me.andre111.d20common.D20Common;
import me.andre111.d20common.message.Message;
import me.andre111.d20common.message.account.RequestAccounts;
import me.andre111.d20common.message.account.SignIn;
import me.andre111.d20common.message.account.SignOut;
import me.andre111.d20common.message.game.PlayerList;
import me.andre111.d20common.message.response.ResponseFail;
import me.andre111.d20common.message.response.ResponseOk;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20server.service.MessageService;
import me.andre111.d20server.service.UserService;

public abstract class SimpleMessageHandler {
	protected static void handle(Channel channel, Profile profile, Message message) {
		if(message instanceof RequestAccounts) {
			handleRequestAccounts(channel, (RequestAccounts) message);
		} else if(message instanceof SignIn) {
			handleSignIn(channel, (SignIn) message);
		} else if(message instanceof SignOut) {
			handleSignOut(profile, (SignOut) message);
		} else {
			System.out.println("Warning: Recieved unhandled message: "+message);
		}
	}
	
	private static void handleRequestAccounts(Channel channel, RequestAccounts message) {
		MessageService.send(new PlayerList(UserService.getAllProfiles()), channel);
	}
	
	private static void handleSignIn(Channel channel, SignIn message) {
		// check version
		if(message.getAppVersion() != D20Common.APP_VERSION) {
			responseFail(channel, message, "Version not matching server.");
			return;
		}
		
		// remove outer whitespace
		String username = message.getUsername().trim();
		String password = message.getPassword().trim();

		// find profile and verify password
		Profile profile = UserService.findByUsername(username);
		if(profile != null && !profile.isPasswordCorrect(password)) {
			profile = null;
		}
		if(profile == null) {
			responseFail(channel, message, "Incorrect username or accesskey.");
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
