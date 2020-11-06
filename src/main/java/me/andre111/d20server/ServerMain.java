package me.andre111.d20server;

import me.andre111.d20common.AppType;
import me.andre111.d20common.D20Common;
import me.andre111.d20server.model.ServerEntityManager;
import me.andre111.d20server.server.HttpServer;
import me.andre111.d20server.service.CommandLineService;
import me.andre111.d20server.service.GameService;
import me.andre111.d20server.service.ModuleService;
import me.andre111.d20server.service.SaveService;

public class ServerMain {
	public static void main(String[] args) {
		//TODO: replace all System.out.*
		System.out.println("Initializing...");
		D20Common.init(AppType.SERVER, ServerEntityManager::new);
		ModuleService.init();
		SaveService.init();
		GameService.init();
		CommandLineService.init();
		
		System.out.println("Starting game server...");
		//TODO: set/configure correct ports
		//GameServer.start(8081);
		HttpServer.start(8082);
	}
}
