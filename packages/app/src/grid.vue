<template>
  <div class="vui-grid" />
</template>
<script setup>
import { Grid } from 'turbogrid';
import { inject, watch } from 'vue';
import { BF } from './util/util.js';

const state = inject('state');
const emit = defineEmits(['showFlyover']);

const showFlyover = (rowData, force) => {

    if (!state.flyoverVisible && !rowData.codes) {
        return;
    }

    if (!state.flyoverVisible && !force) {
        return;
    }

    emit('showFlyover', rowData);

};

const isMatch = (value, list, rowData, matchedKey) => {
    for (let i = 0, l = list.length; i < l; i++) {
        const k = list[i];
        const index = value.indexOf(k);
        if (index !== -1) {
            rowData[matchedKey] = {
                index: index,
                length: k.length
            };
            return true;
        }
    }
    return false;
};

const filterHandler = (rowItem) => {
    const matchedKey = 'name_matched';
    rowItem[matchedKey] = null;

    const ks = state.keywords;
    if (!ks) {
        return true;
    }

    const list = ks.trim().toLowerCase().split(/\s+/g).filter((item) => item);
    if (!list.length) {
        return true;
    }
    const v = rowItem.name;
    if (typeof v === 'undefined') {
        return false;
    }
    const value = `${v}`.toLowerCase();
    if (isMatch(value, list, rowItem, matchedKey)) {
        return true;
    }

    return false;

};

const createGrid = () => {

    const grid = new Grid('.vui-grid');

    grid.bind('onClick', (e, d) => {
        if (!d.rowNode) {
            return;
        }
        const rowItem = d.rowItem;

        let openFlyover = false;
        const icon = d.e.target;
        if (icon.classList.contains('tg-flyover-icon')) {
            openFlyover = true;
        }
        showFlyover(rowItem, openFlyover);

        grid.setRowSelected(rowItem, d.e);

    });

    grid.bind('onDblClick', (e, d) => {
        if (!d.rowNode) {
            return;
        }
        const rowItem = d.rowItem;
        showFlyover(rowItem, true);
    });

    //grid.bind('onUpdated', () => {
    //updateFilterInfo(gridName);
    //});

    grid.setOption({
        //textSelectable: true,
        //frozenRow: 0,
        sortField: 'size',
        sortAsc: false,
        sortOnInit: true,
        selectMultiple: false,
        rowHeight: 27,
        rowNumberVisible: true,
        rowNumberWidth: 50,
        rowNotFound: '<div>No Results</div>',
        rowFilter: (rowItem) => {
            return filterHandler(rowItem);
        },
        bindWindowResize: true,
        bindContainerResize: true
    });

    grid.setFormatter({

        null: function(v) {
            return v;
        },

        string: function(v, rd, cd) {
            const id = cd.id;
            const color = rd[`${id}_color`];
            if (color) {
                v = `<span style="color:${color};">${v}</span>`;
            }
            return v;
        },

        tree: function(v, rd, cd, node) {
            const df = this.getDefaultFormatter('tree');

            const nm = rd.name_matched;
            if (nm) {
                const left = v.substring(0, nm.index);
                const mid = v.substr(nm.index, nm.length);
                const right = v.substr(nm.index + nm.length);
                v = `${left}<b class="color-match">${mid}</b>${right}`;
            }

            if (rd.name_color) {
                v = `<span style="color:${rd.name_color};">${v}</span>`;
            }

            if (rd.codes) {
                v += `
                <div class="tg-cell-hover-icon tg-flyover-icon" title="Click to show module detail">
                    <div class="vui-icon vui-icon-info" />
                </div>
            `;
            }
            return df(v, rd, cd, node);
        },

        rowNumber: function(v, rd) {
            const n = rd.tg_list_index + 1;
            if (rd.tg_group) {
                return `${n}.`;
            }
            return n;
        },

        codes: function(v, rd) {
            const icon = rd.codes ? 'passed' : 'failed';
            return `<div class="vui-icon vui-icon-${icon}"></div>`;
        },

        size: function(v, rd, cd) {
            if (!Number.isInteger(v)) {
                return v;
            }
            v = BF(v);
            return this.getFormatter('string')(v, rd, cd);
        },

        percent: function(v) {
            if (!v) {
                return '';
            }
            return `${v}%`;
        },
        percentBar: function(v) {
            if (!v) {
                return '';
            }
            return `<div class="vui-percent" style="background:linear-gradient(to right, #999 ${v}%, #fff ${v}%);"></div>`;
        }
    });

    return grid;

};

const getGridColumns = () => {
    const columns = [{
        id: 'name',
        name: 'Name',
        width: 500,
        maxWidth: 2048
    }, {
        id: 'id',
        name: 'ID'
    }, {
        id: 'selfSize',
        name: 'Size',
        align: 'right'
    }];

    return columns;
};

const renderGrid = () => {

    let grid = state.grid;

    if (!grid) {
        grid = createGrid();
        state.grid = grid;
    }

    const gridData = {
        columns: getGridColumns(),
        rows: state.gridRows
    };

    console.log('gridData', gridData);

    grid.setData(gridData);
    grid.render();

};


watch(() => state.gridRows, () => {
    renderGrid();
});


watch(() => state.keywords, () => {
    if (state.grid) {
        state.grid.update();
    }
});

</script>
