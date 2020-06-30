package me.andre111.d20server.scripting;

public class ParserContext {
	private TokenFinder tokenFinder;
	private ActorFinder actorFinder;

	public TokenFinder getTokenFinder() {
		return tokenFinder;
	}

	public void setTokenFinder(TokenFinder tokenFinder) {
		this.tokenFinder = tokenFinder;
	}

	public ActorFinder getActorFinder() {
		return actorFinder;
	}

	public void setActorFinder(ActorFinder actorFinder) {
		this.actorFinder = actorFinder;
	}
}
