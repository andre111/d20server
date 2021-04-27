import { registerType } from '../util/datautil.js';
import { Access, Type } from '../constants.js';

//TODO: verify values are actually of correct type!
export class Property {
    _transient_holder = null;
    _transient_name = '';

    type = Type.STRING;

    value = '';

    constructor(type, value) {
        this.type = type;

        this.value = ''+value;
    }

    getHolder() {
        return this._transient_holder;
    }
    setHolder(holder) {
        this._transient_holder = holder;
    }
    getName() {
        return this._transient_name;
    }
    setName(name) {
        this._transient_name = name;
    }

    getType() {
        return this.type;
    }
    getEditAccess() {
        return this._transient_holder.getPropertyEditAccess(this._transient_name);
    }
    getViewAccess() {
        return this._transient_holder.getPropertyViewAccess(this._transient_name);
    }

    getInternal() {
        return this.value;
    }
    setInternal(value) {
        if(this.value === value) return;

        this.value = value;
        if(this._transient_holder) this._transient_holder.onPropertyChange(this._transient_name, this);
    }

    getString() {
        this.checkType(Type.STRING);
        return this.getInternal();
    }
    setString(value) {
        this.checkType(Type.STRING);
        this.setInternal(value);
    }

    getLong() {
        this.checkType(Type.LONG);
        return Number(this.getInternal());
    }
    setLong(value) {
        this.checkType(Type.LONG);
        this.setInternal(String(Math.trunc(value)));
    }

    getBoolean() {
        this.checkType(Type.BOOLEAN);
        return this.getInternal() == 'true';
    }
    setBoolean(value) {
        this.checkType(Type.BOOLEAN);
        this.setInternal(String(value));
    }

    getDouble() {
        this.checkType(Type.DOUBLE);
        return Number(this.getInternal());
    }
    setDouble(value) {
        this.checkType(Type.DOUBLE);
        this.setInternal(String(value));
    }

    getLongList() {
        this.checkType(Type.LONG_LIST);
        if(!this.getInternal() || this.getInternal() == '') return [];
        return this.getInternal().split(';').map(s => Number(s));
    }
    setLongList(value) {
        this.checkType(Type.LONG_LIST);
        this.setInternal(value.join(';')); //TODO: cast/round to long
    }

    getStringMap() {
        this.checkType(Type.STRING_MAP);
        if(!this.getInternal() || this.getInternal() == '') return {};

        var map = {};
        var split = this.getInternal().split('§');
        for(var i=0; i<split.length-1; i+=2) {
            map[split[i]] = split[i+1];
        }
        return map;
    }
    setStringMap(value) {
        this.checkType(Type.STRING_MAP);
        
        var string = '';
        for(const [key, entry] of Object.entries(value)) {
            string = string + key.replace('§', '') + '§' + entry.replace('§', '') + '§';
        }
        this.setInternal(string);
    }

    getLayer() {
        this.checkType(Type.LAYER);
        return this.getInternal();
    }
    setLayer(value) {
        this.checkType(Type.LAYER);
        this.setInternal(value);
    }

    getLight() {
        this.checkType(Type.LIGHT);
        return this.getInternal();
    }
    setLight(value) {
        this.checkType(Type.LIGHT);
        this.setInternal(value);
    }

    getEffect() {
        this.checkType(Type.EFFECT);
        return this.getInternal();
    }
    setEffect(value) {
        this.checkType(Type.EFFECT);
        this.setInternal(value);
    }

    getColor() {
        this.checkType(Type.COLOR);
        return '#' + (Number(this.getInternal()) & 0x00FFFFFF).toString(16).padStart(6, '0');
    }
    setColor(value) {
        this.checkType(Type.COLOR);
        this.setInternal(String(parseInt(value.substring(1), 16)));
    }

    getAccessValue() {
        this.checkType(Type.ACCESS);
        return this.getInternal();
    }
    setAccessValue(value) {
        this.checkType(Type.ACCESS);
        this.setInternal(value);
    }

    //TODO: checkValue(value) (called hasValidValue in old code)
    hasValidValue() {
        //TODO: actual implementation
        return true;
    }

    transferTo(other) {
        this.checkType(other.type);
        other.setInternal(this.getInternal());
    }
    clone() {
        const clone = new Property(this.getType(), this.getInternal());
        clone.setName(this.getName());
        return clone;
    }

    canView(accessLevel) {
        return Access.matches(this.getViewAccess(), accessLevel);
    }
    canEdit(accessLevel) {
        return Access.matches(this.getEditAccess(), accessLevel);
    }

    checkType(requiredType) {
        if(this.type != requiredType) throw new Error(`Property is of wrong type, required ${requiredType} but is ${this.type}`);
    }
}
registerType(Property);
