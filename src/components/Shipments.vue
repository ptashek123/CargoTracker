<template>
  <div class="shipments">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-box-seam"></i> Управление грузоперевозками</h2>
      <button class="btn btn-primary" @click="showCreateModal = true">
        <i class="bi bi-plus-circle"></i> Создать перевозку
      </button>
    </div>

    <!-- Offline Warning -->
    <div v-if="shipmentStore.isOffline" class="alert alert-warning" role="alert">
      <i class="bi bi-wifi-off"></i> Вы работаете в оффлайн режиме. Данные будут синхронизированы при восстановлении связи.
    </div>

    <!-- Loading -->
    <div v-if="shipmentStore.loading" class="loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <!-- Shipments Table -->
    <div v-else class="card shadow-sm">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Откуда</th>
                <th>Куда</th>
                <th>Водитель</th>
                <th>Транспорт</th>
                <th>Статус</th>
                <th>Дата создания</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="shipment in shipmentStore.shipments" :key="shipment.id" class="fade-in">
                <td><code>{{ shipment.id }}</code></td>
                <td>{{ shipment.origin }}</td>
                <td>{{ shipment.destination }}</td>
                <td>{{ shipment.driver || 'Не назначен' }}</td>
                <td>{{ shipment.vehicle || 'Не назначен' }}</td>
                <td>
                  <span class="badge status-badge" :class="getStatusClass(shipment.status)">
                    {{ getStatusText(shipment.status) }}
                  </span>
                </td>
                <td>{{ formatDate(shipment.createdAt) }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" @click="editShipment(shipment)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(shipment)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="shipmentStore.shipments.length === 0">
                <td colspan="8" class="text-center text-muted py-4">
                  <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                  Нет перевозок
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingShipment ? 'Редактировать перевозку' : 'Создать перевозку' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveShipment">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Откуда</label>
                  <input v-model="formData.origin" type="text" class="form-control" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Куда</label>
                  <input v-model="formData.destination" type="text" class="form-control" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Водитель</label>
                  <select v-model="formData.driver" class="form-select">
                    <option value="">Выберите водителя</option>
                    <option v-for="driver in availableDrivers" :key="driver.id" :value="driver.name">
                      {{ driver.name }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Транспорт</label>
                  <select v-model="formData.vehicle" class="form-select">
                    <option value="">Выберите транспорт</option>
                    <option v-for="vehicle in availableVehicles" :key="vehicle.id" :value="vehicle.number">
                      {{ vehicle.number }} ({{ vehicle.brand }} {{ vehicle.model }})
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Груз</label>
                  <input v-model="formData.cargo" type="text" class="form-control" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Вес (тонн)</label>
                  <input v-model="formData.weight" type="number" step="0.1" class="form-control" required>
                </div>
                <div class="col-md-12">
                  <label class="form-label">Статус</label>
                  <select v-model="formData.status" class="form-select">
                    <option value="pending">Ожидает</option>
                    <option value="active">Активна</option>
                    <option value="in_transit">В пути</option>
                    <option value="completed">Завершена</option>
                    <option value="cancelled">Отменена</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Отмена</button>
            <button type="button" class="btn btn-primary" @click="saveShipment">
              <i class="bi bi-save"></i> Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useShipmentStore } from '../stores/shipments.js';
import api from '../api/client.js';

const shipmentStore = useShipmentStore();
const showCreateModal = ref(false);
const editingShipment = ref(null);

// Available drivers and vehicles
const availableDrivers = ref([]);
const availableVehicles = ref([]);

const formData = ref({
  origin: '',
  destination: '',
  driver: '',
  vehicle: '',
  cargo: '',
  weight: 0,
  status: 'pending'
});

onMounted(async () => {
  await shipmentStore.fetchShipments();
  await fetchDrivers();
  await fetchVehicles();
});

async function fetchDrivers() {
  try {
    const response = await api.get('/api/drivers');
    availableDrivers.value = response.data;
  } catch (error) {
    console.error('Failed to fetch drivers:', error);
  }
}

async function fetchVehicles() {
  try {
    const response = await api.get('/api/vehicles');
    availableVehicles.value = response.data;
  } catch (error) {
    console.error('Failed to fetch vehicles:', error);
  }
}

function getStatusClass(status) {
  const classes = {
    pending: 'bg-warning',
    active: 'bg-info',
    in_transit: 'bg-primary',
    completed: 'bg-success',
    cancelled: 'bg-danger',
    queued: 'bg-secondary'
  };
  return classes[status] || 'bg-secondary';
}

function getStatusText(status) {
  const texts = {
    pending: 'Ожидает',
    active: 'Активна',
    in_transit: 'В пути',
    completed: 'Завершена',
    cancelled: 'Отменена',
    queued: 'В очереди'
  };
  return texts[status] || status;
}

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('ru-RU');
}

function editShipment(shipment) {
  editingShipment.value = shipment;
  formData.value = { ...shipment };
  showCreateModal.value = true;
}

async function saveShipment() {
  try {
    if (editingShipment.value) {
      await shipmentStore.updateShipment(editingShipment.value.id, formData.value);
    } else {
      await shipmentStore.createShipment({
        ...formData.value,
        createdAt: new Date().toISOString()
      });
    }
    closeModal();
  } catch (error) {
    alert('Ошибка сохранения: ' + error.message);
  }
}

function closeModal() {
  showCreateModal.value = false;
  editingShipment.value = null;
  formData.value = {
    origin: '',
    destination: '',
    driver: '',
    vehicle: '',
    cargo: '',
    weight: 0,
    status: 'pending'
  };
}

function confirmDelete(shipment) {
  if (confirm(`Удалить перевозку ${shipment.id}?`)) {
    shipmentStore.deleteShipment(shipment.id);
  }
}
</script>
