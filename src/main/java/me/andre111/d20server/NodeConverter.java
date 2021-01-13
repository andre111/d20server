package me.andre111.d20server;

import java.io.File;
import java.io.IOException;

import com.google.common.io.Files;

import me.andre111.d20common.D20Common;
import me.andre111.d20common.model.Entity;
import me.andre111.d20server.model.EntityManagers;
import me.andre111.d20server.model.ServerEntityManager;
import me.andre111.d20server.service.ChatService;

public class NodeConverter {
	public static void convertData() {
		// convert image and audio ids to paths
		((ServerEntityManager) D20Common.getEntityManager("token")).setSaveEnabled(false);
		D20Common.getEntityManager("token").all().forEach(token -> {
			Entity image = D20Common.getEntityManager("image").find(token.prop("imageID").getLong());
			Entity audio = D20Common.getEntityManager("audio").find(token.prop("audioID").getLong());
			
			if(image != null) {
				token.prop("imagePath").setString("/image"+normalizeName(image.getName()));
			}
			if(audio != null) {
				token.prop("audioPath").setString("/audio"+normalizeName(audio.getName()));
			}
		});
		((ServerEntityManager) D20Common.getEntityManager("token")).setSaveEnabled(true);
		((ServerEntityManager) D20Common.getEntityManager("attachment")).setSaveEnabled(false);
		D20Common.getEntityManager("attachment").all().forEach(attachment -> {
			Entity image = D20Common.getEntityManager("image").find(attachment.prop("imageID").getLong());
			
			if(image != null) {
				attachment.prop("imagePath").setString("/image"+normalizeName(image.getName()));
			}
		});
		((ServerEntityManager) D20Common.getEntityManager("attachment")).setSaveEnabled(true);
		
		// save image and audio data to data/files/
		D20Common.getEntityManager("image").all().forEach(image -> {
			File sourceFile = new File("./data/entity/image/"+image.id()+".bin");
			File targetFile = new File("./data/files/image"+normalizeName(image.getName()));
			
			if(!targetFile.exists()) {
				System.out.println("Storing: "+image.getName());
				if(!targetFile.getParentFile().exists()) targetFile.getParentFile().mkdirs();
				
				try {
					Files.copy(sourceFile, targetFile);
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		});
		D20Common.getEntityManager("audio").all().forEach(audio -> {
			File sourceFile = new File("./data/entity/audio/"+audio.id()+".bin");
			File targetFile = new File("./data/files/audio"+normalizeName(audio.getName()));
			
			if(!targetFile.exists()) {
				System.out.println("Storing: "+audio.getName());
				if(!targetFile.getParentFile().exists()) targetFile.getParentFile().mkdirs();
				
				try {
					Files.copy(sourceFile, targetFile);
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		});
		
		// used to force a save to store the required __type attribute for new server
		EntityManagers.fullSave();
		ChatService.forceChatDataSave();
		System.err.println("TODOS:");
		System.err.println("  Create an id.json file in data with a high enough simplge value, e.g: 2000000");
		System.err.println("  Delete the image and audio directories and json files in data/entities");
	}
	
	private static String normalizeName(String name) {
		name = name.replace("Tokens", "tokens");
		if(!name.startsWith("/")) name = "/" + name;
		return name;
	}
}
