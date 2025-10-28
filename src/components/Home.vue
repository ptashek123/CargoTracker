<template>
  <div class="home">
    <div class="row mb-4">
      <div class="col-12">
        <h1 class="display-4 fw-bold mb-3">
          <i class="bi bi-truck text-primary"></i> CargoTracker Local
        </h1>
        <p class="lead text-muted">
          Система учёта грузоперевозок с интеграцией Yandex Cloud
        </p>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="row g-4 mb-4">
      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="flex-shrink-0">
                <div class="bg-primary bg-opacity-10 rounded-3 p-3">
                  <i class="bi bi-box-seam fs-2 text-primary"></i>
                </div>
              </div>
              <div class="flex-grow-1 ms-3">
                <h6 class="text-muted mb-1">Всего рейсов</h6>
                <h3 class="mb-0">{{ stats.total || 0 }}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="flex-shrink-0">
                <div class="bg-success bg-opacity-10 rounded-3 p-3">
                  <i class="bi bi-truck fs-2 text-success"></i>
                </div>
              </div>
              <div class="flex-grow-1 ms-3">
                <h6 class="text-muted mb-1">В пути</h6>
                <h3 class="mb-0">{{ stats.active || 0 }}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="flex-shrink-0">
                <div class="bg-info bg-opacity-10 rounded-3 p-3">
                  <i class="bi bi-check-circle fs-2 text-info"></i>
                </div>
              </div>
              <div class="flex-grow-1 ms-3">
                <h6 class="text-muted mb-1">Завершено</h6>
                <h3 class="mb-0">{{ stats.completed || 0 }}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="flex-shrink-0">
                <div class="bg-warning bg-opacity-10 rounded-3 p-3">
                  <i class="bi bi-clock-history fs-2 text-warning"></i>
                </div>
              </div>
              <div class="flex-grow-1 ms-3">
                <h6 class="text-muted mb-1">В очереди</h6>
                <h3 class="mb-0">{{ stats.pending || 0 }}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-4">
              <i class="bi bi-lightning-charge text-warning"></i> Быстрые действия
            </h5>
            <div class="row g-3">
              <div class="col-md-3">
                <router-link to="/shipments" class="btn btn-primary w-100 py-3">
                  <i class="bi bi-plus-circle fs-4 d-block mb-2"></i>
                  Новая перевозка
                </router-link>
              </div>
              <div class="col-md-3">
                <router-link to="/drivers" class="btn btn-success w-100 py-3">
                  <i class="bi bi-person-plus fs-4 d-block mb-2"></i>
                  Добавить водителя
                </router-link>
              </div>
              <div class="col-md-3">
                <router-link to="/vehicles" class="btn btn-info w-100 py-3">
                  <i class="bi bi-truck-flatbed fs-4 d-block mb-2"></i>
                  Добавить транспорт
                </router-link>
              </div>
              <div class="col-md-3">
                <router-link to="/statistics" class="btn btn-secondary w-100 py-3">
                  <i class="bi bi-graph-up fs-4 d-block mb-2"></i>
                  Отчёты
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features -->
    <div class="row g-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center">
            <i class="bi bi-cloud-check text-primary fs-1 mb-3"></i>
            <h5 class="card-title">Облачная синхронизация</h5>
            <p class="card-text text-muted">
              Автоматическая синхронизация с Yandex Cloud для безопасности данных
            </p>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center">
            <i class="bi bi-wifi-off text-success fs-1 mb-3"></i>
            <h5 class="card-title">Оффлайн режим</h5>
            <p class="card-text text-muted">
              Работайте без интернета, данные синхронизируются автоматически
            </p>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center">
            <i class="bi bi-speedometer2 text-info fs-1 mb-3"></i>
            <h5 class="card-title">Высокая производительность</h5>
            <p class="card-text text-muted">
              Локальный кэш обеспечивает мгновенную работу интерфейса
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/client.js';

const stats = ref({
  total: 0,
  active: 0,
  completed: 0,
  pending: 0
});

onMounted(async () => {
  try {
    const response = await api.get('/api/statistics');
    stats.value = response.data;
  } catch (error) {
    console.error('Failed to load statistics:', error);
  }
});
</script>

<style scoped>
.card {
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-5px);
}

.btn {
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
