import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale, BarElement } from 'chart.js';
import axios from 'axios';

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale, BarElement);

const TestQRData = () => {
    const [lineData, setLineData] = useState({
        labels: [],
        datasets: [
            {
                label: 'QR Code Scans',
                data: [],
                fill: false,
                backgroundColor: 'rgba(75,192,192,1)',
                borderColor: 'rgba(75,192,192,1)',
            },
        ],
    });

    const [barData, setBarData] = useState({
        labels: [],
        datasets: [
            {
                label: 'Monthly Visitors',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
            },
        ],
    });

    const fetchData = async () => {
        const qrid = 'RP4M'; // Replace with your actual QR ID
        const period = 'week'; // Set to 'week' for weekly data
        const timezone = 'Asia/Singapore'; // Set your desired timezone
        const apiKey = '668db5e0-b812-11ef-95be-712daf5bc246'; // Replace with your actual API key

        try {
            const response = await axios.get(`https://api.qrtiger.com/api/data/${qrid}`, {
                params: { period, tz: timezone },
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    Accept: 'application/json',
                },
            });

            const data = response.data.data;

            // Process the data for the line chart
            const lineLabels = data.graph.map(item => `${item._id.day}/${item._id.month}`); // Day/Month format
            const lineValues = data.graph.map(item => item.count); // Scan counts

            // Ensure at least 7 data points for the line chart
            while (lineValues.length < 7) {
                lineValues.unshift(0); // Add 0s at the beginning
                lineLabels.unshift(''); // Add empty labels
            }

            setLineData({
                labels: lineLabels,
                datasets: [
                    {
                        label: 'QR Code Scans',
                        data: lineValues,
                        fill: false,
                        backgroundColor: 'rgba(75,192,192,1)',
                        borderColor: 'rgba(75,192,192,1)',
                    },
                ],
            });

            // Process the data for the bar chart
            const barLabels = data.unique.map(item => `${item._id.day}/${item._id.month}`); // Day/Month format
            const barValues = data.unique.map(item => item.count); // Unique scan counts

            // Ensure at least 7 data points for the bar chart
            while (barValues.length < 7) {
                barValues.unshift(0); // Add 0s at the beginning
                barLabels.unshift(''); // Add empty labels
            }

            setBarData({
                labels: barLabels,
                datasets: [
                    {
                        label: 'Monthly Visitors',
                        data: barValues,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    },
                ],
            });

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'QR Code Scans Over Time',
            },
        },
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Monthly Visitors',
            },
        },
    };

    return (
        <Box sx={{ padding: 2 }}>
            <Typography variant="h4" gutterBottom>
                QR Code Analytics
            </Typography>
            <Box className="pu_analytics_white_box_list" sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box className="pu_analytics_white_box" sx={{ flex: '1 1 50%', maxWidth: '800px', padding: 2, backgroundColor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                    <Line data={lineData} options={options} />
                </Box>
                <Box className="pu_analytics_white_box" sx={{ flex: '1 1 50%', maxWidth: '800px', padding: 2, backgroundColor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                    <Bar data={barData} options={barOptions} />
                </Box>
            </Box>
        </Box>
    );
};

export default TestQRData;
