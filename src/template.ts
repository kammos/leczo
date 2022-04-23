import { Binding, BindingType } from "./bindings";
import { registerEvent } from "./render-root";
import { PropsMap } from "./renderables";

const cache: WeakMap<TemplateStringsArray, Template> = new WeakMap();

const attributeMarker = (n: number) =>
    `$bX${n} bb`;

const slotMarker = (n: number) =>
    `<SCRIPT bb _i=${n}></SCRIPT>`;

const componentMarker = (n: number) =>
    `SCRIPT bb _c _i=${n}`;

const walker = document.createTreeWalker(document, 4); // only text

export class Template {
    _templateElement: HTMLTemplateElement;
    _bindings: Binding[] = [];
    _bindingElementIndices: number[] = [];

    constructor(strings: TemplateStringsArray, exampleValues: unknown[]) {
        let templateHTML = strings[0];
        let bindingIndex = 0;

        for (let i = 1; i < strings.length; i++) {
            switch (strings[i - 1][strings[i - 1].length - 1]) {
                case '<':
                    templateHTML += componentMarker(bindingIndex);
                    break;
                case '=':
                    templateHTML += attributeMarker(bindingIndex);
                    break;
                default:
                    templateHTML += slotMarker(bindingIndex);
            }

            bindingIndex++;

            templateHTML += strings[i];
        }

        this._templateElement = document.createElement('template');
        const html = templateHTML.trim().replaceAll('<//>', '</SCRIPT>');
        this._templateElement.innerHTML = html;

        // TODO does this need to exist still
        if ((this._templateElement.content.firstChild as Element).tagName === 'SCRIPT') {
            this._templateElement.content.insertBefore(document.createElement('SCRIPT'), this._templateElement.content.firstChild);
        }

        // TODO check if terser plugin doesn't achieve the same
        walker.currentNode = this._templateElement.content;
        let nextNode = walker.nextNode();

        while (nextNode) {
            const node = nextNode;
            nextNode = walker.nextNode();

            if (node.nodeValue.trim().length === 0) {
                node.parentNode.removeChild(node);
            }
        }

        const bindingElements = this._templateElement.content.querySelectorAll('[bb]');

        for (let bindingElementIndex = 0; bindingElementIndex < bindingElements.length; bindingElementIndex++) {
            const element = bindingElements[bindingElementIndex];
            const props: PropsMap = element.hasAttribute('_c') ? {} : null;
            const slotTypeBindingIndex = element.getAttribute('_i') as unknown as number;
            const isScript = element.tagName === 'SCRIPT';
            const toRemove: Attr[] = [];

            if (props) {
                this._bindings[slotTypeBindingIndex] = {
                    _type: BindingType.Component,
                    _initialProps: props,
                    _bindingElementIndex: bindingElementIndex,
                };
            } else if (isScript) {
                this._bindings[slotTypeBindingIndex] = {
                    _type: BindingType.Slot,
                    _bindingElementIndex: bindingElementIndex,
                };
            }

            for (const attribute of element.attributes) {
                if (attribute.name[0] === '_') {
                    toRemove.push(attribute);
                    continue;
                }

                if (!attribute.value.startsWith('$bX')) {
                    if (props) {
                        props[attribute.name] = attribute.value;
                    }
                } else {
                    const bindingIndex = attribute.value.split('X')[1] as unknown as number;
                    
                    if (props) {
                        this._bindings[bindingIndex] = {
                            _type: BindingType.Prop,
                            _componentBindingIndex: slotTypeBindingIndex,
                            _propertyName: attribute.name,
                            _bindingElementIndex: bindingElementIndex,
                        };
                    } else if (typeof exampleValues[bindingIndex] === 'function') {
                        this._bindings[bindingIndex] = {
                            _type: BindingType.Event,
                            _eventName: attribute.name,
                            _bindingElementIndex: bindingElementIndex,
                        };
                        // TODO some events don't bubble, they could be handled by introducing a new binding type
                        // wouldn't work with non-bubbling custom events
                        registerEvent(attribute.name);
                    } else {
                        this._bindings[bindingIndex] = {
                            _type: BindingType.Attribute,
                            _attributeName: attribute.name,
                            _bindingElementIndex: bindingElementIndex,
                        };
                    }


                    toRemove.push(attribute);
                }
            }

            toRemove.forEach(attr => element.removeAttributeNode(attr));

            if (
                isScript && 
                element.nextSibling === element.nextElementSibling && 
                // @ts-ignore
                element.nextSibling && element.nextSibling.tagName !== 'SCRIPT'
            ) {
                element.nextElementSibling.setAttribute('bb', '');
                element.remove();
            }
        }
    }

    static getTemplate(strings: TemplateStringsArray, values: unknown[]): Template {
        if (!cache.has(strings)) {
            cache.set(strings, new Template(strings, values));
        }

        return cache.get(strings);
    }
}
