package me.andre111.d20server.message.account;

import me.andre111.d20server.message.Message;
import me.andre111.d20server.message.RecievableMessage;
import me.andre111.d20server.service.UserService;

public class SignOut extends RecievableMessage {

	@Override
	public Message handle() {
		UserService.onSignOut(getProfile());
		return null;
	}

}
