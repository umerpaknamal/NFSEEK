import dbConnect from '../../../lib/dbConnect';
import Users from '../../../models/User';

export default async function handler(req, res) {
    await dbConnect(); // Connect to the database

    // Get user ID from the request query
    const { userId } = req.query;

    try {
        const user = await Users.findById(userId).select('qrId qrImage qrUrl'); // Fetch user data with QR fields
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user); // Send the user data as a response
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}