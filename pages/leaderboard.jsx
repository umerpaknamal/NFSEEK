import { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Tooltip } from '@mui/material';
import { useDispatch } from 'react-redux';
import { setPageHeading } from '../src/redux/actions/commonAction';
import svg from '../src/helper/svg';
import moment from 'moment';

const Leaderboard = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [qrStats, setQrStats] = useState({});
    const [loadingStats, setLoadingStats] = useState({});

    useEffect(() => {
        dispatch(setPageHeading({
            pageHeading: "Leaderboard",
            title: "User Leaderboard"
        }));
        fetchLeaderboardData();
    }, []);

    const fetchQRStats = async (qrId, email) => {
        setLoadingStats(prev => ({ ...prev, [email]: true }));
        try {
            const response = await axios.get(`https://api.qrtiger.com/api/data/${qrId}`, {
                params: { 
                    period: 'month',
                    tz: 'Asia/Singapore' 
                },
                headers: {
                    Authorization: 'Bearer 668db5e0-b812-11ef-95be-712daf5bc246',
                    Accept: 'application/json'
                }
            });

            const data = response.data.data;
            
            const stats = {
                day: data.graph.filter(item => {
                    const date = new Date(item._id.year, item._id.month - 1, item._id.day);
                    const today = new Date();
                    return date.toDateString() === today.toDateString();
                }).reduce((sum, item) => sum + item.count, 0),
                
                week: data.graph.filter(item => {
                    const date = new Date(item._id.year, item._id.month - 1, item._id.day);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return date >= weekAgo;
                }).reduce((sum, item) => sum + item.count, 0),
                
                month: data.totalScanByDate || 0
            };

            setQrStats(prev => ({
                ...prev,
                [email]: stats
            }));
        } catch (error) {
            console.error('Error fetching QR stats for', email, ':', error);
        } finally {
            setLoadingStats(prev => ({ ...prev, [email]: false }));
        }
    };

    const fetchLeaderboardData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/getLeaderboardData');
            const users = response.data;

            if (users && users.length > 0) {
                // Fetch QR stats for each user
                const updatedUsers = await Promise.all(users.map(async (user) => {
                    if (user.qrId) {
                        try {
                            await fetchQRStats(user.qrId, user.email);
                            return {
                                ...user,
                                totalScans: qrStats[user.email]?.week || 0
                            };
                        } catch (error) {
                            console.error(`Error fetching QR stats for ${user.email}:`, error);
                            return {
                                ...user,
                                totalScans: 0
                            };
                        }
                    }
                    return {
                        ...user,
                        totalScans: 0
                    };
                }));

                // Sort users by total scans
                const sortedUsers = updatedUsers.sort((a, b) => b.totalScans - a.totalScans);
                setLeaderboardData(sortedUsers);
            } else {
                setLeaderboardData([]);
            }
        } catch (error) {
            console.error('Error fetching leaderboard data:', error);
            setLeaderboardData([]);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            name: '#S.N.',
            width: '100px',
            center: true,
            cell: (row, index) => (<span>{'#' + (index + 1)}</span>)
        },
        {
            name: 'Name',
            selector: row => `${row.firstName} ${row.lastName}`,
            sortable: true,
            cell: (row) => (
                <div className="pu_avatarName_wrapper">
                    <div className="pu_avatar_icon">
                        <span className="pu_avatar_initial">
                            {row.firstName && row.firstName.charAt(0)}{row.lastName && row.lastName.charAt(0)}
                        </span>
                    </div>
                    <div className="pu_avatar_name">{row.firstName} {row.lastName}</div>
                </div>
            )
        },
        {
            name: 'QR ID',
            selector: row => row.qrId,
            sortable: true
        },
        {
            name: 'Email',
            selector: row => row.email,
            sortable: true
        },
        {
            name: 'Total Scans (Last 7 Days)',
            selector: row => row.totalScans,
            sortable: true
        },
        {
            name: 'Registration Date',
            selector: row => row.createdAt,
            sortable: true,
            cell: (row) => (
                <div>
                    {row.createdAt ?
                        <span className="">{moment(row.createdAt).format("DD-MMM-YYYY")}</span>
                        :
                        <span style={{ marginLeft: '40px' }}>{'-'}</span>
                    }
                </div>
            )
        },
        {
            name: 'Today\'s Scans',
            width: '120px',
            cell: row => (
                <div className="pu_scan_stats">
                    {row.qrId ? (
                        loadingStats[row.email] ? (
                            <div className="pu_loading_indicator">Loading...</div>
                        ) : (
                            <span className="pu_scan_count">
                                {qrStats[row.email]?.day || '0'}
                                <span className="pu_scan_label">scans</span>
                            </span>
                        )
                    ) : '-'}
                </div>
            )
        },
        {
            name: 'Weekly Scans',
            width: '120px',
            cell: row => (
                <div className="pu_scan_stats">
                    {row.qrId ? (
                        loadingStats[row.email] ? (
                            <div className="pu_loading_indicator">Loading...</div>
                        ) : (
                            <span className="pu_scan_count">
                                {qrStats[row.email]?.week || '0'}
                                <span className="pu_scan_label">scans</span>
                            </span>
                        )
                    ) : '-'}
                </div>
            )
        },
        {
            name: 'Monthly Scans',
            width: '120px',
            cell: row => (
                <div className="pu_scan_stats">
                    {row.qrId ? (
                        loadingStats[row.email] ? (
                            <div className="pu_loading_indicator">Loading...</div>
                        ) : (
                            <span className="pu_scan_count">
                                {qrStats[row.email]?.month || '0'}
                                <span className="pu_scan_label">scans</span>
                            </span>
                        )
                    ) : '-'}
                </div>
            )
        }
    ];

    return (
        <div className="pu_container">
            <div className="pu_pagetitle_wrapper">
                <h3>Leaderboard</h3>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="pu_dataTablestyle">
                    <DataTable
                        columns={columns}
                        data={leaderboardData}
                        pagination
                        customStyles={{
                            headRow: {
                                style: {
                                    backgroundColor: '#f8f9fa',
                                    borderBottom: '1px solid #dee2e6'
                                }
                            },
                            cells: {
                                style: {
                                    padding: '15px'
                                }
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default Leaderboard;