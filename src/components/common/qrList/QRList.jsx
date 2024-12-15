const QRList = ({ qrData }) => {
    return (
        <div>
            {qrData.length > 0 ? (
                <ul>
                    {qrData.map((qr) => (
                        <li key={qr.qrId}>
                            <img src={qr.qrImage} alt={`QR Code for ${qr.qrUrl}`} />
                            <p>URL: {qr.qrUrl}</p>
                            <p>QR ID: {qr.qrId}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No QR codes found.</p>
            )}
        </div>
    );
};

export default QRList; 