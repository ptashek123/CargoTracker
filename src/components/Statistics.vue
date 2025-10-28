<template>
  <div class="statistics">
    <h2 class="mb-4"><i class="bi bi-graph-up"></i> Статистика и отчётность</h2>

    <!-- Summary Cards -->
    <div class="row g-4 mb-4">
      <div class="col-md-3">
        <div class="card border-0 shadow-sm bg-primary text-white">
          <div class="card-body">
            <h6 class="text-white-50 mb-2">Выручка за месяц</h6>
            <h3 class="mb-0">{{ formatCurrency(stats.revenue) }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm bg-success text-white">
          <div class="card-body">
            <h6 class="text-white-50 mb-2">Завершённых рейсов</h6>
            <h3 class="mb-0">{{ stats.completedTrips }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm bg-info text-white">
          <div class="card-body">
            <h6 class="text-white-50 mb-2">Всего километров</h6>
            <h3 class="mb-0">{{ formatNumber(stats.totalKm) }} км</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm bg-warning text-dark">
          <div class="card-body">
            <h6 class="text-dark-50 mb-2">Перевезено тонн</h6>
            <h3 class="mb-0">{{ formatNumber(stats.totalWeight) }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="row g-4 mb-4">
      <div class="col-lg-8">
        <div class="card shadow-sm">
          <div class="card-header bg-white">
            <h5 class="mb-0">Статистика перевозок по месяцам</h5>
          </div>
          <div class="card-body">
            <div class="chart-placeholder">
              <canvas id="tripsChart" height="300"></canvas>
              <div class="text-center text-muted py-5">
                <i class="bi bi-bar-chart fs-1 d-block mb-2"></i>
                <p>График перевозок за последние 6 месяцев</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card shadow-sm">
          <div class="card-header bg-white">
            <h5 class="mb-0">Топ направлений</h5>
          </div>
          <div class="card-body">
            <div class="list-group list-group-flush">
              <div v-for="(route, index) in topRoutes" :key="index" 
                   class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <div class="fw-bold">{{ route.from }} → {{ route.to }}</div>
                  <small class="text-muted">{{ route.trips }} рейсов</small>
                </div>
                <span class="badge bg-primary rounded-pill">{{ route.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reports Table -->
    <div class="card shadow-sm">
      <div class="card-header bg-white d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Сгенерированные отчёты</h5>
        <button class="btn btn-primary btn-sm" @click="generateReport">
          <i class="bi bi-file-earmark-text"></i> Создать отчёт
        </button>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Название</th>
                <th>Период</th>
                <th>Дата создания</th>
                <th>Размер</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="report in reports" :key="report.id">
                <td><i class="bi bi-file-pdf text-danger"></i> {{ report.name }}</td>
                <td>{{ report.period }}</td>
                <td>{{ formatDate(report.createdAt) }}</td>
                <td>{{ report.size }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1">
                    <i class="bi bi-download"></i> Скачать
                  </button>
                  <button class="btn btn-sm btn-outline-danger">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const stats = ref({
  revenue: 2450000,
  completedTrips: 142,
  totalKm: 45823,
  totalWeight: 3567
});

const topRoutes = ref([
  { from: 'Москва', to: 'Санкт-Петербург', trips: 45, percentage: 32 },
  { from: 'Москва', to: 'Казань', trips: 28, percentage: 20 },
  { from: 'Новосибирск', to: 'Красноярск', trips: 22, percentage: 15 },
  { from: 'Екатеринбург', to: 'Тюмень', trips: 18, percentage: 13 },
  { from: 'Москва', to: 'Нижний Новгород', trips: 15, percentage: 11 }
]);

const reports = ref([
  {
    id: 1,
    name: 'Отчёт за октябрь 2024',
    period: '01.10.2024 - 31.10.2024',
    createdAt: '2024-11-01T10:00:00',
    size: '2.4 MB'
  },
  {
    id: 2,
    name: 'Отчёт за сентябрь 2024',
    period: '01.09.2024 - 30.09.2024',
    createdAt: '2024-10-01T10:00:00',
    size: '2.1 MB'
  }
]);

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('ru-RU');
}

async function generateReport() {
  try {
    alert('Генерация отчёта...');
    
    // Get statistics from API
    const response = await fetch('/api/statistics');
    const stats = await response.json();
    
    // Create report data
    const reportData = {
      title: 'Отчёт по грузоперевозкам',
      date: new Date().toLocaleString('ru-RU'),
      stats: stats,
      generatedBy: 'CargoTracker Local'
    };
    
    // Download as JSON
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cargotracker-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Отчёт успешно сохранён!');
  } catch (error) {
    console.error('Error generating report:', error);
    alert('Ошибка генерации отчёта: ' + error.message);
  }
}

onMounted(() => {
  // Здесь можно инициализировать графики с помощью Chart.js
  console.log('Statistics component mounted');
});
</script>

<style scoped>
.chart-placeholder {
  min-height: 300px;
}
</style>
