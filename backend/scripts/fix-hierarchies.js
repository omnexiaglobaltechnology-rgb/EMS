require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');
const User = require('../models/User');

const fixHierarchies = async () => {
    try {
        const mongoURL = process.env.MONGODB_URL;
        if (!mongoURL) {
            console.error('MONGODB_URL is missing in .env');
            process.exit(1);
        }

        await mongoose.connect(mongoURL);
        console.log('Connected to MongoDB');

        const ceo = await User.findOne({ role: 'ceo' });
        if (!ceo) {
            console.error('CEO user not found. Please create a CEO first.');
            process.exit(1);
        }
        console.log(`CEO found: ${ceo.name} (${ceo._id})`);

        const users = await User.find({});
        console.log(`Processing ${users.length} users...`);

        for (const user of users) {
            if (user.role === 'ceo' || user.role === 'admin') continue;

            const updates = {};
            
            // 1. Default to CEO if no reportsTo
            if (!user.reportsTo) {
                user.reportsTo = ceo._id;
                updates.reportsTo = ceo._id;
            }

            // 2. Resolve managerId and teamLeadId
            const supervisor = await User.findById(user.reportsTo);
            if (supervisor) {
                if (['manager', 'manager_intern', 'cto', 'cfo', 'coo', 'ceo', 'admin'].includes(supervisor.role)) {
                    updates.managerId = supervisor._id;
                    updates.teamLeadId = null;
                } else if (['team_lead', 'team_lead_intern'].includes(supervisor.role)) {
                    updates.teamLeadId = supervisor._id;
                    // For simplicity, the manager for a TL's subordinate is the TL's own supervisor
                    updates.managerId = supervisor.reportsTo || ceo._id;
                }
            }

            if (Object.keys(updates).length > 0) {
                await User.findByIdAndUpdate(user._id, { $set: updates });
                console.log(`Updated hierarchy for: ${user.name} (${user.role})`);
            }
        }

        console.log('Hierarchy fix completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error during fix:', error);
        process.exit(1);
    }
};

fixHierarchies();
