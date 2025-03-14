const axios = require('axios');
const Conversion = require('../models/Conversion');

class HiqmobiService {
    constructor() {
        this.apiUrl = process.env.HIQMOBI_API_URL || 'https://api.hiqmobi.com/api';
        this.apiToken = process.env.HIQMOBI_API_TOKEN || '15t01kbcjzi35of3ua1j55eilvpkwtboqi6i';
        console.log(`HiQmobi service initialized with API URL: ${this.apiUrl}`);
    }

    async fetchConversions({ page = 1, limit = 10, status, startDate, endDate }) {
        try {
            console.log(`Fetching conversions from HiQmobi API. Page: ${page}, Limit: ${limit}, Status: ${status || 'all'}`);
            
            const response = await axios.get(`${this.apiUrl}/conversion`, {
                params: {
                    api_token: this.apiToken,
                    page,
                    limit,
                    ...(status && { status }),
                    ...(startDate && { start_date: startDate }),
                    ...(endDate && { end_date: endDate })
                }
            });

            console.log(`HiQmobi API response status: ${response.status}`);
            
            if (!response.data || !Array.isArray(response.data.data)) {
                console.warn('Invalid response format from HiQmobi API:', response.data);
                return [];
            }
            
            const conversions = response.data.data;
            console.log(`Received ${conversions.length} conversions from HiQmobi API`);
            
            // Store conversions in MongoDB
            let storedCount = 0;
            for (const conv of conversions) {
                try {
                    const clickId = conv.clickid || conv.id;
                    if (!clickId) {
                        console.warn('Skipping conversion without ID:', conv);
                        continue;
                    }

                    await Conversion.findOneAndUpdate(
                        { clickId },
                        {
                            phone: conv.p1 || conv.phone || 'unknown',
                            upiId: conv.p2 || conv.upi_id || '',
                            status: conv.status || 'pending',
                            payout: conv.payout || 100,
                            offerId: conv.offerid || conv.offer_id || 0,
                            offerName: conv.goalName || conv.offer_name || 'Unknown Offer',
                            ip: conv.ip || '',
                            createdAt: conv.created_at || new Date()
                        },
                        { upsert: true, new: true }
                    );
                    storedCount++;
                } catch (convError) {
                    console.error('Error storing conversion:', convError);
                }
            }
            
            console.log(`Successfully stored/updated ${storedCount} conversions in database`);
            return conversions;
        } catch (error) {
            console.error('HiQmobi API Error:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            throw error;
        }
    }

    async getUserProcessDetails(phone) {
        try {
            // Get user's conversions from the database based on phone number
            const conversions = await Conversion.find({ phone }).sort({ createdAt: -1 });
            
            return {
                phone,
                conversions,
                totalPayout: conversions.reduce((sum, conv) => sum + (conv.payout || 0), 0),
                completedCount: conversions.filter(conv => conv.status === 'completed').length,
                pendingCount: conversions.filter(conv => conv.status === 'pending').length,
                rejectedCount: conversions.filter(conv => conv.status === 'rejected').length
            };
        } catch (error) {
            console.error('Error fetching user process details:', error);
            throw error;
        }
    }
}

module.exports = new HiqmobiService();
