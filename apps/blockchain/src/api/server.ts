import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Web3Service } from '../services/web3.service';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const web3Service = new Web3Service();

app.use(cors());
app.use(express.json());

app.post('/v1/chain/tokenize', async (req: Request, res: Response) => {
  try {
    const result = await web3Service.deployAssetToken(req.body);
    if (result.status === 'FAILED') {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/v1/chain/transfer', async (req: Request, res: Response) => {
  try {
    const result = await web3Service.transferTokens(req.body);
    if (result.status === 'FAILED') {
      return res.status(400).json(result);
    }
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'AssetFlow Blockchain Node' });
});

app.listen(port, () => {
  console.log(`⛓️ Blockchain microservice running on port ${port}`);
});