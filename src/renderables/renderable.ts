import { Template } from "../../../node_modules/webpack/types";
import { MappingElement } from "./mapping-element";
import { TemplateElement } from "./template-element";

export interface PropsMap {
    [key: string]: unknown;
}

export type Component = (props: PropsMap) => TemplateElement;

export type Renderable = Component | TemplateElement | MappingElement<unknown, unknown> | string; // TODO should this be interface? should it be here?

export interface Templatable {
    _template: Template;
}