"use client";

import React, { useEffect, useRef, useState, createContext, useContext } from "react";
import axios from "axios";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  type BarData,
  ColorType
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

// Props for the SimulatorPanel component
interface SimulatorPanelProps {
    ethAmount: string;
    setEthAmount: React.Dispatch<React.SetStateAction<string>>;
    loading: boolean;
    simulateGas: () => Promise<void>;
    hasSimulated: boolean;
    simulationResult: SimulationResult[];
}


// ------------------ THEME MANAGEMENT ------------------

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: 'dark',
  toggleTheme: () => {},
});

const useTheme = () => useContext(ThemeContext);

// ------------------ UI SUB-COMPONENTS ------------------

function Spinner() {
    const { theme } = useTheme();
    return <div className={`h-8 w-8 animate-spin rounded-full border-4 ${theme === 'dark' ? 'border-gray-700 border-t-blue-500' : 'border-gray-300 border-t-blue-600'}`} />;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 p-5 rounded-xl shadow-md transition-colors duration-300 flex items-center gap-4 border border-transparent dark:border-gray-800">
        <div className="bg-blue-100 dark:bg-gray-800 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</div>
        </div>
    </div>
  );
}

function Header({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
    const { theme, toggleTheme } = useTheme();
    return (
        <header className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-lg p-4 rounded-xl shadow-md flex justify-between items-center border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <h1 className="text-xl font-bold">Gas Intelligence Dashboard</h1>
            </div>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                {theme === 'dark' ? '☀️' : '🌙'}
            </button>
        </header>
    );
}

function Sidebar({ isOpen, setSidebarOpen }: { isOpen: boolean; setSidebarOpen: (open: boolean) => void }) {
    return (
        <>
            <aside className={`fixed lg:relative top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg lg:shadow-none z-20 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 border-r border-gray-200 dark:border-gray-800`}>
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-8">⛽ Gas Tracker</h2>
                    <nav className="space-y-4">
                        <a href="#" className="flex items-center gap-3 p-2 rounded-lg bg-blue-600 text-white font-semibold">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                            Dashboard
                        </a>
                    </nav>
                </div>
            </aside>
            {isOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-10 lg:hidden"></div>}
        </>
    );
}

// ------------------ MAIN PAGE COMPONENT ------------------

export default function GasSimulatorPage() {
    const [theme, setTheme] = useState<Theme>('dark');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('gas-dashboard-theme') as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('gas-dashboard-theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div className={`${theme} flex min-h-screen bg-gray-100 dark:bg-black transition-colors duration-300`}>
                <Sidebar isOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <div className="flex-1 p-4 lg:p-8">
                    <Header setSidebarOpen={setSidebarOpen} />
                    <DashboardContent />
                </div>
            </div>
        </ThemeContext.Provider>
    );
}

// ------------------ DASHBOARD CONTENT ------------------

function DashboardContent() {
  const { theme } = useTheme();
  const [ethAmount, setEthAmount] = useState("0.01");
  const [simulationResult, setSimulationResult] = useState<SimulationResult[]>([]);
  const [historicalData, setHistoricalData] = useState<GasDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [toast, setToast] = useState("");

  const candlestickChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get<ApiHistoryResponse>(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/gas-history`);
        const now = new Date().toISOString();
        const pts = Object.entries(res.data).map(([chain, cost]) => ({ chain, gasCostInUsd: cost, timestamp: now }));
        setHistoricalData(d => [...d, ...pts]);
        if(isChartLoading) setIsChartLoading(false);
      } catch {
        setToast("❌ History fetch failed");
      }
    };
    fetchHistory();
    const id = setInterval(fetchHistory, 15000);
    return () => clearInterval(id);
  }, []);

  const simulateGas = async () => {
    setLoading(true);
    try {
      const res = await axios.post<{ data: SimulationResult[] }>(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/simulate`, { ethAmount: parseFloat(ethAmount) });
      setSimulationResult(res.data.data || []);
      setToast("✅ Simulation successful");
    } catch {
      setSimulationResult([]);
      setToast("❌ Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mt-8 space-y-8">
        {toast && <div className="fixed top-20 right-6 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-lg z-50">{toast}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} label="ETH Input" value={`${ethAmount} ETH`} />
            <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>} label="Chains Simulated" value={simulationResult.length} />
            <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} label="Data Points" value={historicalData.length} />
            <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0" /></svg>} label="Current Theme" value={theme === 'dark' ? 'Dark' : 'Light'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
                <SimulatorPanel ethAmount={ethAmount} setEthAmount={setEthAmount} loading={loading} simulateGas={simulateGas} simulationResult={simulationResult} hasSimulated={simulationResult.length > 0 || loading} />
                <LiveGasPanel historicalData={historicalData} barChartRef={barChartRef} isChartLoading={isChartLoading} />
            </div>
            <div className="lg:col-span-2">
                <CandlestickChartPanel chartRef={candlestickChartRef} historicalData={historicalData} isChartLoading={isChartLoading} />
            </div>
        </div>
    </main>
  );
}

