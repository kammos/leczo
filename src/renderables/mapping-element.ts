import { TemplateElement  } from "./template-element";
import { Template } from "../template";
import { Templatable } from "./renderable";

export class MappingElement<T, K> implements Templatable {
    _keys: K[];
    _elements: TemplateElement[];
    _template: Template;

    constructor(data: T[], getKey: (entry: T) => K, render: (entry: T) => TemplateElement) {
        this._keys = data.map(getKey);
        this._elements = data.map(render)
        this._template = this._keys.length ? this._elements[0]._template : undefined;
    }
}

export const map = <T, K>(
    data: T[],
    getKey: (entry: T) => K,
    render: (entry: T) => TemplateElement
) => new MappingElement(data, getKey, render);
