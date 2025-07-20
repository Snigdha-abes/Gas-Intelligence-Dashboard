'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface GasDataItem {
  chain: string;
  gasPriceGwei: number;
  gasLimit: number;
  gasCostInEth: number;
  gasCostInUsd: number;
  error?: string;
}

export default function GasSimulatorPage() {
  const [ethAmount, setEthAmount] = useState('0.01');
  const [data, setData] = useState<GasDataItem[]>([]);
  const [loading, setLoading] = useState(false);

  const simulateGas = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/v1/simulate', {
        ethAmount: parseFloat(ethAmount),
      });

      if (response.data && Array.isArray(response.data.data)) {
        setData(response.data.data);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Simulation error:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/gas-history');
      const entries = response.data;

      const flattened = Object.entries(entries).flatMap(
        ([chain, datapoints]: [string, unknown]) => {
          if (!Array.isArray(datapoints)) return [];
          return datapoints.map((point) => ({
            chain,
            ...(point as Record<string, unknown>),
          }));
        }
      );

      console.log('Fetched history:', flattened);
    } catch (error) {
      console.error('❌ Failed to fetch gas history:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">⛽ Gas Cost Simulator + History</h1>

      <div className="flex items-center gap-2 mb-6">
        <input
          type="number"
          step="0.001"
          value={ethAmount}
          onChange={(e) => setEthAmount(e.target.value)}
          className="border p-2 rounded w-32"
        />
        <span>ETH</span>
        <button
          onClick={simulateGas}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Simulating...' : 'Simulate'}
        </button>
      </div>

      {loading && <p>⏳ Calculating...</p>}

      {!loading && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {data.map((item) => (
            <div key={item.chain} className="bg-white shadow-md rounded-xl p-4">
              <h2 className="text-xl font-semibold mb-2">{item.chain}</h2>
              {item.gasCostInUsd ? (
                <>
                  <p>Gas Price: {item.gasPriceGwei.toFixed(2)} Gwei</p>
                  <p>Gas Limit: {item.gasLimit}</p>
                  <p>Gas Cost (ETH): {item.gasCostInEth}</p>
                  <p>Gas Cost (USD): ${item.gasCostInUsd}</p>
                </>
              ) : (
                <p className="text-red-600">❌ {item.error || 'Data unavailable'}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
