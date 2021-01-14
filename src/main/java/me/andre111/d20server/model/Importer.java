package me.andre111.d20server.model;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.stream.Collectors;

import com.google.gson.reflect.TypeToken;

import me.andre111.d20common.D20Common;
import me.andre111.d20common.model.Entity;
import me.andre111.d20common.util.Utils;

public class Importer {
	public static void importEntities(File directory, boolean overwriteExisting) {
		// import files
		try {
			Path fileDirectory = new File(directory, "/files/").toPath();
			Files.walk(fileDirectory).filter(Files::isRegularFile).forEach(p -> {
				String name = fileDirectory.relativize(p).toString();
				name = name.replace("\\", "/");
				
				try {
					Path target = Paths.get("./data/files/"+name);
					if(!Files.exists(target)) {
						Files.createDirectories(target.getParent());
						Files.copy(p, target, StandardCopyOption.REPLACE_EXISTING);
					}
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			});
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		// import attachments
		Map<Long, Long> attachmentIDMap = importEntities(directory, overwriteExisting, true, "attachment", (originalID, attachment) -> {});
		
		// import actors
		Map<Long, Long> actorIDMap = importEntities(directory, overwriteExisting, true, "actor", (originalID, actor) -> {
			// adjust attachments
			List<Long> attachmentIDs = actor.prop("attachments").getLongList().stream().map(oldID -> attachmentIDMap.get(oldID)).collect(Collectors.toList());
			actor.prop("attachments").setLongList(attachmentIDs);
			
			// adjust token
			Entity token = actor.prop("token").getEntity();
			if(token != null) {
				token.prop("actorID").setLong(actor.id());
				actor.prop("token").setEntity(token);
			}
		});
		
		// TODO: import more stuff
		
		System.out.println("Done");
	}
	
	private static Map<Long, Long> importEntities(File directory, boolean overwriteExisting, boolean nameBased, String entityType, BiConsumer<Long, Entity> entityModifier) {
		System.out.println("Importing "+entityType);
		Map<String, Entity> entityMap = new HashMap<>();
		
		// get existing entities
		ServerEntityManager entityManager = (ServerEntityManager) D20Common.getEntityManager(entityType);
		entityManager.all().forEach(e -> entityMap.put(e.getName(), e));
		
		// keeps track of original -> new id mapping
		Map<Long, Long> idMap = new HashMap<>();
		
		// import entities
		File file = new File(directory, entityType+".json");
		if(!file.exists()) return idMap;

		// disable saving (for faster imports)
		entityManager.setSaveEnabled(false);
		
		Map<Long, Entity> entitiesToImport = Utils.readJson(file, TypeToken.getParameterized(Map.class, Long.class, Entity.class).getType());
		for(Entity entityToImport : entitiesToImport.values()) {
			long originalID = entityToImport.id();
			
			// import entity
			Entity importedEntity = null;
			if(nameBased && entityMap.containsKey(entityToImport.getName())) {
				// by overwriting or keeping existing entities
				if(overwriteExisting) {
					Entity oldEntity = entityMap.get(entityToImport.getName());
					entityToImport.transferIDFrom(oldEntity);
					entityModifier.accept(originalID, entityToImport);
					entityManager.add(entityToImport);
					importedEntity = entityToImport;
				} else {
					importedEntity = entityMap.get(entityToImport.getName());
				}
			} else {
				// by assigning new ids for new entities
				entityToImport.resetID();
				entityModifier.accept(originalID, entityToImport);
				entityManager.add(entityToImport);
				importedEntity = entityToImport;
			}
			entityMap.put(importedEntity.getName(), importedEntity);
			
			// store id mapping
			long newID = importedEntity.id();
			idMap.put(originalID, newID);
		}
		
		// reenable saving (causes automatical save all)
		entityManager.setSaveEnabled(true);
		
		return idMap;
	}
}
