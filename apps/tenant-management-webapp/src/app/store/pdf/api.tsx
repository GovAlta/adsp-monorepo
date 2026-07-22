import axios from 'axios';
import { PdfTemplate, CreatePdfConfig } from './model'; // clean-code-ignore: RULE-19 — covered by ./saga.spec.tsx, the established one-spec-per-slice convention in this folder

export const fetchPdfTemplatesApi = async (token: string, url: string): Promise<Record<string, PdfTemplate>> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updatePDFTemplateApi = async (token: string, url: string, body: Partial<PdfTemplate>) => {
  const res = await axios.patch(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const fetchPdfFileApi = async (token: string, url: string) => {
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
  return res.data;
};

export const deletePdfTemplateApi = async (token: string, url: string): Promise<void> => {
  await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
};

export const generatePdfApi = async (token: string, url: string, body: Partial<PdfTemplate>) => {
  const res = await axios.patch(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const createPdfJobApi = async (token: string, url: string, body: CreatePdfConfig) => {
  const res = await axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

// clean-code-ignore: RULE-19
export const createPdfTemplateApi = async (
  token: string,
  url: string,
  body: {
    name: string;
    description: string;
    template?: string;
    header?: string;
    footer?: string;
    additionalStyles?: string;
    variables?: string;
  },
) => {
  const res = await axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};
