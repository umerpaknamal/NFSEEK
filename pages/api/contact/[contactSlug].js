import { authMiddleware } from '../../../lib/authMiddleware';
import { Contact } from '../../../models/DB';
import Common from '../../../helpers/Common';

const routeHandler = {}

routeHandler.getContacts = async (req, res) => {
    let postdata = req.body;
    let user = req.vsuser;
    try {
        // First get all contacts with pagination
        let page = parseInt(postdata.page || 1);
        let limit = parseInt(postdata.listPerPage || 10);
        let skip = (page - 1) * limit;
        let query = { userId: user._id };

        if (postdata.searchTerm != "") {
            postdata.searchTerm = postdata.searchTerm.trim();
            query.$or = [
                { firstName: { $regex: postdata.searchTerm, $options: "i" } },
                { lastName: { $regex: postdata.searchTerm, $options: "i" } },
                { email: { $regex: postdata.searchTerm, $options: "i" } }
            ];
        }

        const contacts = await Contact.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'users',
                    localField: 'email',
                    foreignField: 'email',
                    as: 'userInfo'
                }
            },
            {
                $addFields: {
                    isUser: { $gt: [{ $size: '$userInfo' }, 0] },
                    qrId: { $arrayElemAt: ['$userInfo.qrId', 0] },
                    qrImage: { $arrayElemAt: ['$userInfo.qrImage', 0] },
                    qrUrl: { $arrayElemAt: ['$userInfo.qrUrl', 0] }
                }
            },
            {
                $project: {
                    userInfo: 0
                }
            }
        ]).skip(skip).limit(limit);

        const totalContacts = await Contact.countDocuments(query);

        res.json({
            status: 'success',
            data: contacts,
            totalContacts: totalContacts,
            perPage: limit,
            currentPage: page
        });
    } catch(err) {
        console.error('Error in getContacts:', err);
        res.json({
            status: 'error',
            message: 'Server error'
        });
    }
};

routeHandler.addContact = async (req, res) => {
    let postdata = req.body;
    let user = req.vsuser;
    
    try {
        let validateFields = ["firstName", "lastName", "email", "phoneNumber"];
        let response = await Common.requestFieldsValidation(validateFields, postdata);
        
        if(response.status) {
            const newContact = new Contact({
                userId: user._id,
                firstName: postdata.firstName,
                lastName: postdata.lastName,
                email: postdata.email,
                phoneNumber: postdata.phoneNumber,
                company: postdata.company || '',
                website: postdata.website || '',
                remarks: postdata.remarks || ''
            });

            await newContact.save();
            
            return res.json({
                status: 'success',
                message: 'Contact added successfully',
                data: newContact
            });
        } 
        
        return res.json({
            status: 'error',
            message: 'Required fields are missing'
        });
        
    } catch(err) {
        console.error('Error in addContact:', err);
        return res.json({
            status: 'error',
            message: err.message || 'Server error'
        });
    }
};

routeHandler.updateContact = async (req, res) => {
    let postdata = req.body;
    let user = req.vsuser;
    
    try {
        let validateFields = ["contactId", "firstName", "lastName", "email", "phoneNumber"];
        let response = await Common.requestFieldsValidation(validateFields, postdata);
        
        if(response.status) {
            let where = {
                _id: postdata.contactId,
                userId: user._id
            };

            let set = {
                firstName: postdata.firstName,
                lastName: postdata.lastName,
                email: postdata.email,
                phoneNumber: postdata.phoneNumber,
                company: postdata.company || '',
                website: postdata.website || '',
                remarks: postdata.remarks || '',
                updatedAt: new Date()
            };

            const updatedContact = await Contact.findOneAndUpdate(
                where,
                { $set: set },
                { new: true }
            );

            if (!updatedContact) {
                return res.json({
                    status: 'error',
                    message: 'Contact not found or you do not have permission to update it'
                });
            }

            return res.json({
                status: 'success',
                message: 'Contact updated successfully',
                data: updatedContact
            });
        } 
        
        return res.json({
            status: 'error',
            message: 'Required fields are missing'
        });
        
    } catch(err) {
        console.error('Error in updateContact:', err);
        return res.json({
            status: 'error',
            message: err.message || 'Server error'
        });
    }
};

routeHandler.deleteContact = async (req, res) => {
    let postdata = req.body;
    let user = req.vsuser;
    
    try {
        let validateFields = ["contactId"];
        let response = await Common.requestFieldsValidation(validateFields, postdata);
        
        if(response.status) {
            const deletedContact = await Contact.findOneAndDelete({
                _id: postdata.contactId,
                userId: user._id
            });

            if (!deletedContact) {
                return res.json({
                    status: 'error',
                    message: 'Contact not found or you do not have permission to delete it'
                });
            }
            
            return res.json({
                status: 'success',
                message: 'Contact deleted successfully'
            });
        } 
        
        return res.json({
            status: 'error',
            message: 'Contact ID is required'
        });
        
    } catch(err) {
        console.error('Error in deleteContact:', err);
        return res.json({
            status: 'error',
            message: err.message || 'Server error'
        });
    }
};

// Modified handler function
async function handler(req, res) {
    let isResponseSent = false;

    try {
        if (req.method !== 'POST') {
            isResponseSent = true;
            return res.status(405).json({ 
                status: 'error',
                message: 'Method not allowed. Only POST requests are supported.'
            });
        }

        const { contactSlug } = req.query;
        const method = routeHandler[contactSlug];

        if (!method) {
            isResponseSent = true;
            return res.status(404).json({
                status: 'error',
                message: `Method ${contactSlug} not found`
            });
        }

        await method(req, res);
        isResponseSent = true;

    } catch (error) {
        console.error('API Error:', error);
        if (!isResponseSent) {
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    } finally {
        if (!isResponseSent && !res.headersSent) {
            return res.status(500).json({
                status: 'error',
                message: 'No response was sent'
            });
        }
    }
}

export default authMiddleware(handler);