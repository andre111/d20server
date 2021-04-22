import { ParserContext } from '../../parser-context.js';
import { EntityFinderSelf } from '../../finder/entity-finder-self.js';
import { EntityFinderMap } from '../../finder/entity-finder-map.js';
import { VariableParserParent } from './variable-parser-parent.js';
import { VariableParserParentTokenSelected } from './variable-parser-parent-token-selected.js';
import { VariableParserEntityProperty } from './variable-parser-entity-property.js';
import { VariableParserEntityID } from './variable-parser-entity-id.js';
import { VariableParserParentActorToken } from './variable-parser-parent-actor-token.js';
import { VariableParserParentEntityID } from './variable-parser-parent-entity-id.js';

export const rootParser = new VariableParserParent()
    .addChild('selected', new VariableParserParentTokenSelected()
        .addChild('id', new VariableParserEntityID('token'))
        .addChild('property', new VariableParserEntityProperty('token'))
        .addChild('actor', new VariableParserParentActorToken()
            .addChild('id', new VariableParserEntityID('actor'))
            .addChild('property', new VariableParserEntityProperty('actor'))
        )
    )
    .addChild('token', new VariableParserParentEntityID('token')
        .addChild('id', new VariableParserEntityID('token'))
        .addChild('property', new VariableParserEntityProperty('token'))
        .addChild('actor', new VariableParserParentActorToken()
            .addChild('id', new VariableParserEntityID('actor'))
            .addChild('property', new VariableParserEntityProperty('actor'))
        )
    )
    .addChild('actor', new VariableParserParentEntityID('actor')
        .addChild('id', new VariableParserEntityID('actor'))
        .addChild('property', new VariableParserEntityProperty('actor'))
    )
    .addChild('self', new VariableParserParent()
        .addChild('id', new VariableParserEntityID('self'))
        .addChild('property', new VariableParserEntityProperty('self'))
    )
    .addChild('map', new VariableParserParent()
        .addChild('id', new VariableParserEntityID('map'))
        .addChild('property', new VariableParserEntityProperty('map'))
    );
//TODO: in drawing module once server is on node: add a drawing variable parser parent (with id and property)

export const shortcuts = [
    ['sp', 'selected.property'],
    ['sap', 'selected.actor.property']
];

export function parseVariable(name) {
    const context = new ParserContext();
    context.setEntityFinder('self', new EntityFinderSelf());
    context.setEntityFinder('map', new EntityFinderMap());

    var replacedName = name;
    for(const shortcut of shortcuts) {
        if(replacedName.startsWith(shortcut[0])) {
            replacedName = shortcut[1] + replacedName.substring(shortcut[0].length);
        }
    }

    return rootParser.parse(context, name, replacedName);
}
