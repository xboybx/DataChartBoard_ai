
"use client";

import { Bar, Line, Pie, Doughnut, PolarArea, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, RadialLinearScale, Filler, BarElement } from 'chart.js';
import { AlertTriangle } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, RadialLinearScale, Filler, BarElement);

interface ChartData {
    type: 'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea' | 'radar';
    data: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
            backgroundColor?: string | string[];
            borderColor?: string | string[];
            borderWidth?: number;
        }>;
    };
    options?: any;
}

const ChartDisplay = ({ chartData }: { chartData: ChartData }) => {
    const dataIsValid =
        chartData &&
        chartData.data &&
        Array.isArray(chartData.data.labels) &&
        chartData.data.labels.length > 0 &&
        Array.isArray(chartData.data.datasets) &&
        chartData.data.datasets.length > 0 &&
        chartData.data.datasets.every(ds => Array.isArray(ds.data) && ds.data.length > 0);

    if (!dataIsValid) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-4 bg-white/30 backdrop-blur-xl border border-dashed border-white/60 rounded-2xl shadow-sm">
                <AlertTriangle className="w-10 h-10 mb-4 text-purple-400" />
                <p className="font-semibold text-gray-800">Incomplete Chart Data</p>
                <p className="text-sm mt-1">The AI-provided data was incomplete, so the chart could not be rendered.</p>
            </div>
        );
    }

    const chartComponents = {
        bar: Bar,
        line: Line,
        pie: Pie,
        doughnut: Doughnut,
        polarArea: PolarArea,
        radar: Radar,
    };

    const ChartComponent = chartComponents[chartData.type];

    if (!ChartComponent) {
        return <p className="text-red-500 p-4">Unsupported chart type: "{chartData.type}"</p>;
    }

    const processedData = {
        ...chartData.data,
        datasets: chartData.data.datasets.map(dataset => ({
            ...dataset,
            backgroundColor: dataset.backgroundColor || [
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 99, 132, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)',
            ],
            borderColor: dataset.borderColor || dataset.backgroundColor?.[0] || 'rgba(54, 162, 235, 1)',
            borderWidth: dataset.borderWidth === undefined ? 1 : dataset.borderWidth,
        })),
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#4B5563', // gray-600
                    font: {
                        size: 12,
                        family: 'Inter, system-ui, sans-serif'
                    },
                    padding: 20,
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#111827',
                bodyColor: '#4B5563',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                boxPadding: 4,
            },
        },
        scales: {
            x: {
                ticks: {
                    color: '#6B7280', // gray-500
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.04)',
                }
            },
            y: {
                ticks: {
                    color: '#6B7280',
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.04)',
                }
            }
        },
        ...chartData.options,
    };


    return (
        <div className="relative h-full w-full">
            <ChartComponent data={processedData} options={options} />
        </div>
    );
};

export default ChartDisplay;