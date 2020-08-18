package me.andre111.d20server.model;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.stream.Collectors;

import com.google.gson.reflect.TypeToken;

import me.andre111.d20common.model.Entity;
import me.andre111.d20common.model.entity.Audio;
import me.andre111.d20common.model.entity.Image;
import me.andre111.d20common.model.entity.actor.Actor;
import me.andre111.d20common.model.entity.actor.Attachment;
import me.andre111.d20common.model.entity.map.Token;
import me.andre111.d20common.util.Utils;

public class Importer {
	public static void importEntities(File directory, boolean overwriteExisting) {
		// import images and audio (with copying of the actual data)
		Map<Long, Long> imageIDMap = importEntities(directory, overwriteExisting, Image.class, (originalID, image) -> {
			File sourceFile = new File(directory, "image"+File.separator+originalID+".bin");
			byte[] data = Utils.readBinary(sourceFile);
			Utils.saveBinary("entity.image."+image.id(), data);
		});
		Map<Long, Long> audioIDMap = importEntities(directory, overwriteExisting, Audio.class, (originalID, audio) -> {
			File sourceFile = new File(directory, "audio"+File.separator+originalID+".bin");
			byte[] data = Utils.readBinary(sourceFile);
			Utils.saveBinary("entity.audio."+audio.id(), data);
		});
		
		// import attachments
		Map<Long, Long> attachmentIDMap = importEntities(directory, overwriteExisting, Attachment.class, (originalID, attachment) -> {
			long imageID = attachment.prop("imageID").getLong();
			if(imageID > 0) {
				attachment.prop("imageID").setLong(imageIDMap.get(imageID));
			}
		});
		
		// import actors
		importEntities(directory, overwriteExisting, Actor.class, (originalID, actor) -> {
			// adjust attachments
			List<Long> attachmentIDs = actor.prop("attachments").getLongList().stream().map(oldID -> attachmentIDMap.get(oldID)).collect(Collectors.toList());
			actor.prop("attachments").setLongList(attachmentIDs);
			
			// adjust default token
			Token defaultToken = actor.getDefaultToken();
			if(defaultToken != null) {
				defaultToken.prop("actorID").setLong(actor.id());
				
				long imageID = defaultToken.prop("imageID").getLong();
				if(imageID > 0) {
					defaultToken.prop("imageID").setLong(imageIDMap.get(imageID));
				}
				
				long audioID = defaultToken.prop("audioID").getLong();
				if(audioID > 0) {
					defaultToken.prop("audioID").setLong(audioIDMap.get(audioID));
				}
			}
		});
		
		// TODO: import more stuff
		
		System.out.println("Done");
	}
	
	private static <E extends Entity> Map<Long, Long> importEntities(File directory, boolean overwriteExisting, Class<E> entityType, BiConsumer<Long, E> entityModifier) {
		System.out.println("Importing "+entityType.getSimpleName());
		Map<String, E> entityMap = new HashMap<>();
		
		// get existing entities
		ServerEntityManager<E> entityManager = EntityManagers.get(entityType);
		entityManager.all().forEach(e -> entityMap.put(e.getName(), e));
		
		// keeps track of original -> new id mapping
		Map<Long, Long> idMap = new HashMap<>();
		
		// import entities
		File file = new File(directory, entityManager.name+".json");
		if(!file.exists()) return idMap;

		// disable saving (for faster imports)
		entityManager.setSaveEnabled(false);
		
		Map<Long, E> entitiesToImport = Utils.readJson(file, TypeToken.getParameterized(Map.class, Long.class, entityType).getType());
		for(E entityToImport : entitiesToImport.values()) {
			long originalID = entityToImport.id();
			
			// import entity
			E importedEntity = null;
			if(entityMap.containsKey(entityToImport.getName())) {
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
