import { Component, PropsMap, Renderable } from "../renderables"
import { TemplateNode } from "../synthetic-dom-node"

let currentComponent: ComponentInstance;
let hookIndex: number;

export class ComponentInstance {
    _props: PropsMap;
    _updateRequested = false;
    _state: any[] = [];
    _prevRenderable: Renderable;

    constructor(
        public _node: TemplateNode, 
        public _component: Component, 
        public _idx: number, 
        _initialProps: PropsMap, 
        public _element: ChildNode
    ) {
        this._props = {..._initialProps};
        this._scheduleUpdate();
    }

    async _scheduleUpdate() {
        if (!this._updateRequested) {
            this._updateRequested = true;
            await 0;
            currentComponent = this;
            hookIndex = 0;
            const renderable = this._component(this._props);
            this._node._setSyntheticDOMChild(renderable, this._prevRenderable, this._element);
            this._prevRenderable = renderable;
            this._updateRequested = false;
        }
    }
}


export const useState = (initialValue: any) => {
    if (currentComponent._state.length <= hookIndex) {
        const preservedHookIndex = hookIndex;
        const preservedCurrentComponent = currentComponent;

        currentComponent._state[preservedHookIndex] = typeof initialValue === 'function' ? initialValue() : initialValue;

        currentComponent._state[preservedHookIndex + 1] = (newValue: (arg0: any) => any) => {
            preservedCurrentComponent._state[preservedHookIndex] = typeof newValue === 'function'
                ? newValue(preservedCurrentComponent._state[preservedHookIndex])
                : newValue;
            preservedCurrentComponent._scheduleUpdate();
        }
    }

    return [
        currentComponent._state[hookIndex++],
        currentComponent._state[hookIndex++]
    ];
}

export const useRef = (initialValue: any) => {
    if (currentComponent._state.length <= hookIndex) {
        currentComponent._state[hookIndex] = { current: initialValue };
    }

    return currentComponent._state[hookIndex++];
}
