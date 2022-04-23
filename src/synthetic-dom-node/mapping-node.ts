import { SyntheticDOMNode } from "./synthetic-dom-node";
import { MappingElement } from "../renderables";
import { TemplateNode } from "./template-node";

const generateMap = <K>(list: K[], start: number, end: number) => {
    const map = new Map<K, number>();

    for (let i = start; i <= end; i++) {
        map.set(list[i], i);
    }

    return map;
};

let nextMappingNodeId = 0;

export class MappingNode<T, K> implements SyntheticDOMNode<MappingElement<T, K>> {
    _node: ChildNode;
    _lastNodes: TemplateNode[];
    _lastKeys: K[];
    _mappingNodeId: number;

    constructor(mapping: MappingElement<T, K>, target: ChildNode) {
        this._mappingNodeId = nextMappingNodeId++;

        this._node = target;

        // @ts-ignore
        this._node.$mappingNodeId = this._mappingNodeId;

        this._lastNodes = mapping._elements.map(result => new TemplateNode(result, this._node, this._mappingNodeId));

        this._lastKeys = mapping._keys;
    }

    set nodeValue(newMapping: MappingElement<T, K>) {
        let oldHead = 0;
        let newHead = 0;
        let oldTail = this._lastKeys.length - 1;
        let newTail = newMapping._keys.length - 1;
        let newKeyToIndexMap: Map<K, number>;
        let oldKeyToIndexMap: Map<K, number>;
        const newNodes: TemplateNode[] = [];


        while (oldHead <= oldTail && newHead <= newTail) {
            if (this._lastNodes[oldHead] === null) {
                oldHead++;

                continue;
            }

            if (this._lastNodes[oldTail] === null) {
                oldTail--;

                continue;
            }


            if (this._lastKeys[oldHead] === newMapping._keys[newHead]) {
                newNodes[newHead] = this._lastNodes[oldHead];
                newNodes[newHead].nodeValue = newMapping._elements[newHead];

                oldHead++;
                newHead++;
                continue;
            }

            if (this._lastKeys[oldTail] === newMapping._keys[newTail]) {
                newNodes[newTail] = this._lastNodes[oldTail];
                newNodes[newTail].nodeValue = newMapping._elements[newTail];

                oldTail--;
                newTail--;
                continue;
            }

            if (this._lastKeys[oldHead] === newMapping._keys[newTail]) {
                newNodes[newTail] = this._lastNodes[oldHead];
                newNodes[newTail].nodeValue = newMapping._elements[newTail];
                newNodes[newTail]._move(newNodes[newTail + 1]?._firstChild ?? this._node, this._mappingNodeId);

                oldHead++;
                newTail--;
                continue;
            }

            if (this._lastKeys[oldTail] === newMapping._keys[newHead]) {
                newNodes[newHead] = this._lastNodes[oldTail];
                newNodes[newHead].nodeValue = newMapping._elements[newHead];
                newNodes[newHead]._move(this._lastNodes[oldHead]?._firstChild ?? this._node, this._mappingNodeId);

                oldTail--;
                newHead++;
                continue;
            }

            if (newKeyToIndexMap === undefined) {
                newKeyToIndexMap = generateMap(newMapping._keys, newHead, newTail);
                oldKeyToIndexMap = generateMap(this._lastKeys, oldHead, oldTail);
            }

            if (!newKeyToIndexMap.has(this._lastKeys[oldHead])) {
                this._lastNodes[oldHead]._removeInMapping(this._mappingNodeId);

                oldHead++;
                continue;
            }

            if (!newKeyToIndexMap.has(this._lastKeys[oldTail])) {
                this._lastNodes[oldTail]._removeInMapping(this._mappingNodeId);
                
                oldTail--;
                continue;
            }

            const oldIndex = oldKeyToIndexMap.get(newMapping._keys[newHead]);
            const oldNode = oldIndex !== undefined ? this._lastNodes[oldIndex] : null;

            if (oldNode === null) {
                newNodes[newHead] = new TemplateNode(newMapping._elements[newHead], this._lastNodes[oldHead]?._firstChild ?? this._node, this._mappingNodeId);
            } else {
                oldNode.nodeValue = newMapping._elements[newHead];
                oldNode._move(this._lastNodes[oldHead]?._firstChild ?? this._node, this._mappingNodeId);

                this._lastNodes[oldIndex] = null;
            }

            newHead++;
        }

        while (newHead <= newTail) {
            newNodes[newHead] = new TemplateNode(newMapping._elements[newHead], newNodes[newTail + 1]?._firstChild ?? this._node, this._mappingNodeId);
            newHead++;
        }
        
        // Remove any remaining unused old parts
        while (oldHead <= oldTail) {
            const oldNode = this._lastNodes[oldHead++];

            oldNode?._removeInMapping?.(this._mappingNodeId);
        }

        this._lastKeys = newMapping._keys;
        this._lastNodes = newNodes;
    }

    remove() {
        this._lastNodes[0]?.remove?.(this._node);
    }
}
