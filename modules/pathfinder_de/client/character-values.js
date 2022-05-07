// @ts-check
export const ATTRIBUTES = {
    str: { key: 'pf.char.strength' },
    dex: { key: 'pf.char.dexterity' },
    con: { key: 'pf.char.constitution' },
    int: { key: 'pf.char.intelligence' },
    wis: { key: 'pf.char.wisdom' },
    cha: { key: 'pf.char.charisma' }
}

//TODO: remove display properties (currently still used for accessing the untranslated german macros)
export const SAVES = [
    { display: 'Reflex', name: 'Reflex', attribute: 'dex' },
    { display: 'Willen', name: 'Will', attribute: 'wis' },
    { display: 'Zähigkeit', name: 'Fortitude', attribute: 'con' }
];

export const SKILL_LIST = [
    { name: 'Acrobatics', attribute: 'dex', hasText: false, macro: 'Fertigkeiten/Akrobatik' },
    { name: 'Perform1', attribute: 'cha', hasText: true, macro: 'Fertigkeiten/Auftreten 1' },
    { name: 'Perform2', attribute: 'cha', hasText: true, macro: 'Fertigkeiten/Auftreten 2' },
    { name: 'Profession1', attribute: 'wis', hasText: true, macro: 'Fertigkeiten/Beruf 1' },
    { name: 'Profession2', attribute: 'wis', hasText: true, macro: 'Fertigkeiten/Beruf 2' },
    { name: 'Bluff', attribute: 'cha', hasText: false, macro: 'Fertigkeiten/Bluffen' },
    { name: 'Diplomacy', attribute: 'cha', hasText: false, macro: 'Fertigkeiten/Diplomatie' },
    { name: 'Intimidate', attribute: 'cha', hasText: false, macro: 'Fertigkeiten/Einschüchtern' },
    { name: 'EscapeArtist', attribute: 'dex', hasText: false, macro: 'Fertigkeiten/Entfesselungskunst' },
    { name: 'SleightOfHand', attribute: 'dex', hasText: false, macro: 'Fertigkeiten/Fingerfertigkeit' },
    { name: 'Fly', attribute: 'dex', hasText: false, macro: 'Fertigkeiten/Fliegen' },
    { name: 'Craft1', attribute: 'int', hasText: true, macro: 'Fertigkeiten/Handwerk 1' },
    { name: 'Craft2', attribute: 'int', hasText: true, macro: 'Fertigkeiten/Handwerk 2' },
    { name: 'Craft3', attribute: 'int', hasText: true, macro: 'Fertigkeiten/Handwerk 3' },
    { name: 'Heal', attribute: 'wis', hasText: true, macro: 'Fertigkeiten/Heilkunde' },
    { name: 'Stealth', attribute: 'dex', hasText: false, macro: 'Fertigkeiten/Heimlichkeit' },
    { name: 'Climb', attribute: 'str', hasText: false, macro: 'Fertigkeiten/Klettern' },
    { name: 'UseMagicDevice', attribute: 'cha', hasText: false, macro: 'Fertigkeiten/Magischen Gegenstand benutzen' },
    { name: 'DisableDevice', attribute: 'dex', hasText: false, macro: 'Fertigkeiten/Mechanismus ausschalten' },
    { name: 'HandleAnimal', attribute: 'cha', hasText: false, macro: 'Fertigkeiten/Mit Tieren umgehen' },
    { name: 'SenseMotive', attribute: 'wis', hasText: false, macro: 'Fertigkeiten/Motiv erkennen' },
    { name: 'Ride', attribute: 'dex', hasText: false, macro: 'Fertigkeiten/Reiten' },
    { name: 'Appraise', attribute: 'int', hasText: false, macro: 'Fertigkeiten/Schätzen' },
    { name: 'Swim', attribute: 'str', hasText: false, macro: 'Fertigkeiten/Schwimmen' },
    { name: 'Linguistics', attribute: 'int', hasText: false, macro: 'Fertigkeiten/Sprachenkunde' },
    { name: 'Survival', attribute: 'wis', hasText: false, macro: 'Fertigkeiten/Überlebenskunst' },
    { name: 'Disguise', attribute: 'cha', hasText: false, macro: 'Fertigkeiten/Verkleiden' },
    { name: 'Perception', attribute: 'wis', hasText: false, macro: 'Fertigkeiten/Wahrnehmung' },
    { name: 'KnowledgeNobility', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Adel und Königshäuser' },
    { name: 'KnowledgeArcana', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Arkanes' },
    { name: 'KnowledgeEngineering', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Baukunst' },
    { name: 'KnowledgePlanes', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Die Ebenen' },
    { name: 'KnowledgeGeography', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Geographie' },
    { name: 'KnowledgeHistory', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Geschichte' },
    { name: 'KnowledgeDungeoneering', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Gewölbekunde' },
    { name: 'KnowledgeLocal', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Lokales' },
    { name: 'KnowledgeNature', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Natur' },
    { name: 'KnowledgeReligion', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Religion' },
    { name: 'Spellcraft', attribute: 'int', hasText: false, macro: 'Fertigkeiten/Zauberkunde' }
];
