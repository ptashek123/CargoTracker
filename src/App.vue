<template>
  <div id="app" class="min-vh-100 bg-light">
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow">
      <div class="container-fluid">
        <a class="navbar-brand fw-bold" href="/">
          <i class="bi bi-truck"></i> CargoTracker Local
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link to="/" class="nav-link">
                <i class="bi bi-house"></i> Главная
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/shipments" class="nav-link">
                <i class="bi bi-box-seam"></i> Грузоперевозки
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/drivers" class="nav-link">
                <i class="bi bi-person-badge"></i> Водители
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/vehicles" class="nav-link">
                <i class="bi bi-truck-flatbed"></i> Транспорт
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/statistics" class="nav-link">
                <i class="bi bi-graph-up"></i> Статистика
              </router-link>
            </li>
          </ul>
          
          <!-- Status Indicator -->
          <div class="d-flex align-items-center">
            <span class="badge me-2" :class="syncStatus.cloudOnline ? 'bg-success' : 'bg-warning'">
              <i class="bi" :class="syncStatus.cloudOnline ? 'bi-cloud-check' : 'bi-cloud-slash'"></i>
              {{ syncStatus.cloudOnline ? 'Online' : 'Offline' }}
            </span>
            
            <span v-if="syncStatus.pendingOperations > 0" class="badge bg-info me-2">
              <i class="bi bi-clock-history"></i> {{ syncStatus.pendingOperations }} ожидает синхронизации
            </span>
            
            <button @click="forceSync" class="btn btn-sm btn-light" :disabled="isSyncing">
              <i class="bi bi-arrow-repeat" :class="{ 'spin': isSyncing }"></i>
              Синхронизировать
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="container-fluid py-4">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="bg-dark text-white text-center py-3 mt-5">
      <p class="mb-0">
        <small>CargoTracker Local v1.0.0 | Powered by Yandex Cloud</small>
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useShipmentStore } from './stores/shipments.js';

const shipmentStore = useShipmentStore();
const syncStatus = ref({
  cloudOnline: true,
  pendingOperations: 0,
  unsyncedRecords: 0
});
const isSyncing = ref(false);
let statusInterval;

async function updateSyncStatus() {
  try {
    const response = await fetch('/api/sync/status');
    const data = await response.json();
    syncStatus.value = data;
  } catch (error) {
    console.error('Failed to update sync status:', error);
  }
}

async function forceSync() {
  if (isSyncing.value) return;
  
  isSyncing.value = true;
  try {
    const response = await fetch('/api/sync/force', { method: 'POST' });
    const data = await response.json();
    console.log('Sync result:', data);
    await updateSyncStatus();
  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    isSyncing.value = false;
  }
}

onMounted(() => {
  updateSyncStatus();
  statusInterval = setInterval(updateSyncStatus, 10000); // Каждые 10 секунд
});

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval);
  }
});
</script>

<style>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}

.router-link-active {
  font-weight: bold;
}
</style>
