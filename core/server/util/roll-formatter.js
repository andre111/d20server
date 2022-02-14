import { I18N } from '../../common/util/i18n.js';
import { ChatService } from '../service/chat-service.js';

export class RollFormatter {
    static formatDiceRoll(profile, rollExpression, result, appendix = '') {
        // build 'header'
        var text = '<div class="chat-sender">';
        text = text + ChatService.escape(profile.getUsername()) + appendix + ': ';
        text = text + '</div>';

        text = text + '<span class="hoverable">';
        text = text + '<div class="chat-info">' + I18N.get('chat.rolling', 'rolling...') + '</div>';
        text = text + '<div class="onhover">' + ChatService.escape(RollFormatter.normalizeExpression(rollExpression)) + '</div>';
        text = text + '</span>';

        // result
        text = text + '<div class="chat-message">';
        if (result) {
            text = text + result.expr + '<br>';
            text = text + ' = ' + RollFormatter.getResultValue(result);
        } else {
            text = text + ' = ?';
        }
        text = text + '</div>';

        return text;
    }

    static formatInlineDiceRoll(rollExpression, result, diceRolls, error) {
        // check crits
        var hadCriticalFailure = false;
        var hadCriticalSuccess = false;
        for (const roll of diceRolls) {
            if (roll.cf) hadCriticalFailure = true;
            if (roll.cs) hadCriticalSuccess = true;
        }

        // color format
        var color = '#000000';
        if (hadCriticalFailure && hadCriticalSuccess) {
            color = '#0000FF';
        } else if (hadCriticalFailure) {
            color = '#FF0000';
        } else if (hadCriticalSuccess) {
            color = '#008800';
        }

        // total value
        var text = `<span style="color:${color}" class="chat-dice-inline hoverable">`;
        if (result) {
            text = text + this.getResultValue(result);
        } else {
            text = text + '?';
        }
        // show full result on hover
        text = text + `<div class="onhover${!result && error ? ' chat-error' : ''}">` + (result ? result.expr : (error ? error : '')) + '</div>';
        text = text + '</span>';

        // show expression on hover
        text = text + '<span class="hoverable">';
        text = text + '*';
        text = text + '<div class="onhover">' + ChatService.escape(RollFormatter.normalizeExpression(rollExpression)) + '</div>';
        text = text + '</span>';

        return text;
    }

    static getResultValue(result) {
        if (Math.trunc(result.value) == result.value) {
            return String(Math.trunc(result.value));
        } else {
            return String(result.value);
        }
    }

    static normalizeExpression(expression) {
        // prevents double escaping by reverting already escaped characters
        expression = ChatService.unescape(expression);

        expression = expression.replace(/\+/g, ' + ');
        expression = expression.replace(/-/g, ' - ');
        expression = expression.replace(/\*/g, ' * ');
        expression = expression.replace(/\//g, ' / ');
        expression = expression.replace(/\(/g, '( ');
        expression = expression.replace(/,/g, ', ');
        expression = expression.replace(/\)/g, ' )');
        expression = expression.replace(/ +/g, ' ');
        return expression;
    }
}
