import { ChatService } from '../service/chat-service.js';

export class RollFormatter {
    static formatDiceRoll(profile, rollExpression, showPublic, result, error) {
        // build 'header'
        var text = '<div class="chat-sender">';
        text = text + ChatService.escape(profile.getUsername());
        if(!showPublic) text = text + ' (to GM)';
        text = text + ': ';
        text = text + '</div>';

        text = text + '<span class="hoverable">';
        text = text + '<div class="chat-info">rolling...</div>';
        text = text + '<div class="onhover">' + ChatService.escape(RollFormatter.normalizeExpression(rollExpression)) + '</div>';
        text = text + '</span>';

        // result
        text = text + '<div class="chat-message">';
        if(result) {
            text = text + result.getString() + '<br>';
            text = text + ' = ' + RollFormatter.getResultValue(result);
        } else {
            text = text + ' = ?';
        }
        text = text + '</div>';

        // potential error message
        if(error) {
            text = text + `<div class="chat-info">( ${error} )</div>`;
        }

        return text;
    }

    static formatInlineDiceRoll(rollExpression, result, error) {
        // color format
        var color = '#000000';
        if(result) {
            if(result.hadCriticalFailure() && result.hadCriticalSuccess()) {
                color = '#0000FF';
            } else if(result.hadCriticalFailure()) {
                color = '#FF0000';
            } else if(result.hadCriticalSuccess()) {
                color = '#008800';
            }
        }

        // total value
        var text = `<span style="color:${color}" class="chat-dice-inline hoverable">`;
        if(result) {
            text = text + this.getResultValue(result);
        } else {
            text = text + '?';
        }
        // show full result on hover
        text = text + '<div class="onhover">' + result.getString() + '</div>';
        text = text + '</span>';

        // show expression on hover
        text = text + '<span class="hoverable">';
        text = text + '*';
        text = text + '<div class="onhover">' + ChatService.escape(RollFormatter.normalizeExpression(rollExpression)) + '</div>';
        text = text + '</span>';

        return text;
    }

    static getResultValue(result) {
        if(Math.trunc(result.getValue()) == result.getValue()) {
            return String(Math.trunc(result.getValue()));
        } else {
            return String(result.getValue());
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
