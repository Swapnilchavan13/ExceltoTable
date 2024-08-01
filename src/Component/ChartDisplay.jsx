import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const processDataForChart = (data, categoryKey) => {
  const categoryCounts = data.reduce((acc, item) => {
    const category = item[categoryKey];
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const totalCount = Object.values(categoryCounts).reduce((acc, count) => acc + count, 0);

  const chartData = {
    labels: Object.keys(categoryCounts),
    datasets: [
      {
        data: Object.values(categoryCounts).map(count => (count)),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
      },
    ],
  };

  return chartData;
};

const ChartDisplay = ({ data }) => {
  const categoryChartData = processDataForChart(data, 'Cateogory'); // Replace 'category' with the actual key in your data
  const subCategoryChartData = processDataForChart(data, 'Sub Categories'); // Replace 'subcategory' with the actual key in your data

  return (
    <div>
      <div>
      <h2>Category Distribution</h2>
      <div style={{width:'50%', margin:'auto'}}>
      <Pie data={categoryChartData} />
      </div>

      <div style={{width:'100%'}}>
      <h2>Subcategory Distribution</h2>
      <Bar data={subCategoryChartData} options={{ indexAxis: 'x' }} />
      </div>
      </div>
    </div>
  );
};

export default ChartDisplay;
