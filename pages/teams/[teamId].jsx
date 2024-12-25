import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { common } from '../../src/helper/Common';
import { setPageHeading } from '../../src/redux/actions/commonAction';
import DataTable from 'react-data-table-component';
import { Tooltip } from '@mui/material';
import svg from '../../src/helper/svg';
import Link from 'next/link';
import axios from 'axios';

const TeamDetails = () => {
    const router = useRouter();
    const { teamId } = router.query;
    const dispatch = useDispatch();
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qrStats, setQrStats] = useState({});
    const [loadingStats, setLoadingStats] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        if (teamId) {
            fetchTeamDetails();
        }
    }, [teamId]);

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

    const fetchTeamDetails = async () => {
        setLoading(true);
        setError(null);
        
        try {
            common.getAPI({
                method: 'POST',
                url: 'team/getTeamDetails',
                data: { teamId }
            }, async (resp) => {
                if (resp.status === "success" && resp.data) {
                    dispatch(setPageHeading({
                        pageHeading: resp.data.teamName,
                        title: `Team - ${resp.data.teamName}`
                    }));

                    // Set team data
                    setTeamData(resp.data);

                    // Fetch QR stats for members with QR IDs
                    if (resp.data.members && resp.data.members.length > 0) {
                        for (const member of resp.data.members) {
                            if (member.contactId?.qrId && member.contactId?.email) {
                                await fetchQRStats(member.contactId.qrId, member.contactId.email);
                            }
                        }
                    }
                } else {
                    setError(resp.message || 'Failed to fetch team details');
                }
                setLoading(false);
            });
        } catch (error) {
            console.error('Error:', error);
            setError(error.message || 'Failed to load team details');
            setLoading(false);
        }
    };

    const columns = [
        {
            name: 'Name',
            selector: row => `${row.contactId?.firstName || ''} ${row.contactId?.lastName || ''}`,
            cell: row => (
                <div className="pu_contact_info">
                    <div className="pu_member_avatar">
                        <span>{row.contactId?.firstName?.charAt(0)}{row.contactId?.lastName?.charAt(0)}</span>
                    </div>
                    <div className="pu_contact_details">
                        <span className="pu_contact_name">
                            {row.contactId?.firstName} {row.contactId?.lastName}
                        </span>
                        <span className="pu_contact_email">{row.contactId?.email}</span>
                    </div>
                </div>
            )
        },
        {
            name: 'QR ID',
            selector: row => row.contactId?.qrId || '-',
            cell: row => (
                <div className="pu_qr_id">
                    {row.contactId?.qrId ? (
                        <span className="pu_qr_code">
                            {svg.qr_code_icon}
                            {row.contactId.qrId}
                        </span>
                    ) : '-'}
                </div>
            )
        },
        {
            name: 'Today\'s Scans',
            width: '120px',
            cell: row => (
                <div className="pu_scan_stats">
                    {row.contactId?.qrId ? (
                        loadingStats[row.contactId.email] ? (
                            <div className="pu_loading_indicator">Loading...</div>
                        ) : (
                            <span className="pu_scan_count">
                                {qrStats[row.contactId.email]?.day || '0'}
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
                    {row.contactId?.qrId ? (
                        loadingStats[row.contactId.email] ? (
                            <div className="pu_loading_indicator">Loading...</div>
                        ) : (
                            <span className="pu_scan_count">
                                {qrStats[row.contactId.email]?.week || '0'}
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
                    {row.contactId?.qrId ? (
                        loadingStats[row.contactId.email] ? (
                            <div className="pu_loading_indicator">Loading...</div>
                        ) : (
                            <span className="pu_scan_count">
                                {qrStats[row.contactId.email]?.month || '0'}
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
                <div className="pu_pagetitle_left">
                    <Link href="/teams">
                        <a className="pu_back_arrow">
                            <span className="pu_back_arrow_icon">{svg.back_arrow}</span>
                            Back to Teams
                        </a>
                    </Link>
                    {teamData && (
                        <>
                            <h3>{teamData.teamName}</h3>
                            {teamData.description && (
                                <p className="pu_team_description">{teamData.description}</p>
                            )}
                        </>
                    )}
                </div>
            </div>

            {teamData && (
                <div className="pu_dataTablestyle">
                    <DataTable
                        columns={columns}
                        data={teamData?.members || []}
                        pagination
                        progressPending={loading}
                        noDataComponent={
                            <div className="pu_noData">
                                <span>{svg.noData}</span>
                                <h3>No Records Found.</h3>
                                <p>There are no members in this team.</p>
                            </div>
                        }
                        customStyles={{
                            headRow: {
                                style: {
                                    backgroundColor: '#f8f9fa',
                                    borderBottom: '1px solid #dee2e6'
                                }
                            },
                            rows: {
                                style: {
                                    minHeight: '72px'
                                }
                            },
                            cells: {
                                style: {
                                    padding: '16px'
                                }
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default TeamDetails;