package me.andre111.d20server;

import me.andre111.d20server.server.GameServer;
import me.andre111.d20server.server.HttpServer;
import me.andre111.d20server.service.GameService;
import me.andre111.d20server.util.Utils;

public class ServerMain {
	public static void main(String[] args) {
		//TODO: replace all System.out.*
		System.out.println("Initializing...");
		Utils.init();
		GameService.init();
		
		System.out.println("Starting game server...");
		//TODO: set/configure correct ports
		GameServer.start(8081);
		HttpServer.start(8082);
	}
}
