package me.andre111.d20server.model.entity.profile;

import java.time.Instant;

import me.andre111.d20server.model.BaseEntity;

public class LoginLog extends BaseEntity {
	private long profile;
	private Instant date;
	
	@Deprecated // used only by database instantiation
	protected LoginLog() {
	}
	public LoginLog(Profile profile) {
		this.profile = profile.id();
		this.date = Instant.now();
	}
	
	@Override
	public void save() {
		// TODO Auto-generated method stub
		
	}
}
