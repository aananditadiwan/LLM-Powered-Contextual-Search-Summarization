import axios from "axios";

const HTTP = axios.create({
  baseURL: "http://127.0.0.1:5000",
  headers: {
    "Content-Type": "application/json",
  },
});


export const searchQuery = (query,summaryOption) => HTTP.post(`/search`,{"query":query,"summary_length":summaryOption});
export const uploadFile = (formData) =>
  HTTP.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export default HTTP;
