import axios from 'axios';

const axiosInstance = axios.create({
   baseURL: 'https://hapi.fhir.org/baseR4',
});

export const getPatientApi = (id) => axiosInstance.get(`/Patient/${id}`);