// ------------------ LOGIC-HEAVY COMPONENTS ------------------

function SimulatorPanel({ ethAmount, setEthAmount, loading, simulateGas, simulationResult, hasSimulated }: SimulatorPanelProps) {
    const { theme } = useTheme();
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md transition-colors duration-300 border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold mb-4">🔍 Simulate Transaction</h2>
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <input type="number" step="0.001" value={ethAmount} onChange={(e) => setEthAmount(e.target.value)} className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    <span className="text-lg font-medium text-gray-500 dark:text-gray-400">ETH</span>
                </div>
                <button onClick={simulateGas} disabled={loading} className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50 transition-transform hover:scale-105">
                    {loading ? "Simulating..." : "🚀 Simulate Cost"}
                </button>
            </div>
            {hasSimulated && (
                <div className="mt-6">
                    {loading ? (
                        <div className="flex justify-center p-10"><Spinner theme={theme}/></div>
                    ) : (
                        <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-4 px-2 text-sm font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">
                                <span>Chain</span>
                                <span className="text-center">Gas Price</span>
                                <span className="text-right">Est. Cost</span>
                            </div>
                            {simulationResult.map((r: SimulationResult) => (
                                 <div key={r.chain} className="grid grid-cols-3 gap-4 items-center py-2 px-2 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <div className="font-semibold text-gray-800 dark:text-white">{r.chain}</div>
                                    {r.gasCostInUsd ? (
                                        <>
                                            <div className="text-sm text-gray-600 dark:text-gray-300 text-center">{parseFloat(r.gasPriceGwei).toFixed(2)} Gwei</div>
                                            <div className="text-base font-bold text-green-500 text-right">${r.gasCostInUsd}</div>
                                        </>
                                    ) : (
                                        <div className="col-span-2 text-sm text-red-500 text-right">❌ {r.error || "Unavailable"}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function LiveGasPanel({ historicalData, barChartRef, isChartLoading }: { historicalData: GasDataPoint[]; barChartRef: React.RefObject<HTMLDivElement>; isChartLoading: boolean }) {
    const { theme } = useTheme();
    const chartApiRef = useRef<IChartApi | null>(null);
    const barSeriesRef = useRef<ISeriesApi<"Bar"> | null>(null);

    useEffect(() => {
        if (!barChartRef.current || historicalData.length === 0) return;

        const latestData = Array.from(new Map(historicalData.map(item => [item.chain, item])).values())
            .filter(d => typeof d.gasCostInUsd === 'number');

        const barData: BarData[] = latestData.map((d, i) => ({
            time: i as Time,
            value: d.gasCostInUsd,
            color: d.chain === 'Ethereum' ? '#60A5FA' : d.chain === 'Polygon' ? '#818CF8' : '#A78BFA',
        }));

        const chartOptions = {
            layout: { background: { type: 'solid' as ColorType.Solid, color: 'transparent' }, textColor: theme === 'dark' ? '#D1D5DB' : '#1F2937' },
            grid: { vertLines: { visible: false }, horzLines: { color: theme === 'dark' ? '#374151' : '#E5E7EB' } },
            rightPriceScale: { borderVisible: false },
            timeScale: { borderVisible: false, tickMarkFormatter: (time: Time) => latestData[time as number]?.chain || '' },
        };

        if (!chartApiRef.current) {
            const chart = createChart(barChartRef.current, { width: barChartRef.current.clientWidth, height: 250, ...chartOptions });
            chartApiRef.current = chart;
            barSeriesRef.current = chart.addBarSeries({});
        } else {
            chartApiRef.current.applyOptions(chartOptions);
        }

        barSeriesRef.current.setData(barData);

    }, [historicalData, theme]);

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md transition-colors duration-300 border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold mb-4">⚡ Live Gas Prices (USD)</h2>
            {isChartLoading ? (
                <div className="h-[250px] flex justify-center items-center"><Spinner theme={theme}/></div>
            ) : (
                <div ref={barChartRef} className="w-full h-[250px]" />
            )}
        </div>
    );
}

function CandlestickChartPanel({ chartRef, historicalData, isChartLoading }: { chartRef: React.RefObject<HTMLDivElement>; historicalData: GasDataPoint[]; isChartLoading: boolean }) {
    const { theme } = useTheme();
    const chartApiRef = useRef<IChartApi | null>(null);
    const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    const aggregateCandles = (data: GasDataPoint[]): CandlestickData[] => {
        const buckets: Record<number, number[]> = {};
        const span = 15 * 60 * 1000;
        data.filter(d => d.chain === "Ethereum").forEach(d => {
            const t = new Date(d.timestamp).getTime();
            const b = Math.floor(t / span) * span;
            if (!buckets[b]) buckets[b] = [];
            buckets[b].push(d.gasCostInUsd);
        });
        return Object.entries(buckets).map(([time, arr]) => ({
            time: Number(time) / 1000 as Time, open: arr[0], high: Math.max(...arr),
            low: Math.min(...arr), close: arr[arr.length - 1],
        })).sort((a, b) => (a.time as number) - (b.time as number));
    };

    useEffect(() => {
        if (!chartRef.current || historicalData.length === 0) return;
        const candles = aggregateCandles(historicalData);
        if (candles.length === 0) return;

        const chartOptions = {
            layout: { background: { type: 'solid' as ColorType.Solid, color: 'transparent' }, textColor: theme === 'dark' ? '#D1D5DB' : '#1F2937' },
            grid: { vertLines: { color: theme === 'dark' ? '#4B5563' : '#E5E7EB' }, horzLines: { color: theme === 'dark' ? '#4B5563' : '#E5E7EB' } },
            rightPriceScale: { borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB' },
            timeScale: { borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB', timeVisible: true },
        };

        if (!chartApiRef.current) {
            const chart = createChart(chartRef.current, { width: chartRef.current.clientWidth, height: 400, ...chartOptions });
            chartApiRef.current = chart;
            candleRef.current = chart.addCandlestickSeries({
                upColor: "#22c55e", downColor: "#ef4444", wickUpColor: "#22c55e",
                wickDownColor: "#ef4444", borderVisible: false,
            });
        } else {
            chartApiRef.current.applyOptions(chartOptions);
        }

        candleRef.current!.setData(candles);
        chartApiRef.current!.timeScale().fitContent();

        const handleResize = () => chartApiRef.current?.applyOptions({ width: chartRef.current?.clientWidth });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [historicalData, theme]);

    return (
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl shadow-md transition-colors duration-300 h-full border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold mb-4">📈 Ethereum Gas History (15-min Candles)</h2>
            {isChartLoading ? (
                <div className="h-[400px] flex justify-center items-center"><Spinner theme={theme} /></div>
            ) : (
                <div ref={chartRef} className="w-full h-[400px]" />
            )}
        </div>
    );
}
