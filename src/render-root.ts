import { TemplateElement } from "./renderables/template-element";
import { TemplateNode } from "./synthetic-dom-node";

// RenderRoot provides minimal automatic event delegation mechanism

const renderRoots: HTMLElement[] = [];
const registeredEvents: string[] = [];

const origStop = Event.prototype.stopPropagation;

Event.prototype.stopPropagation = function () {
    origStop.call(this);
    this.$stopped = true;
}

export const registerEvent = (eventName: string) => {
    if (registeredEvents.includes(eventName)) return;

    for (const _rootElement of renderRoots) {
        _rootElement.addEventListener(eventName, event => {
            for (const element of event.composedPath()) {
                // @ts-ignore
                element['$' + eventName]?.(event);
                // @ts-ignore
                if (event.$stopped)
                    break;
            }
        });
    }
}

export class RenderRoot {
    constructor(public _rootElement: HTMLElement) {
        renderRoots.push(_rootElement);

        _rootElement.appendChild(document.createComment(''));

        for (const eventName of registeredEvents) {
            _rootElement.addEventListener(eventName, event => {
                for (const element of event.composedPath()) {
                    // @ts-ignore
                    element['$' + eventName]?.(event);
                    // @ts-ignore
                    if (event.$stopped)
                        break;
                }
            });
        }
    }

    render(what: TemplateElement) {
        new TemplateNode(what, this._rootElement.firstChild);
    }
}
