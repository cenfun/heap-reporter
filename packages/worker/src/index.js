import { JSHeapSnapshot } from '../dist/heap-snapshot.js';

// eslint-disable-next-line no-restricted-globals
const worker = self;

const onError = (data) => {
    worker.postMessage({
        type: 'error',
        data
    });
};

const onFinish = (data) => {
    worker.postMessage({
        type: 'finish',
        data
    });
};

const onProgress = (data) => {
    worker.postMessage({
        type: 'progress',
        data
    });
};

// const parseNodes = (nodes, node_count, node_fields) => {
//     const parsedNodes = [];
//     const fieldCount = node_fields.length;
//     for (let i = 0; i < node_count; i += fieldCount) {
//         const node = {};
//         node_fields.forEach((k, j) => {
//             node[k] = nodes[i + j];
//         });
//         parsedNodes.push(node);
//     }
//     return parsedNodes;
// };

// const linkNodeEdges = (from_node, edgeIndex, edges, edge_fields, edge_types, strings) => {

//     const types = edge_types[0];

//     const getEdgeName = (type, nameOrIndex) => {

//         const name = ['element', 'hidden'].includes(type) ? nameOrIndex : strings[nameOrIndex];

//         if (type === 'shortcut') {
//             return String(name);
//         }

//         const numName = parseInt(name, 10);
//         return String(isNaN(numName) ? name : numName);
//     };

//     const getEdge = (index) => {
//         const edge = {};
//         edge_fields.forEach((k, i) => {
//             edge[k] = edges[index + i];
//         });
//         const type = types[edge.type];
//         edge.name = getEdgeName(type, edge.name_or_index);
//         return edge;
//     };

//     for (let i = 0, l = from_node.edge_count; i < l; i++) {
//         const edge = getEdge(edgeIndex + i);
//         from_node.children.push(edge);
//     }

// };

// const groupByType = (nodes, node_types, node_fields, strings) => {

//     const nodeTypeOffset = node_fields.indexOf('type');
//     const nodeTypes = node_types[nodeTypeOffset];
//     const nodeConsStringType = nodeTypes.indexOf('concatenated string');

//     const lazyStringCache = {};

//     const consStringName = () => {
//         return 'consStringName';
//     };

//     const getNodeName = (type, nodeNameIndex, nodeIndex) => {
//         if (type === nodeConsStringType) {
//             let str = lazyStringCache[nodeIndex];
//             if (typeof str === 'undefined') {
//                 str = consStringName();
//                 lazyStringCache[nodeIndex] = str;
//             }
//             return str;
//         }
//         return strings[nodeNameIndex];
//     };

//     const list = [];
//     nodes.forEach((node) => {
//         //const type = nodeTypes[node.type];
//         node.name = getNodeName(node.type, node.name);
//         list.push(node);
//     });

//     return list;
// };

class HeapSnapshotProgress {
    updateStatus(string) {
        onProgress(string);
    }

    updateProgress(title, value, total) {
        const percentValue = ((total ? (value / total) : 0) * 100).toFixed(0);
        onProgress(percentValue);
    }

    reportProblem(error) {
        onError(error);
    }

}

const parseItem = (name, data) => {

    onProgress(name);

    if (typeof data === 'string') {
        data = JSON.parse(data);
    }

    //console.log(data);

    const progress = new HeapSnapshotProgress();
    const hs = new JSHeapSnapshot(data, progress);

    console.log(hs);
    console.log(hs.getStatistics());

    //const nodes = hs.createNode();
    console.log('createEdgesProvider', hs.createEdgesProvider(1));


    // const {
    //     edges,
    //     //locations,
    //     nodes,
    //     //samples,
    //     snapshot,
    //     strings
    //     //trace_function_infos,
    //     //trace_tree
    // } = data;

    // const {
    //     //edge_count,
    //     meta,
    //     node_count
    //     //trace_function_count
    // } = snapshot;

    // const {
    //     edge_fields,
    //     edge_types,
    //     //location_fields,
    //     node_fields,
    //     node_types
    //     //sample_fields,
    //     //trace_function_info_fields,
    //     //trace_node_fields
    // } = meta;

    // console.log('meta', meta);

    // const parsedNodes = parseNodes(nodes, node_count, node_fields);

    // let size = 0;
    // let edgeIndex = 0;
    // parsedNodes.forEach((from_node) => {

    //     from_node.children = [];
    //     from_node.parents = [];

    //     size += from_node.self_size;

    //     linkNodeEdges(from_node, edgeIndex, edges, edge_fields, edge_types, strings);
    //     edgeIndex += from_node.edge_count;

    // });

    const results = {
        name
        // self_size: size,
        // collapsed: true
    };

    // results.subs = groupByType(parsedNodes, node_types, node_fields, strings);

    return results;
};

const start = (heapSnapshots) => {
    if (!heapSnapshots) {
        onError('Invalid heapSnapshots');
        return;
    }

    const list = Object.keys(heapSnapshots).map((k) => {
        return parseItem(k, heapSnapshots[k]);
    });

    Promise.allSettled(list).then((res) => {
        onFinish(res.map((it) => it.value));
    });

};

worker.onmessage = (e) => {
    start(e.data);
};

