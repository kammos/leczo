import { Template } from "../template";
import { Templatable } from "./renderable";

export class TemplateElement implements Templatable {
    _template: Template;
    _values: unknown[];

    constructor(template: Template, values: unknown[]) {
        this._template = template;
        this._values = values;
    }
}