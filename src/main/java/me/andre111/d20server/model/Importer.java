package me.andre111.d20server.model;

import java.io.File;
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
		// import images and audio (with copying of the actual data)
		Map<Long, Long> imageIDMap = importEntities(directory, overwriteExisting, true, "image", (originalID, image) -> {
			File sourceFile = new File(directory, "image"+File.separator+originalID+".bin");
			byte[] data = Utils.readBinary(sourceFile);
			Utils.saveBinary("entity.image."+image.id(), data);
		});
		Map<Long, Long> audioIDMap = importEntities(directory, overwriteExisting, true, "audio", (originalID, audio) -> {
			File sourceFile = new File(directory, "audio"+File.separator+originalID+".bin");
			byte[] data = Utils.readBinary(sourceFile);
			Utils.saveBinary("entity.audio."+audio.id(), data);
		});
		
		// import attachments
		Map<Long, Long> attachmentIDMap = importEntities(directory, overwriteExisting, true, "attachment", (originalID, attachment) -> {
			long imageID = attachment.prop("imageID").getLong();
			if(imageID > 0) {
				attachment.prop("imageID").setLong(imageIDMap.get(imageID));
			}
		});
		
		// import tokens
		Map<Long, Long> tokenIDMap = importEntities(directory, overwriteExisting, false, "token", (originalID, token) -> {
			long imageID = token.prop("imageID").getLong();
			if(imageID > 0) {
				token.prop("imageID").setLong(imageIDMap.get(imageID));
			}
			
			long audioID = token.prop("audioID").getLong();
			if(audioID > 0) {
				token.prop("audioID").setLong(audioIDMap.get(audioID));
			}
		});
		
		// import actors
		Map<Long, Long> actorIDMap = importEntities(directory, overwriteExisting, true, "actor", (originalID, actor) -> {
			// adjust attachments
			List<Long> attachmentIDs = actor.prop("attachments").getLongList().stream().map(oldID -> attachmentIDMap.get(oldID)).collect(Collectors.toList());
			actor.prop("attachments").setLongList(attachmentIDs);
			
			// adjust default token
			long tokenID = actor.prop("defaultToken").getLong();
			if(tokenID > 0) {
				actor.prop("defaultToken").setLong(tokenIDMap.get(tokenID));
			}
		});
		
		// deferred until actors exist: adjust token actors
		ServerEntityManager tokenEM = (ServerEntityManager) D20Common.getEntityManager("token");
		tokenEM.setSaveEnabled(false);
		for(long tokenID : tokenIDMap.values()) {
			Entity token = tokenEM.find(tokenID);
			
			// adjust actor
			long actorID = token.prop("actorID").getLong();
			if(actorID > 0) {
				token.prop("actorID").setLong(actorIDMap.get(actorID));
				tokenEM.add(token);
			}
		}
		// reenable saving (causes automatical save all)
		tokenEM.setSaveEnabled(true);
		
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
					entityToImport.transferIDFrom(entityMap.get(entityToImport.getName()));
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
