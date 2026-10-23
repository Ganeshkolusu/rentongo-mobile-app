/**
 * Utility functions for fetching and processing pincode data
 */

/**
 * Fetches address details from postal pincode API
 * @param {string} pincode - 6 digit pincode
 * @returns {Promise<Object>} Address details including state, city, and area
 */
export const fetchPincodeDetails = async (pincode) => {
    try {
        // Validate pincode format (6 digits)
        if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
            throw new Error('Invalid pincode format. Please enter a 6-digit pincode.');
        }

        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();

        // Check if API returned valid data
        if (!data || data.length === 0) {
            throw new Error('Unable to fetch pincode details. Please try again.');
        }

        const result = data[0];

        // Check for API errors or invalid pincode
        if (result.Status === 'Error' || result.Status === '404') {
            throw new Error('Invalid pincode. Please check and try again.');
        }

        if (!result.PostOffice || result.PostOffice.length === 0) {
            throw new Error('No details found for this pincode.');
        }

        // Get the first post office data
        const postOffice = result.PostOffice[0];

        return {
            success: true,
            state: postOffice.State || '',
            district: postOffice.District || '',
            city: postOffice.District || '', // Use District as City
            area: postOffice.Name || '', // Post Office name as area
            region: postOffice.Region || '',
            division: postOffice.Division || '',
            block: postOffice.Block || '',
            pincode: pincode,
            // Return all post offices for the pincode (in case user wants to choose)
            allPostOffices: result.PostOffice.map(po => ({
                name: po.Name,
                branchType: po.BranchType,
                deliveryStatus: po.DeliveryStatus,
                circle: po.Circle,
                district: po.District,
                division: po.Division,
                region: po.Region,
                block: po.Block,
                state: po.State,
            }))
        };
    } catch (error) {
        // Silent catch
        return {
            success: false,
            error: error.message || 'Failed to fetch pincode details'
        };
    }
};

/**
 * Formats state name to match the indianStates options
 * @param {string} stateName - State name from API
 * @returns {Object} State option with label and value
 */
export const formatStateOption = (stateName) => {
    if (!stateName) return null;

    // Map common state name variations to standard names
    const stateMapping = {
        'Delhi': 'Delhi',
        'Andhra Pradesh': 'Andhra Pradesh',
        'Arunachal Pradesh': 'Arunachal Pradesh',
        'Assam': 'Assam',
        'Bihar': 'Bihar',
        'Chhattisgarh': 'Chhattisgarh',
        'Goa': 'Goa',
        'Gujarat': 'Gujarat',
        'Haryana': 'Haryana',
        'Himachal Pradesh': 'Himachal Pradesh',
        'Jharkhand': 'Jharkhand',
        'Karnataka': 'Karnataka',
        'Kerala': 'Kerala',
        'Madhya Pradesh': 'Madhya Pradesh',
        'Maharashtra': 'Maharashtra',
        'Manipur': 'Manipur',
        'Meghalaya': 'Meghalaya',
        'Mizoram': 'Mizoram',
        'Nagaland': 'Nagaland',
        'Odisha': 'Odisha',
        'Orissa': 'Odisha', // Handle old name
        'Punjab': 'Punjab',
        'Rajasthan': 'Rajasthan',
        'Sikkim': 'Sikkim',
        'Tamil Nadu': 'Tamil Nadu',
        'Telangana': 'Telangana',
        'Tripura': 'Tripura',
        'Uttar Pradesh': 'Uttar Pradesh',
        'Uttarakhand': 'Uttarakhand',
        'West Bengal': 'West Bengal',
        'Andaman and Nicobar Islands': 'Andaman and Nicobar Islands',
        'Andaman & Nicobar Islands': 'Andaman and Nicobar Islands',
        'Chandigarh': 'Chandigarh',
        'Dadra and Nagar Haveli and Daman and Diu': 'Dadra and Nagar Haveli and Daman and Diu',
        'Dadra & Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu',
        'Daman and Diu': 'Dadra and Nagar Haveli and Daman and Diu',
        'Jammu and Kashmir': 'Jammu and Kashmir',
        'Jammu & Kashmir': 'Jammu and Kashmir',
        'Ladakh': 'Ladakh',
        'Lakshadweep': 'Lakshadweep',
        'Puducherry': 'Puducherry',
        'Pondicherry': 'Puducherry', // Handle old name
    };

    const mappedState = stateMapping[stateName] || stateName;

    return {
        label: mappedState,
        value: mappedState.toLowerCase().replace(/\s+/g, '')
    };
};

/**
 * Formats city name to match dropdown option format
 * @param {string} cityName - City name from API
 * @returns {Object} City option with label and value
 */
export const formatCityOption = (cityName) => {
    if (!cityName) return null;

    return {
        label: cityName,
        value: cityName.toLowerCase().replace(/\s+/g, '')
    };
};
