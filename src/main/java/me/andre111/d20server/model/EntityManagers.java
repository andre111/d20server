package me.andre111.d20server.model;

import me.andre111.d20common.D20Common;
import me.andre111.d20common.message.game.util.EntityLoading;
import me.andre111.d20common.message.game.util.ServerDefinitions;
import me.andre111.d20common.model.EntityManager;
import me.andre111.d20common.model.TokenListHelper;
import me.andre111.d20common.model.def.Definitions;
import me.andre111.d20common.model.profile.Profile;
import me.andre111.d20server.service.MessageService;

public class EntityManagers {
	//NOTE: This sends the client into the loading state -> send EnterGame after calling this!
	public static void fullSync(Profile profile) {
		// count and send loading info
		int count = 0;
		for(EntityManager manager : D20Common.getAllEntityManagers()) {
			count += ((ServerEntityManager) manager).getAccessibleCount(profile);
		}
		MessageService.send(new EntityLoading(count), profile);
		
		// TODO: weird place, but sync definitions here
		MessageService.send(new ServerDefinitions(Definitions.get()), profile);
		try {
			Thread.sleep(250);
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		// send actual data
		for(EntityManager manager : D20Common.getAllEntityManagers()) {
			((ServerEntityManager) manager).fullSync(profile);
		}
	}
	
	//TODO: remove and make this datadriven (cascade deletion in reference definition)
	static {
		// remove token list entries on token remove
		((ServerEntityManager) D20Common.getEntityManager("token")).addRemovalListener((id, token) -> {
			D20Common.getEntityManager("token_list").all().forEach(tokenList -> {
				if(TokenListHelper.hasValue(tokenList, id)) {
					TokenListHelper.removeToken(tokenList, id);
					D20Common.getEntityManager("token_list").add(tokenList);
				}
			});
		});
		
		// remove tokens and walls on map remove
		((ServerEntityManager) D20Common.getEntityManager("map")).addRemovalListener((id, map) -> {
			((ServerEntityManager) D20Common.getEntityManager("token")).removeAll(token -> token.prop("map").getLong() == id);
			((ServerEntityManager) D20Common.getEntityManager("wall")).removeAll(wall -> wall.prop("map").getLong() == id);
			((ServerEntityManager) D20Common.getEntityManager("drawing")).removeAll(drawing -> drawing.prop("map").getLong() == id);
		});
		
		// remove default token on actor remove
		((ServerEntityManager) D20Common.getEntityManager("actor")).addRemovalListener((id, actor) -> {
			if(actor != null) {
				D20Common.getEntityManager("token").remove(actor.prop("defaultToken").getLong());
			}
		});
	}
}
