<template>
  <div class="drivers">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-person-badge"></i> Управление водителями</h2>
      <button class="btn btn-success" @click="showModal = true">
        <i class="bi bi-person-plus"></i> Добавить водителя
      </button>
    </div>

    <div class="row g-4">
      <div v-for="driver in drivers" :key="driver.id" class="col-md-4">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex align-items-center mb-3">
              <div class="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                <i class="bi bi-person fs-2 text-success"></i>
              </div>
              <div>
                <h5 class="mb-0">{{ driver.name }}</h5>
                <small class="text-muted">ID: {{ driver.id }}</small>
              </div>
            </div>
            <div class="mb-2">
              <i class="bi bi-telephone text-muted"></i> {{ driver.phone }}
            </div>
            <div class="mb-2">
              <i class="bi bi-card-text text-muted"></i> Лицензия: {{ driver.license }}
            </div>
            <div class="mb-3">
              <span class="badge" :class="driver.status === 'active' ? 'bg-success' : 'bg-secondary'">
                {{ driver.status === 'active' ? 'Активен' : 'Неактивен' }}
              </span>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary flex-fill">
                <i class="bi bi-pencil"></i> Редактировать
              </button>
              <button class="btn btn-sm btn-outline-danger">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="drivers.length === 0" class="col-12">
        <div class="card shadow-sm">
          <div class="card-body text-center py-5">
            <i class="bi bi-people fs-1 text-muted d-block mb-3"></i>
            <p class="text-muted">Нет добавленных водителей</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Driver Modal -->
    <div v-if="showModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Добавить водителя</h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="mb-3">
                <label class="form-label">ФИО</label>
                <input v-model="newDriver.name" type="text" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Телефон</label>
                <input v-model="newDriver.phone" type="tel" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Номер лицензии</label>
                <input v-model="newDriver.license" type="text" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Статус</label>
                <select v-model="newDriver.status" class="form-select">
                  <option value="active">Активен</option>
                  <option value="inactive">Неактивен</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showModal = false">Отмена</button>
            <button type="button" class="btn btn-success" @click="addDriver">
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
const drivers = ref([]);

const newDriver = ref({
  name: '',
  phone: '',
  license: '',
  status: 'active'
});

onMounted(async () => {
  await fetchDrivers();
});

async function fetchDrivers() {
  try {
    const response = await api.get('/api/drivers');
    drivers.value = response.data;
  } catch (error) {
    console.error('Failed to fetch drivers:', error);
  }
}

async function addDriver() {
  try {
    const response = await api.post('/api/drivers', newDriver.value);
    drivers.value.push(response.data);
    
    newDriver.value = {
      name: '',
      phone: '',
      license: '',
      status: 'active'
    };
    
    showModal.value = false;
  } catch (error) {
    alert('Ошибка сохранения: ' + error.message);
  }
}
</script>
