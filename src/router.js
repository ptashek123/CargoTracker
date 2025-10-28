import { createRouter, createWebHistory } from 'vue-router';
import Home from './components/Home.vue';
import Shipments from './components/Shipments.vue';
import Drivers from './components/Drivers.vue';
import Vehicles from './components/Vehicles.vue';
import Statistics from './components/Statistics.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/shipments',
    name: 'Shipments',
    component: Shipments
  },
  {
    path: '/drivers',
    name: 'Drivers',
    component: Drivers
  },
  {
    path: '/vehicles',
    name: 'Vehicles',
    component: Vehicles
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: Statistics
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
