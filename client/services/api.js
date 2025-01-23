import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:5000/api",
})

export const fetchCampaigns = async () => {
  try {
    const response = await api.get("/campaigns?include=recipients")
    return response.data
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    throw error
  }
}



export const templateApi = {
  create: (data) => api.post("/templates", data),
  getAll: () => api.get("/templates"),
  getById: (id) => api.get(`/templates/${id}`),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
}

export const campaignApi = {
  create: (data) => api.post("/campaigns", data),
  getAll: (page = 1, limit = 10) => api.get(`/campaigns?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/campaigns/${id}`),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
  execute: (id) => api.post(`/campaigns/${id}/execute`),
}

export const contactApi = {
  upload: (file, onUploadProgress) => {
    const formData = new FormData()
    formData.append("file", file)
    return api.post("/contacts/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    })
  },
  getAll: (page = 1, limit = 10, search = "") => api.get(`/contacts?page=${page}&limit=${limit}&search=${search}`),
  delete: (id) => api.delete(`/contacts/${id}`),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  create: (data) => api.post("/contacts", data),
}

export const emailApi = {
  sendBulk: (data) => api.post("/emails/send-bulk", data),
  sendSingle: (data) => api.post("/emails/single", data),
}
