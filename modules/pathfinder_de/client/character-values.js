// @ts-check
export const ATTRIBUTES = {
    str: { name: 'Stärke', abr: 'ST' },
    dex: { name: 'Geschicklichkeit', abr: 'GE' },
    con: { name: 'Konstitution', abr: 'KO' },
    int: { name: 'Intelligenz', abr: 'IN' },
    wis: { name: 'Weisheit', abr: 'WE' },
    cha: { name: 'Charisma', abr: 'CH' }
}

export const SAVES = [
    { display: 'Reflex', name: 'Reflex', attribute: 'dex' },
    { display: 'Willen', name: 'Will', attribute: 'wis' },
    { display: 'Zähigkeit', name: 'Fortitude', attribute: 'con' }
];

export const SKILL_LIST = [
    { display: 'Akrobatik', name: 'Acrobatics', attribute: 'dex', hasText: false, macro: 'Fertigkeiten/Akrobatik' },
    { display: 'Auftreten', name: 'Perform1', attribute: 'cha', hasText: true, macro: 'Fertigkeiten/Auftreten 1' },
    { display: 'Auftreten', name: 'Perform2', attribute: 'cha', hasText: true, macro: 'Fertigkeiten/Auftreten 2' },
    { display: 'Beruf', name: 'Profession1', attribute: 'wis', hasText: true, macro: 'Fertigkeiten/Beruf 1' },
    { display: 'Beruf', name: 'Profession2', attribute: 'wis', hasText: true, macro: 'Fertigkeiten/Beruf 2' },
    { display: 'Bluffen', name: 'Bluff', attribute: 'cha', hasText: false, macro: 'Fertigkeiten/Bluffen' },
    { display: 'Diplomatie', name: 'Diplomacy', attribute: 'cha', hasText: false, macro: 'Fertigkeiten/Diplomatie' },
    { display: 'Einschüchtern', name: 'Intimidate', attribute: 'cha', hasText: false, macro: 'Fertigkeiten/Einschüchtern' },
    { display: 'Entfesselungskunst', name: 'EscapeArtist', attribute: 'dex', hasText: false, macro: 'Fertigkeiten/Entfesselungskunst' },
    { display: 'Fingerfertigkeit', name: 'SleightOfHand', attribute: 'dex', hasText: false, macro: 'Fertigkeiten/Fingerfertigkeit' },
    { display: 'Fliegen', name: 'Fly', attribute: 'dex', hasText: false, macro: 'Fertigkeiten/Fliegen' },
    { display: 'Handwerk', name: 'Craft1', attribute: 'int', hasText: true, macro: 'Fertigkeiten/Handwerk 1' },
    { display: 'Handwerk', name: 'Craft2', attribute: 'int', hasText: true, macro: 'Fertigkeiten/Handwerk 2' },
    { display: 'Handwerk', name: 'Craft3', attribute: 'int', hasText: true, macro: 'Fertigkeiten/Handwerk 3' },
    { display: 'Heilkunde', name: 'Heal', attribute: 'wis', hasText: true, macro: 'Fertigkeiten/Heilkunde' },
    { display: 'Heimlichkeit', name: 'Stealth', attribute: 'dex', hasText: false, macro: 'Fertigkeiten/Heimlichkeit' },
    { display: 'Klettern', name: 'Climb', attribute: 'str', hasText: false, macro: 'Fertigkeiten/Klettern' },
    { display: 'Magischen Gegenstand benutzen', name: 'UseMagicDevice', attribute: 'cha', hasText: false, macro: 'Fertigkeiten/Magischen Gegenstand benutzen' },
    { display: 'Mechanismus ausschalten', name: 'DisableDevice', attribute: 'dex', hasText: false, macro: 'Fertigkeiten/Mechanismus ausschalten' },
    { display: 'Mit Tieren umgehen', name: 'HandleAnimal', attribute: 'cha', hasText: false, macro: 'Fertigkeiten/Mit Tieren umgehen' },
    { display: 'Motiv erkennen', name: 'SenseMotive', attribute: 'wis', hasText: false, macro: 'Fertigkeiten/Motiv erkennen' },
    { display: 'Reiten', name: 'Ride', attribute: 'dex', hasText: false, macro: 'Fertigkeiten/Reiten' },
    { display: 'Schätzen', name: 'Appraise', attribute: 'int', hasText: false, macro: 'Fertigkeiten/Schätzen' },
    { display: 'Schwimmen', name: 'Swim', attribute: 'str', hasText: false, macro: 'Fertigkeiten/Schwimmen' },
    { display: 'Sprachenkunde', name: 'Linguistics', attribute: 'int', hasText: false, macro: 'Fertigkeiten/Sprachenkunde' },
    { display: 'Überlebenskunst', name: 'Survival', attribute: 'wis', hasText: false, macro: 'Fertigkeiten/Überlebenskunst' },
    { display: 'Verkleiden', name: 'Disguise', attribute: 'cha', hasText: false, macro: 'Fertigkeiten/Verkleiden' },
    { display: 'Wahrnehmung', name: 'Perception', attribute: 'wis', hasText: false, macro: 'Fertigkeiten/Wahrnehmung' },
    { display: 'Wissen (Adel und Königshäuser)', name: 'KnowledgeNobility', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Adel und Königshäuser' },
    { display: 'Wissen (Arkanes)', name: 'KnowledgeArcana', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Arkanes' },
    { display: 'Wissen (Baukunst)', name: 'KnowledgeEngineering', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Baukunst' },
    { display: 'Wissen (Die Ebenen)', name: 'KnowledgePlanes', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Die Ebenen' },
    { display: 'Wissen (Geographie)', name: 'KnowledgeGeography', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Geographie' },
    { display: 'Wissen (Geschichte)', name: 'KnowledgeHistory', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Geschichte' },
    { display: 'Wissen (Gewölbekunde)', name: 'KnowledgeDungeoneering', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Gewölbekunde' },
    { display: 'Wissen (Lokales)', name: 'KnowledgeLocal', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Lokales' },
    { display: 'Wissen (Natur)', name: 'KnowledgeNature', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Natur' },
    { display: 'Wissen (Religion)', name: 'KnowledgeReligion', attribute: 'int', hasText: false, macro: 'Fertigkeiten (Wissen)/Religion' },
    { display: 'Zauberkunde', name: 'Spellcraft', attribute: 'int', hasText: false, macro: 'Fertigkeiten/Zauberkunde' }
];
