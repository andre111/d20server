import bcrypt from 'bcrypt';
import { Profile } from '../../common/common.js';

import { backupJson, readJson, saveJson } from '../util/fileutil.js';
import { GameService } from './game-service.js';

// load profiles and set all to disconnected
var profiles = readJson('profiles');
if(!profiles) profiles = {};
for(const [key, profile] of Object.entries(profiles)) {
    profile.setConnected(false);
}
var accessKeys = readJson('accesskeys');
if(!accessKeys) accessKeys = {};

// connection maps
const wsToProfileMap = new Map();
const profileToWSMap = new Map();

export class UserService {
    static addAndSave(profile) {
        profiles[String(profile.getID())] = profile;
        backupJson('profiles');
        saveJson('profiles', profiles);
    }

    static createProfile(username, accessKey, role) {
        // remove outer whitespace
        username = username.trim();
        accessKey = accessKey.trim();

        // validate
        if(!RegExp(/^\w[\w ]*\w/).test(username)) throw new Error('Invalid name');
        if(accessKey.length < 5) throw new Error('Access Key cannot be shorter than 5 characters');

        // check for existing profiles
        if(UserService.findByUsername(username)) throw new Error('Name taken');

        // create profile and save
        const profile = new Profile(username, role);
        UserService.setAccessKey(profile, accessKey);
        UserService.addAndSave(profile);
    }


    static forEach(func) {
        // call func for each connected profile
        for(const profile of Object.values(profiles)) {
            if(profile.isConnected()) func(profile);
        }
    }

    static getAllProfiles() {
        return Object.values(profiles);
    }

    static getProfile(id) {
        return profiles[String(id)];
    }

    static findByUsername(username, ignoreCase = false) {
        if(ignoreCase) username = username.toLowerCase();

        for(const profile of Object.values(profiles)) {
            if(ignoreCase && profile.getUsername().toLowerCase() == username) return profile;
            else if(!ignoreCase && profile.getUsername() == username) return profile;
        }
        return null;
    }

    static getWSFor(profile) {
        return profileToWSMap.get(profile.getID());
    }

    static getProfileFor(ws) {
        return profiles[String(wsToProfileMap.get(ws))];
    }

    static getAccessKey(profile) {
        return accessKeys[String(profile.getID())];
    }

    static setAccessKey(profile, accessKey) {
        accessKeys[String(profile.getID())] = bcrypt.hashSync(accessKey, 10);
        backupJson('accesskeys');
        saveJson('accesskeys', accessKeys);
    }

    static checkAccessKey(profile, accessKey) {
        return bcrypt.compareSync(accessKey, accessKeys[String(profile.getID())]);
    }

    // "callbacks"
    static _onSignIn(profile, ws) {
        if(!profile || !ws) return;

        // disconnect (potentially) existing connection
        if(profileToWSMap.has(profile.getID())) {
            profileToWSMap.get(profile.getID()).terminate();
        }

        // add to maps
        profileToWSMap.set(profile.getID(), ws);
        wsToProfileMap.set(ws, profile.getID());

        // call into main code
        profile.setConnected(true);
        profile.setLastLogin();
        GameService.joinGame(profile);
    }

    static _onSignOut(profile) {
        if(!profile) return;

        // call into main code
        profile.setConnected(false);
        GameService.leaveGame(profile);
        
        // remove from maps
        const ws = profileToWSMap.get(profile.getID());
        profileToWSMap.delete(profile.getID());
        wsToProfileMap.delete(ws);
    }

    static _onDisconnect(ws) {
        const profile = UserService.getProfileFor(ws);
        if(profile) UserService._onSignOut(profile);
    }
}
