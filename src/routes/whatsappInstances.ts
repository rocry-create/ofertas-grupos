import { Router } from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const client = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,
  headers: { apikey: process.env.EVOLUTION_API_KEY! },
});

router.get('/', async (req, res) => {
  try {
    const response = await client.get('/instance/fetchInstances');
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ message: err.response?.data?.message || err.message || 'Erro ao listar instancias' });
  }
});

router.post('/', async (req, res) => {
  const { instanceName } = req.body;
  if (!instanceName) return res.status(400).json({ message: 'Informe o nome da instancia' });
  try {
    const response = await client.post('/instance/create', {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    });
    res.status(201).json(response.data);
  } catch (err: any) {
    res.status(500).json({ message: err.response?.data?.message || err.message || 'Erro ao criar instancia' });
  }
});

router.get('/:name/qrcode', async (req, res) => {
  try {
    const response = await client.get(`/instance/connect/${req.params.name}`);
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ message: err.response?.data?.message || err.message || 'Erro ao gerar QR Code' });
  }
});

router.get('/:name/status', async (req, res) => {
  try {
    const response = await client.get(`/instance/connectionState/${req.params.name}`);
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ message: err.response?.data?.message || err.message || 'Erro ao consultar status' });
  }
});

router.put('/:name/restart', async (req, res) => {
  try {
    const response = await client.put(`/instance/restart/${req.params.name}`);
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ message: err.response?.data?.message || err.message || 'Erro ao reiniciar instancia' });
  }
});

router.delete('/:name/logout', async (req, res) => {
  try {
    const response = await client.delete(`/instance/logout/${req.params.name}`);
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ message: err.response?.data?.message || err.message || 'Erro ao desconectar instancia' });
  }
});

router.delete('/:name', async (req, res) => {
  try {
    const response = await client.delete(`/instance/delete/${req.params.name}`);
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ message: err.response?.data?.message || err.message || 'Erro ao remover instancia' });
  }
});

export default router;
