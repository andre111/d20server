package me.andre111.d20server.scripting;

import me.andre111.d20common.model.Entity;
import me.andre111.d20common.model.entity.map.Map;
import me.andre111.d20common.model.entity.profile.Profile;

public record Context(Profile profile, Map map, Entity self) {}
