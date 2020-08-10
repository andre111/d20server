package me.andre111.d20server;

import me.andre111.d20common.AppType;
import me.andre111.d20common.D20Common;
import me.andre111.d20server.model.EntityManagers;
import me.andre111.d20server.server.GameServer;
import me.andre111.d20server.server.HttpServer;
import me.andre111.d20server.service.GameService;

public class ServerMain {
	public static void main(String[] args) {
		//TODO: replace all System.out.*
		System.out.println("Initializing...");
		D20Common.init(AppType.SERVER, EntityManagers::get);
		GameService.init();
		
		System.out.println("Starting game server...");
		//TODO: set/configure correct ports
		GameServer.start(8081);
		HttpServer.start(8082);
	}
}
