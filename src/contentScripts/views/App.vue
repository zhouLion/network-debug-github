<script setup lang="ts">
import { useToggle } from '@vueuse/core'
import { onMessage } from 'webext-bridge/content-script'
import 'uno.css'

class Item {
  url = ''
  githubSearchUrl = ''
  timestamp?: number = Date.now()
  times = 1
  constructor(init: {
    url?: string
    githubSearchUrl?: string
    timestamp?: number
  }) {
    this.url = init.url || ''
    this.githubSearchUrl = init.githubSearchUrl || ''
    this.timestamp = init.timestamp || Date.now()
  }
}

const list = ref<Item[]>([])

const keyword = ref('')

const pathname = (url: string) => new URL(url).pathname

onMessage('github-search', (data) => {
  if (!data.data.url || !data.data.githubSearchUrl)
    return

  const first = list.value.at(0)
  if (first && pathname(first.url) === pathname(data.data.url)) {
    list.value[0].times += 1
    list.value[0].timestamp = Date.now()
  }
  else {
    list.value.unshift(new Item(data.data))
  }
})

function includes(key: string, text?: string) {
  if (!text)
    return true
  return text.toLowerCase().includes(key.toLowerCase())
}

function emphasis(text: string | undefined, key: string) {
  if (!text)
    return ''
  return text.replace(new RegExp(`(${key})`, 'gi'), '<b>$1</b>')
}

const filteredList = computed(() => list.value.filter(({ url }) => !keyword.value || (includes(keyword.value, url))))

function clear() {
  list.value = []
}

const [show, toggle] = useToggle(false)
</script>

<template>
  <div class="fixed right-0 bottom-0 m-5 z-100 flex items-end font-sans select-none leading-1em">
    <div
      m="y-auto r-2"
      class="bg-white text-gray-800 rounded-lg shadow-md w-40vw fixed right-12 ring-2 ring-purple-500 bottom-12 z-50" p="x-4 y-2"
      transition="transform opacity-100"
      :class="show ? 'translate-y-0 scale-100 opacity-100' : 'scale-0 -translate-y-1/1 opacity-0'"
    >
      <nav flex gap-1 items-center>
        <button border-none text-red w-8 h-8 rounded cursor-pointer @click="clear()">
          <ion-trash />
        </button>

        <input v-model="keyword" class="h-8 w-full px-2" placeholder="Search">

        <span v-show="keyword" text-sm>
          {{ filteredList.length }}/<b>{{ list.length }}</b>
        </span>
      </nav>

      <ul class="list-none m0 p0 h-20vh overflow-auto mt-2">
        <li v-for="(item) in filteredList" :key="item.timestamp">
          <a
            class="flex gap1 justify-between items-center inline-block p2 hover:bg-gray-100"
            target="_blank"
            :href="item.githubSearchUrl" :title="item.githubSearchUrl"
          >
            <!-- <span v-if="item.times > 1" text-sm rounded-full p-1 bg-gray-400>{{ item.times }}</span> -->
            <span class="text-truncate" v-html="emphasis(pathname(item.url!), keyword)" />

            <ion-logo-github />
          </a>
        </li>
      </ul>
    </div>

    <button class="flex w-10 h-10 rounded-full shadow cursor-pointer border-none" @click="toggle()">
      <logos-github-copilot class="block m-auto text-white text-lg" />
    </button>
  </div>
</template>
