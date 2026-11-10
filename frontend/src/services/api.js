import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'https://vedacraft-seller.onrender.com/api'

export const api = axios.create({ baseURL })

export const getApiHealth = async () => {
  const { data } = await api.get('/health')
  return data
}
