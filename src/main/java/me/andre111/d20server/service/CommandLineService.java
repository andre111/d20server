package me.andre111.d20server.service;

import java.io.File;
import java.util.Scanner;

import me.andre111.d20server.model.Importer;

public abstract class CommandLineService {
	public static void init() {
		Thread thread = new Thread(() -> {
			try(Scanner scanner = new Scanner(System.in)) {
				while(true) {
					String input = scanner.next();
					
					//TODO: generalize
					//TODO: remove
					switch(input) {
					case "debugImport": {
						Importer.importEntities(new File("../d20helper/generated/"), true);
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
