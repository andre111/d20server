package me.andre111.d20server.message;

import io.netty.channel.Channel;
import me.andre111.d20server.message.util.ResponseFail;
import me.andre111.d20server.message.util.ResponseOk;
import me.andre111.d20server.model.entity.profile.Profile;
import me.andre111.d20server.service.UserService;

public abstract class RecievableMessage extends Message {
	private transient Channel channel;
	private transient Profile profile;

	/**
	 * Stores source channel and profile for this message. When the channel is not
	 * authenticated, throws an IllegalMessageException for any message not
	 * implementing UnauthenticatedMessage.
	 * 
	 * @param channel the source channel
	 */
	public final void initSource(Channel channel) {
		this.channel = channel;

		if (!(this instanceof UnauthenticatedMessage)) {
			profile = UserService.getProfileFor(channel);
			if (profile == null) {
				throw new IllegalMessageException("Not authenticated");
			}
		}

		init();
	}

	/**
	 * Called after initializing the source. Perform more checks here.
	 */
	public void init() {
	}

	public Channel getChannel() {
		return channel;
	}

	public Profile getProfile() {
		return profile;
	}

	/**
	 * Handles the message and returns an optional response.
	 * 
	 * @return the response or null
	 */
	public abstract Message handle();

	/**
	 * Shorthand method to create a ResponseOk for this message.
	 * 
	 * @return the response message
	 */
	protected Message responseOk() {
		return new ResponseOk(this);
	}

	/**
	 * Shorthand method to create a ResponseFail for this message.
	 * 
	 * @param description optional description
	 * @return the response message
	 */
	protected Message responseFail(String description) {
		return new ResponseFail(this, description);
	}
}
