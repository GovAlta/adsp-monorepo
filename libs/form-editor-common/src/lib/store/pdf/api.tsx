import axios from 'axios';
import { PdfTemplate, UpdatePdfConfig, DeletePdfConfig, CreatePdfConfig } from './model';

export const fetchPdfTemplatesApi = async (token: string, url: string): Promise<Record<string, PdfTemplate>> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updatePDFTemplateApi = async (token: string, url: string, body: UpdatePdfConfig) => {
  const res = await axios.patch(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const fetchPdfFileApi = async (token: string, url: string) => {
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
  return res.data;
};

export const deletePdfFileApi = async (token: string, url: string, body: DeletePdfConfig) => {
  const res = await axios.patch(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const generatePdfApi = async (token: string, url: string, body: UpdatePdfConfig) => {
  const res = await axios.patch(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const createPdfJobApi = async (token: string, url: string, body: CreatePdfConfig) => {
  const res = await axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};
