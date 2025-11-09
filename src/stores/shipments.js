import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api/client.js';

export const useShipmentStore = defineStore('shipments', () => {
  const shipments = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const isOffline = ref(false);

  const activeShipments = computed(() => {
    return shipments.value.filter(s => s.status === 'active' || s.status === 'in_transit');
  });

  const completedShipments = computed(() => {
    return shipments.value.filter(s => s.status === 'completed');
  });

  async function fetchShipments() {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/api/shipments');
      isOffline.value = false;
      shipments.value = response.data;
    } catch (err) {
      error.value = err.message;
      console.error('Failed to fetch shipments:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createShipment(shipmentData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post('/api/shipments', shipmentData);
      shipments.value.unshift(response.data);
      return response.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateShipment(id, updates) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.put(`/api/shipments/${id}`, updates);

      const index = shipments.value.findIndex(s => s.id === id);
      if (index !== -1) {
        shipments.value[index] = response.data;
      }

      return response.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteShipment(id) {
    loading.value = true;
    error.value = null;
    
    try {
      await api.delete(`/api/shipments/${id}`);
      
      const index = shipments.value.findIndex(s => s.id === id);
      if (index !== -1) {
        shipments.value.splice(index, 1);
      }
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    shipments,
    loading,
    error,
    isOffline,
    activeShipments,
    completedShipments,
    fetchShipments,
    createShipment,
    updateShipment,
    deleteShipment
  };
});
