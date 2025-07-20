"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time
} from "lightweight-charts";

// ------------------ TYPE DEFINITIONS ------------------

interface GasDataPoint {
  chain: string;
  gasCostInUsd: number;
  timestamp: string;
}

interface SimulationResult {
  chain: string;
  gasPriceGwei: number;
  gasLimit: number;
  gasCostInUsd: string;
  error?: string;
}

type ApiHistoryResponse = Record<string, number>;
type Theme = 'light' | 'dark';

// ------------------ HELPER & UI SUB-COMPONENTS ------------------

function Spinner({ theme }: { theme: Theme }) {
    return <div className={`h-8 w-8 animate-spin rounded-full border-4 ${theme === 'dark' ? 'border-gray-600 border-t-blue-500' : 'border-gray-300 border-t-blue-600'}`} />;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md transition-colors duration-300 text-center">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</div>
    </div>
  );
}

function Header({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: React.Dispatch<React.SetStateAction<boolean>> }) {
    return (
        <header className="flex flex-wrap justify-between items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold">⛽ Gas Intelligence Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Analyze gas prices and simulate transaction costs.</p>
            </div>
            <button
              onClick={() => setDarkMode(m => !m)}
              className="px-4 py-2 bg-gray-200 dark:bg-slate-800 rounded-full text-sm font-medium hover:ring-2 hover:ring-blue-500 transition"
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
        </header>
    );
}

// A single row in the results table
function ResultRow({ result }: { result: SimulationResult }) {
    return (
        <div className="grid grid-cols-3 gap-4 items-center py-3 px-4 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50">
            <div className="font-semibold text-gray-800 dark:text-white">{result.chain}</div>
            {result.gasCostInUsd ? (
                <>
                    <div className="text-sm text-gray-600 dark:text-gray-300 text-center">{result.gasPriceGwei.toFixed(2)} Gwei</div>
                    <div className="text-base font-bold text-green-500 text-right">${result.gasCostInUsd}</div>
                </>
            ) : (
                <div className="col-span-2 text-sm text-red-500 text-right">❌ {result.error || "Unavailable"}</div>
            )}
        </div>
    );
}



// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SimulatorPanel({ ethAmount, setEthAmount, loading, simulateGas, hasSimulated, simulationResult, darkMode }: any) {
    return (
        <div className="lg:col-span-1 space-y-8">
            <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md transition-colors duration-300">
                <h2 className="text-xl font-semibold mb-4">🔍 Simulate Transaction</h2>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            step="0.001"
                            value={ethAmount}
                            onChange={(e) => setEthAmount(e.target.value)}
                            className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <span className="text-lg font-medium text-gray-500 dark:text-gray-400">ETH</span>
                    </div>
                    <button
                        onClick={simulateGas}
                        disabled={loading}
                        className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50 transition-transform hover:scale-105"
                    >
                        {loading ? "Simulating..." : "🚀 Simulate Cost"}
                    </button>
                </div>
            </section>

            {hasSimulated && (
                <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md transition-colors duration-300">
                    <h2 className="text-xl font-semibold mb-2">Simulation Results</h2>
                    {loading ? (
                        <div className="flex justify-center p-10"><Spinner theme={darkMode ? 'dark' : 'light'}/></div>
                    ) : (
                        <div className="space-y-2 mt-4">
                            <div className="grid grid-cols-3 gap-4 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700 pb-2">
                                <span>Chain</span>
                                <span className="text-center">Gas Price</span>
                                <span className="text-right">Est. Cost</span>
                            </div>
                            {simulationResult.map((r: SimulationResult) => (
                                <ResultRow key={r.chain} result={r} />
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

// Panel for the historical data chart
function ChartPanel({ chartRef }: { chartRef: React.RefObject<HTMLDivElement> }) {
    return (
        <section className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md transition-colors duration-300">
            <h2 className="text-xl font-semibold mb-4">
                📈 Ethereum Gas History (15-min Candles)
            </h2>
            <div ref={chartRef} className="w-full h-[350px]" />
        </section>
    );
}


// ------------------ THE MAIN PAGE COMPONENT ------------------

export default function GasSimulatorPage() {
  // --- STATE MANAGEMENT ---
  const [ethAmount, setEthAmount] = useState("0.01");
  const [simulationResult, setSimulationResult] = useState<SimulationResult[]>([]);
  const [historicalData, setHistoricalData] = useState<GasDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [toast, setToast] = useState("");
  const [hasSimulated, setHasSimulated] = useState(false);

  // --- REFS ---
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // --- SIDE EFFECTS ---

  // Toast auto-dismissal
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // Fetch historical data periodically
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get<ApiHistoryResponse>("http://localhost:5000/api/gas-history");
        const now = new Date().toISOString();
        const pts = Object.entries(res.data).map(([chain, cost]) => ({
          chain,
          gasCostInUsd: cost,
          timestamp: now,
        }));
        setHistoricalData((d) => [...d, ...pts]);
      } catch {
        setToast("❌ History fetch failed");
      }
    };
    fetchHistory();
    const id = setInterval(fetchHistory, 15000);
    return () => clearInterval(id);
  }, []);

  // Initialize and update the chart based on data and theme
  useEffect(() => {
    if (!chartRef.current || historicalData.length === 0) return;
    
    const candles = aggregateCandles(historicalData);
    if (candles.length === 0) return;

    const chartOptions = {
        layout: {
            background: { color: darkMode ? "#1e293b" : "#f8fafc" },
            textColor: darkMode ? "#f8fafc" : "#1f2937",
        },
        grid: {
            vertLines: { color: darkMode ? "#334155" : "#e2e8f0" },
            horzLines: { color: darkMode ? "#334155" : "#e2e8f0" },
        },
    };

    if (!chartApiRef.current) {
      const chart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 350,
        ...chartOptions,
      });
      chartApiRef.current = chart;
      candleRef.current = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
        borderVisible: false,
      });
    } else {
      chartApiRef.current.applyOptions(chartOptions);
    }

    candleRef.current!.setData(candles);
    chartApiRef.current!.timeScale().fitContent();

    const handleResize = () => chartApiRef.current?.applyOptions({ width: chartRef.current?.clientWidth });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [historicalData, darkMode]);

  // --- LOGIC FUNCTIONS ---

  const simulateGas = async () => {
    setLoading(true);
    setHasSimulated(true);
    try {
      const res = await axios.post<{ data: SimulationResult[] }>(
        "http://localhost:5000/api/v1/simulate",
        { ethAmount: parseFloat(ethAmount) }
      );
      setSimulationResult(res.data.data || []);
      setToast("✅ Simulation successful");
    } catch {
      setSimulationResult([]);
      setToast("❌ Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  const aggregateCandles = (data: GasDataPoint[]): CandlestickData[] => {
    const buckets: Record<number, number[]> = {};
    const span = 15 * 60 * 1000;
    data
      .filter((d) => d.chain === "Ethereum")
      .forEach((d) => {
        const t = new Date(d.timestamp).getTime();
        const b = Math.floor(t / span) * span;
        if (!buckets[b]) buckets[b] = [];
        buckets[b].push(d.gasCostInUsd);
      });

    return Object.entries(buckets)
      .map(([time, arr]) => ({
        time: Number(time) / 1000 as Time,
        open: arr[0],
        high: Math.max(...arr),
        low: Math.min(...arr),
        close: arr[arr.length - 1],
      }))
      .sort((a, b) => (a.time as number) - (b.time as number));
  };
  
  // --- RENDER METHOD ---
  return (
    <div className={darkMode ? "dark" : ""}>
      <main className="min-h-screen font-sans bg-slate-50 text-gray-900 dark:bg-slate-900 dark:text-white transition-colors duration-300">
        {toast && (
          <div className="fixed top-6 right-6 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-lg animate-bounce z-50">
            {toast}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard label="💰 ETH Input" value={`${ethAmount} ETH`} />
            <StatCard label="⛓️ Chains Simulated" value={simulationResult.length} />
            <StatCard label="📊 Data Points" value={historicalData.length} />
            <StatCard label="🎨 Current Theme" value={darkMode ? "Dark" : "Light"} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <SimulatorPanel 
                ethAmount={ethAmount}
                setEthAmount={setEthAmount}
                loading={loading}
                simulateGas={simulateGas}
                hasSimulated={hasSimulated}
                simulationResult={simulationResult}
                darkMode={darkMode}
            />
            <ChartPanel chartRef={chartRef} />
          </div>
        </div>
      </main>
    </div>
  );
}
