import { SyntheticDOMNode } from "./synthetic-dom-node";
import { TemplateElement } from "../renderables/template-element";
import { Binding, BindingType } from "../bindings";
import { Component, MappingElement, Templatable } from "../renderables";
import { MappingNode } from "./mapping-node";
import { ComponentInstance } from "../component-instance";


export class TemplateNode implements SyntheticDOMNode<TemplateElement> {
    _bindings: Binding[];
    _bindingElements: NodeListOf<Element>;;
    _previousBindingValues: any[] = null;
    _node: ChildNode;
    _firstChild: ChildNode;

    _componentChildren: ComponentInstance[];

    constructor(templateElement: TemplateElement, target: ChildNode, mappingNodeId: number = undefined) {
        this._node = target;
        this._bindings = templateElement._template._bindings;

        const dom = templateElement._template._templateElement.content.cloneNode(true) as DocumentFragment;
        this._firstChild = dom.firstChild;

        this._bindingElements = dom.querySelectorAll('[bb]');

        this.nodeValue = templateElement;

        if (mappingNodeId) {
            // @ts-ignore
            dom.firstChild.$mappingNodeId = mappingNodeId;
        }

        target.parentElement.insertBefore(dom, target);
    }


    set nodeValue(templateElement: TemplateElement) {
        for (const idx in this._bindings) {
            const value = templateElement._values[idx];
            const prevValue = this._previousBindingValues?.[idx];

            if (this._previousBindingValues && prevValue === value)
                continue;

            const binding = this._bindings[idx];
            const element = this._bindingElements[binding._bindingElementIndex];

            switch (binding._type) {
                case BindingType.Event:
                    // @ts-ignore
                    element[`$${binding._eventName}`] = value;
                    break;
                case BindingType.Attribute:
                    if (value != null && value !== false) {
                        (element as Element).setAttribute(binding._attributeName, value as string);
                    } else {
                        (element as Element).removeAttribute(binding._attributeName);
                    }
                    break;
                case BindingType.Slot:
                    this._setSyntheticDOMChild(value, prevValue, element);
                    break;
                case BindingType.Component:
                    if (!this._componentChildren)
                        this._componentChildren = [];

                    if (!this._componentChildren[idx]) {
                        // TODO support updating component in the same place
                        this._componentChildren[idx] = new ComponentInstance(
                            this, 
                            value as Component, 
                            idx as unknown as number, 
                            binding._initialProps,
                            element as ChildNode
                        );

                        this._componentChildren[idx];
                    }
                    break;
                case BindingType.Prop:
                    this._componentChildren[binding._componentBindingIndex]._props[binding._propertyName] = value;
                    this._componentChildren[binding._componentBindingIndex]._scheduleUpdate();
                    break;
            }
        }

        this._previousBindingValues = templateElement._values;
    }

    _setSyntheticDOMChild(value: any, prevValue: any, element: ChildNode) {
        if (prevValue?.constructor !== value?.constructor || (value as Templatable)?._template !== (prevValue as Templatable)?._template) {
            // @ts-ignore
            element._syntheticDOMNode?.remove?.();
            
            if (value instanceof MappingElement) {
                // @ts-ignore
                element._syntheticDOMNode = new MappingNode(value, element);
            } else if (value instanceof TemplateElement) {
                // @ts-ignore
                element._syntheticDOMNode = new TemplateNode(value, element);
            } else {
                // @ts-ignore
                element._syntheticDOMNode = element.parentElement.insertBefore(
                    document.createTextNode(value), 
                    element
                );
            }
        } else {
            // @ts-ignore
            element._syntheticDOMNode.nodeValue = value;
        }
    }

    remove(customEndNode: ChildNode = null) {
        const whereToEnd = customEndNode || this._node;
        let nextNode = this._firstChild;

        while (nextNode !== whereToEnd) {
            const toRemove = nextNode;
            nextNode = toRemove.nextSibling;
            toRemove.remove();
        }
    }

    _removeInMapping(mappingNodeId: number) {
        let nextNode = this._firstChild;

        
        while (true) {
            const toRemove = nextNode;
            nextNode = toRemove.nextSibling;
            toRemove.remove();

            // @ts-ignore
            if (!nextNode || nextNode.$mappingNodeId === mappingNodeId)
                break;
        }
    }

    _move(newTargetNode: ChildNode, mappingNodeId: number) {
        let nextNode = this._firstChild;

        // @ts-ignore
        while (true) {
            const toMove = nextNode;
            nextNode = toMove.nextSibling;
            newTargetNode.parentElement.insertBefore(toMove, newTargetNode);

            // @ts-ignore
            if (!nextNode || nextNode.$mappingNodeId === mappingNodeId)
                break;
        }

        this._node = newTargetNode;
    }
}