import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router.js';
import App from './App.vue';
import './style.css';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);
app.mount('#app');

// Service Worker для оффлайн работы
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}
