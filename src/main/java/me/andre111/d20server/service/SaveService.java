package me.andre111.d20server.service;

import java.util.concurrent.ConcurrentSkipListSet;
import java.util.concurrent.atomic.AtomicBoolean;

import me.andre111.d20common.D20Common;
import me.andre111.d20server.model.ServerEntityManager;

public abstract class SaveService {
	private static final ConcurrentSkipListSet<String> requestingSave = new ConcurrentSkipListSet<>();
	private static final AtomicBoolean busy = new AtomicBoolean(false);
	
	public static void init() {
		Thread thread = new Thread(SaveService::run, "save-thread");
		thread.start();
	}
	
	public static void requestSave(String type) {
		if(!requestingSave.contains(type)) {
			requestingSave.add(type);
			
			// notify save thread
			synchronized(requestingSave) {
				requestingSave.notifyAll();
			}
		}
	}
	
	public static boolean isBusy() {
		return busy.get() || !requestingSave.isEmpty();
	}
	
	private static void run() {
		while(true) {
			// wait for request (plus 5 second delay to "catch group updates")
			while(requestingSave.isEmpty()) {
				try {
					synchronized(requestingSave) {
						requestingSave.wait();
					}
					Thread.sleep(5 * 1000);
				} catch (InterruptedException e) {
				}
			}
			
			// perform saving (with busy flag to ensure saving is "detected" even when the request set is empty)
			busy.set(true);
			while(!requestingSave.isEmpty()) {
				String type = requestingSave.pollFirst();
				try {
					ServerEntityManager em = (ServerEntityManager) D20Common.getEntityManager(type);
					em.performSave();
				} catch(Exception e) {
					System.err.println("Exception trying to save "+type+": ");
					e.printStackTrace();
				}
				//System.out.println("Saved "+type);
			}
			busy.set(false);
		}
	}
}
