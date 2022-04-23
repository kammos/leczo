import { Renderable } from "../renderables/renderable";
import { Template } from "../template";

export interface SyntheticDOMNode<T extends Renderable> {
    _node: ChildNode;
    _template?: Template;
    // this makes it match Text interface, so it saves me IFs after removing StringNode
    nodeValue: T;
    remove(): void;
}

export interface SyntheticDOMNodeConstructor<T extends Renderable> {
    new(value: T, target: ChildNode): SyntheticDOMNode<T>;
}
