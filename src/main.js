import { createApp } from 'vue'
import App from '@/app/App.vue'
import router from '@/app/router.js'
import '@/styles/tokens.css'
import '@/styles/main.css'

createApp(App).use(router).mount('#app')
