<template>
  <VuiFlex
    direction="column"
    class="vui-app"
  >
    <div class="vui-header vui-flex-row">
      <VuiFlex
        spacing="10px"
        width="100%"
      >
        <div
          class="vui-title"
          tooltip="Lightweight UI components"
        >
          {{ state.name }}
        </div>
        <div class="vui-upload">
          <input
            type="file"
            multiple
            accept=".heapsnapshot"
            @change="onUpload"
          >
        </div>
        <div class="vui-flex-auto" />
        <div>
          <a
            href="https://github.com/cenfun/heap-reporter"
            target="_blank"
            class="vui-icon vui-icon-github"
            tooltip="Heap Report"
          />
        </div>
      </VuiFlex>
    </div>
    <div class="vui-filter">
      <VuiFlex spacing="10px">
        <div><b>Filter:</b></div>
        <VuiInput
          v-model="state.keywords"
          name="name"
          placeholder="Name"
          width="200px"
        />
        <div class="vui-flex-empty" />
        <!-- <VuiSwitch
          v-model="state.group"
          label="Group by Path"
        /> -->
      </VuiFlex>
    </div>
    <div class="vui-body vui-flex-auto">
      <Grid @show-codes="showCodes" />
      <div
        v-if="!state.heapSnapshots"
        class="vui-no-report-data"
      >
        <span>Please select *.heapsnapshot files</span>
        <input
          type="file"
          multiple
          accept=".heapsnapshot"
          @change="onUpload"
        >
      </div>
    </div>
    <VuiFlyover
      :visible="state.flyoverVisible"
      width="50%"
      position="right"
      @end="onFlyoverEnd"
    >
      <div class="vui-flyover-main vui-flex-column">
        <div class="vui-flyover-header">
          <VuiFlex spacing="10px">
            <div
              class="vui-flyover-icon"
              @click="state.flyoverVisible=false"
            >
              <div class="vui-icon vui-icon-arrow-right" />
            </div>
            <div class="vui-flyover-title vui-flex-auto">
              {{ state.currentFile }}
            </div>
            <div
              class="vui-flyover-icon"
              @click="state.flyoverVisible=false"
            >
              <div class="vui-icon vui-icon-close" />
            </div>
          </VuiFlex>
        </div>
        <div class="vui-flyover-content vui-flex-auto">
          <div class="vui-detail" />
        </div>
      </div>
    </VuiFlyover>
  </VuiFlex>
</template>
<script setup>
import VineUI from 'vine-ui';
import {
    onMounted, shallowReactive, watch, ref, provide
} from 'vue';

import decompress from 'lz-utils/lib/decompress.js';
import Grid from './grid.vue';


const {
    //VuiSwitch,
    VuiFlex, VuiInput, VuiFlyover
} = VineUI;

const state = shallowReactive({
    name: 'Heap Report',
    heapSnapshots: null,
    group: false,
    keywords: '',
    flyoverVisible: false,
    currentRow: null,
    currentFile: ''
});

provide('state', state);

const currentCodes = ref(null);

// const htmlEscape = (str = '') => {
//     return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
// };


const onFlyoverEnd = (v) => {
    if (state.flyoverResolve) {
        state.flyoverResolve(v);
        state.flyoverResolve = null;
    }
    if (!v) {
        state.$code.textContent = '';
    }
};

const waitFlyoverEnd = () => {
    return new Promise((resolve) => {
        state.flyoverResolve = resolve;
    });
};

let currentIndex;
const showCodes = async (currentRow) => {
    //console.log(currentRow);

    if (currentIndex === currentRow.tg_index) {
        return;
    }
    currentIndex = currentRow.tg_index;

    if (!state.flyoverVisible) {
        state.flyoverVisible = true;
        await waitFlyoverEnd();
    }

    state.currentRow = currentRow;
    state.currentFile = currentRow.name;

};

const initHeapSnapshots = () => {

    const heapSnapshots = state.heapSnapshots;
    if (!heapSnapshots) {
        return;
    }

    console.log(heapSnapshots);

    state.currentRow = null;

};

const initReportData = () => {
    const reportData = window.reportData;
    if (reportData) {
        const data = JSON.parse(decompress(reportData));
        if (data.name) {
            state.name = data.name;
        }
        state.heapSnapshots = data.heapSnapshots;
    }
};

const onUpload = async (e) => {

    state.flyoverVisible = false;

    const files = e.target.files;
    if (!files.length) {
        return;
    }

    const maps = {};

    for (const file of files) {

        let err;
        const str = await file.text().catch((er) => {
            err = er;
        });
        if (err) {
            console.error(err);
            continue;
        }

        maps[file.name] = str;

    }

    state.heapSnapshots = maps;

};

watch(() => state.heapSnapshots, () => {
    initHeapSnapshots();
});

onMounted(() => {
    state.$code = currentCodes.value;
    initReportData();
    initHeapSnapshots();
});

</script>
<style lang="scss" src="./app.scss"></style>
