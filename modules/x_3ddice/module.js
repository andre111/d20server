Events.on("createMainHTML", state => {
    _g.diceRoller = new DiceRoller();
});

Events.on("chatMessage", evt => {
    if(evt.canceled) return;
    
    // catch chat entries with rolls and that are not in the past
    if(!evt.entry.rolls) return;
    if(evt.entry.rolls.length == 0) return;
    if(evt.historical) return;
    
    // cancel the event to avoid showing the result instantly
    evt.canceled = true;
    
    // throw dice and only add chat entry once they are done
    var t = [
        {
            dice: evt.entry.rolls,
            done: () => {
                SidepanelManager.getTab("chat").add(evt.entry);
            }
        }
    ];
    _g.diceRoller.addThrows(t, true);
});

Events.on("frameEnd", () => {
    _g.diceRoller.onFrame();
});
