import React, { useState, useEffect } from 'react';
import styles from './QRCodeList.module.css';
import { getNameInitials } from '../../../helper/helper';
import svg from '../../../helper/svg';
import Popup from '../../common/popup/Popup';
import axios from 'axios';

const QRCodeList = () => {
    const [qrCode, setQrCode] = useState(null);
    const [selectedQRCode, setSelectedQRCode] = useState(null);
    const [editPopupVisible, setEditPopupVisible] = useState(false);
    const [editUrl, setEditUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingQRCodeId, setEditingQRCodeId] = useState(null);

    useEffect(() => {
        const fetchQRCodeData = async () => {
            const persistedData = localStorage.getItem('persist:root');
            if (!persistedData) {
                console.error('No user data found in local storage.');
                return;
            }

            const parsedData = JSON.parse(persistedData);
            const userData = JSON.parse(parsedData.userData);
            const userId = userData.user_id;

            try {
                const response = await axios.get(`/api/user/getQRData?userId=${userId}`);
                setQrCode(response.data);
            } catch (err) {
                console.error('Error fetching QR code data:', err);
            }
        };

        fetchQRCodeData();
    }, []);

    const handleShowQRCode = () => {
        setSelectedQRCode(qrCode);
    };

    const handleEditQRCode = () => {
        console.log('Editing QR Code:', qrCode);
        setEditUrl(qrCode.qrUrl);
        setEditingQRCodeId(qrCode.qrId);
        setSelectedQRCode(null);
        setEditPopupVisible(true);
    };

    const handleUpdateUrl = async () => {
        const apiKey = '668db5e0-b812-11ef-95be-712daf5bc246';

        if (!editingQRCodeId) {
            console.error('No QR code selected for update.');
            return;
        }

        const requestBody = {
            qr: {
                size: 500,
                colorDark: 'rgb(5,64,128)',
                logo: '',
                eye_outer: 'eyeOuter2',
                eye_inner: 'eyeInner1',
                qrData: 'pattern0',
                backgroundColor: 'rgb(255,255,255)',
                transparentBkg: false,
                qrCategory: 'url',
                text: editUrl
            },
            qrUrl: editUrl,
            qrType: 'qr2',
            qrCategory: 'url'
        };

        setLoading(true);

        try {
            console.log('Sending request to update QR code:', requestBody);
            const response = await axios.post(`https://api.qrtiger.com/api/campaign/edit/${editingQRCodeId}`, requestBody, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                }
            });

            console.log('QR Code updated successfully:', response.data);
            setEditPopupVisible(false);
        } catch (error) {
            console.error('Error updating QR code:', error);
            alert('Failed to update QR code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className={styles.qrcode_list_wrapper}>
                {qrCode && (
                    <div className={styles.qrcode_item}>
                        <div className={styles.qrcode_image}>
                            {qrCode.qrImage ? 
                                <img src={qrCode.qrImage} alt={qrCode.qrId} style={{ width: '100%', height: 'auto' }} />
                                : <span className={styles.qrcode_avatar_initials}>{getNameInitials(qrCode.name)}</span>
                            }
                        </div>
                        <div className={styles.qrcode_details}>
                            <h3>{qrCode.qrId}</h3>
                            <p>
                                <a href={qrCode.qrUrl} target="_blank" rel="noreferrer">{qrCode.qrUrl}</a>
                            </p>
                        </div>
                        <div className={styles.qrcode_actions}>
                            <button className="pu_btn pu_btn_link" style={{ marginRight: '10px' }} onClick={handleShowQRCode}>Show QR</button>
                            <button className="pu_btn pu_btn_link" onClick={handleEditQRCode}>Edit</button>
                        </div>
                    </div>
                )}
            </div>

            {selectedQRCode && (
                <Popup
                    heading="QR Code"
                    show={!!selectedQRCode}
                    onClose={() => setSelectedQRCode(null)}
                >
                    <img src={selectedQRCode.qrImage} alt={selectedQRCode.qrId} style={{ width: '100%' }} />
                </Popup>
            )}

            {editPopupVisible && (
                <Popup
                    heading="Edit QR Code URL"
                    show={editPopupVisible}
                    onClose={() => setEditPopupVisible(false)}
                    maxWidth="600px"
                >
                    <div className="popup_form_wrapper">
                        <div className="pu_input_wrapper">
                            <label htmlFor="edit-url">QR Code URL</label>
                            <input
                                id="edit-url"
                                type="text"
                                className="pu_input"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                placeholder="Enter new QR URL"
                            />
                        </div>
                        <div className="text-center">
                            <button className="pu_btn" onClick={handleUpdateUrl} disabled={loading}>
                                {loading ? 'Updating...' : 'Update'}
                            </button>
                        </div>
                    </div>
                </Popup>
            )}
        </>
    );
};

export default QRCodeList; 
