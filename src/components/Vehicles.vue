<template>
  <div class="vehicles">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-truck-flatbed"></i> Управление транспортом</h2>
      <button class="btn btn-info" @click="showModal = true">
        <i class="bi bi-plus-circle"></i> Добавить транспорт
      </button>
    </div>

    <div class="row g-4">
      <div v-for="vehicle in vehicles" :key="vehicle.id" class="col-md-6 col-lg-4">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex align-items-center mb-3">
              <div class="bg-info bg-opacity-10 rounded-3 p-3 me-3">
                <i class="bi bi-truck-front fs-2 text-info"></i>
              </div>
              <div>
                <h5 class="mb-0">{{ vehicle.number }}</h5>
                <small class="text-muted">{{ vehicle.brand }} {{ vehicle.model }}</small>
              </div>
            </div>
            
            <div class="mb-2">
              <span class="text-muted">Тип:</span>
              <strong> {{ getVehicleType(vehicle.type) }}</strong>
            </div>
            <div class="mb-2">
              <span class="text-muted">Грузоподъёмность:</span>
              <strong> {{ vehicle.capacity }} тонн</strong>
            </div>
            <div class="mb-2">
              <span class="text-muted">Год выпуска:</span>
              <strong> {{ vehicle.year }}</strong>
            </div>
            <div class="mb-3">
              <span class="badge" :class="vehicle.status === 'available' ? 'bg-success' : 'bg-warning'">
                {{ vehicle.status === 'available' ? 'Доступен' : 'Занят' }}
              </span>
            </div>
            
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary flex-fill" @click="editVehicle(vehicle)">
                <i class="bi bi-pencil"></i> Редактировать
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="deleteVehicle(vehicle)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="vehicles.length === 0" class="col-12">
        <div class="card shadow-sm">
          <div class="card-body text-center py-5">
            <i class="bi bi-truck fs-1 text-muted d-block mb-3"></i>
            <p class="text-muted">Нет добавленного транспорта</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Vehicle Modal -->
    <div v-if="showModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingVehicle ? 'Редактировать транспорт' : 'Добавить транспорт' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="mb-3">
                <label class="form-label">Государственный номер</label>
                <input v-model="newVehicle.number" type="text" class="form-control" required>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Марка</label>
                  <input v-model="newVehicle.brand" type="text" class="form-control" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Модель</label>
                  <input v-model="newVehicle.model" type="text" class="form-control" required>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Тип</label>
                  <select v-model="newVehicle.type" class="form-select">
                    <option value="truck">Грузовик</option>
                    <option value="van">Фургон</option>
                    <option value="semi">Полуприцеп</option>
                    <option value="container">Контейнеровоз</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Грузоподъёмность (тонн)</label>
                  <input v-model="newVehicle.capacity" type="number" step="0.5" class="form-control" required>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Год выпуска</label>
                <input v-model="newVehicle.year" type="number" min="1990" max="2025" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Статус</label>
                <select v-model="newVehicle.status" class="form-select">
                  <option value="available">Доступен</option>
                  <option value="in_use">Занят</option>
                  <option value="maintenance">На обслуживании</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Отмена</button>
            <button type="button" class="btn btn-info" @click="editingVehicle ? updateVehicle() : addVehicle()">
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
import api from '../api/client.js';

const showModal = ref(false);
const vehicles = ref([]);
const editingVehicle = ref(null);

const newVehicle = ref({
  number: '',
  brand: '',
  model: '',
  type: 'truck',
  capacity: 0,
  year: new Date().getFullYear(),
  status: 'available'
});

onMounted(async () => {
  await fetchVehicles();
});

async function fetchVehicles() {
  try {
    const response = await api.get('/api/vehicles');
    vehicles.value = response.data;
  } catch (error) {
    console.error('Failed to fetch vehicles:', error);
  }
}

function getVehicleType(type) {
  const types = {
    truck: 'Грузовик',
    van: 'Фургон',
    semi: 'Полуприцеп',
    container: 'Контейнеровоз'
  };
  return types[type] || type;
}

async function addVehicle() {
  try {
    const response = await api.post('/api/vehicles', newVehicle.value);
    vehicles.value.push(response.data);
    
    resetForm();
    showModal.value = false;
  } catch (error) {
    alert('Ошибка сохранения: ' + error.message);
  }
}

async function editVehicle(vehicle) {
  editingVehicle.value = vehicle;
  newVehicle.value = { ...vehicle };
  showModal.value = true;
}

async function updateVehicle() {
  try {
    const response = await api.put(`/api/vehicles/${editingVehicle.value.id}`, newVehicle.value);
    const index = vehicles.value.findIndex(v => v.id === editingVehicle.value.id);
    if (index !== -1) {
      vehicles.value[index] = response.data;
    }
    
    resetForm();
    showModal.value = false;
  } catch (error) {
    alert('Ошибка обновления: ' + error.message);
  }
}

async function deleteVehicle(vehicle) {
  if (confirm(`Удалить транспорт ${vehicle.number}?`)) {
    try {
      await api.delete(`/api/vehicles/${vehicle.id}`);
      vehicles.value = vehicles.value.filter(v => v.id !== vehicle.id);
    } catch (error) {
      alert('Ошибка удаления: ' + error.message);
    }
  }
}

function resetForm() {
  newVehicle.value = {
    number: '',
    brand: '',
    model: '',
    type: 'truck',
    capacity: 0,
    year: new Date().getFullYear(),
    status: 'available'
  };
  editingVehicle.value = null;
}

function closeModal() {
  showModal.value = false;
  resetForm();
}
</script>