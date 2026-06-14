import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Wall from '@/views/Wall.vue'
import Gallery from '@/views/Gallery.vue'
import Guess from '@/views/Guess.vue'
import Script from '@/views/Script.vue'

const routes = [
  { path: '/', component: Home, name: 'home' },
  { path: '/wall', component: Wall, name: 'wall' },
  { path: '/gallery', component: Gallery, name: 'gallery' },
  { path: '/guess/:id', component: Guess, name: 'guess' },
  { path: '/script', component: Script, name: 'script' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
