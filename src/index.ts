import { Template } from "./template";
import { TemplateElement } from "./renderables/template-element";

export { map } from "./renderables/mapping-element";
export { RenderRoot } from "./render-root";
export { useState, useRef } from "./component-instance";

export const html = (strings: TemplateStringsArray, ...values: unknown[]) =>
    new TemplateElement(Template.getTemplate(strings, values), values);
