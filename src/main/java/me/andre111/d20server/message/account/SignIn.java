package me.andre111.d20server.message.account;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.message.RecievableMessage;
import me.andre111.d20server.message.UnauthenticatedMessage;
import me.andre111.d20server.model.entity.profile.Profile;
import me.andre111.d20server.service.MessageService;
import me.andre111.d20server.service.UserService;

public class SignIn extends RecievableMessage implements UnauthenticatedMessage {
	private String email;
	private String password;

	@Override
	public Message handle() {
		// remove outer whitespace
		email = email.trim();
		password = password.trim();

		// find profile and verify password
		Profile profile = Profile.findByEmail(email);
		if(profile != null && !profile.isPasswordCorrect(password)) {
			profile = null;
		}
		if(profile == null) {
			return responseFail("Incorrect email or password.");
		}
		
		// sign in on userservice
		MessageService.send(responseOk(), getChannel());
		UserService.onSignIn(profile, getChannel());
		return null;
	}

}
