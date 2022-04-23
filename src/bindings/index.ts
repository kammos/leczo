import { PropsMap } from "../renderables";

export const enum BindingType {
    Component,
    Prop,
    Attribute,
    Slot,
    Event,
}

export type ComponentBinding = {
    _type: BindingType.Component;
    _initialProps: PropsMap;
    _bindingElementIndex: number;
}

export type PropBinding = {
    _type: BindingType.Prop;
    _componentBindingIndex: number;
    _propertyName: string;
    _bindingElementIndex: number;
}

export type SlotBinding = {
    _type: BindingType.Slot;
    _bindingElementIndex: number;
}

export type AttributeBinding = {
    _type: BindingType.Attribute;
    _attributeName: string;
    _bindingElementIndex: number;
}

export type EventBinding = {
    _type: BindingType.Event;
    _eventName: string;
    _bindingElementIndex: number;
}

export type Binding = PropBinding 
                     |AttributeBinding
                     |SlotBinding
                     |ComponentBinding
                     |EventBinding;
