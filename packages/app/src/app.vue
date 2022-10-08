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
            tooltip="Heap Reporter"
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
      <Grid />
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
//import workerDataUrl from '../../worker/dist/heap-reporter-worker.js?url';
//const workerUrl = new URL(workerDataUrl);

//debug
const workerUrl = 'packages/worker/dist/heap-reporter-worker.js';

const {
    //VuiSwitch,
    VuiFlex, VuiInput, VuiFlyover
} = VineUI;

const state = shallowReactive({
    name: 'Heap Report',
    heapSnapshots: null,
    group: false,
    gridRows: null,
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

const onFinish = (data) => {
    console.log(data);

    state.gridRows = data;
};

const onProgress = (data) => {
    console.log('onProgress', data);
};

const initHeapSnapshots = () => {

    const heapSnapshots = state.heapSnapshots;
    if (!heapSnapshots) {
        return;
    }

    //console.log(heapSnapshots);
    const worker = new Worker(workerUrl);
    worker.onmessage = function(e) {
        const { type, data } = e.data;
        if (type === 'error') {
            console.error(data);
            return;
        }
        if (type === 'finish') {
            onFinish(data);
            return;
        }
        if (type === 'progress') {
            onProgress(data);
            return;
        }

        console.log(e.data);
    };

    worker.postMessage(heapSnapshots);

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
