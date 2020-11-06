package me.andre111.d20server.service;

import java.io.File;
import java.util.Scanner;

import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20server.model.Importer;

public abstract class CommandLineService {
	public static void init() {
		Thread thread = new Thread(() -> {
			try(Scanner scanner = new Scanner(System.in)) {
				while(true) {
					String input = scanner.nextLine();
					String[] split = input.split(" ");
					
					switch(split[0]) {
					case "debugImport": {
						//TODO: generalize with an actual good importer
						Importer.importEntities(new File("../d20helper/generated/"), true);
						break;
					}
					case "register": {
						try {
							if(split.length != 4) throw new IllegalArgumentException("Invalid usage.");
							UserService.createProfile(split[1], split[2], Profile.Role.valueOf(split[3]));
							System.out.println("Registered "+split[1]);
						} catch(IllegalArgumentException e) {
							System.out.println(e.getMessage());
							System.out.println("Usage: register <playername> <accesskey> <role(DEEFAULT,GM)>");
						}
						break;
					}
					case "stop": {
						//TODO: cleanly implement stopping
						if(SaveService.isBusy()) {
							System.out.println("Saving in progress, please wait a few seconds and try again...");
						} else {
							System.exit(0);
						}
						break;
					}
					}
				}
			}
		}, "command-line");
		thread.setDaemon(true);
		thread.start();
	}
}
