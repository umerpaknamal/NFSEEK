import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teamName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    members: [{
        contactId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contact',
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: Number,
        default: 1
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for better query performance
teamSchema.index({ userId: 1, teamName: 1 });
teamSchema.index({ 'members.contactId': 1 });

const Team = mongoose.models.Team || mongoose.model('Team', teamSchema);
export default Team;