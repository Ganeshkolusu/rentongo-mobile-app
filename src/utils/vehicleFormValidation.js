/**
 * Field checks shared by the List/Edit vehicle forms (car, bike, auto).
 */

/**
 * Indian pincode: exactly 6 digits, never starting with 0
 */
export const isValidPincode = (value) => /^[1-9][0-9]{5}$/.test(String(value ?? '').trim());

/**
 * Strip spaces/dashes and an optional +91 / 91 / 0 prefix from a mobile number
 */
export const normalizeMobileNumber = (value) => {
    let digits = String(value ?? '').replace(/[\s-]/g, '');
    if (digits.startsWith('+91')) {
        digits = digits.slice(3);
    } else if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
    }
    return digits;
};

/**
 * Indian mobile number: 10 digits starting with 6-9 (after removing the prefix)
 */
export const isValidMobileNumber = (value) => /^[6-9][0-9]{9}$/.test(normalizeMobileNumber(value));

/**
 * Person name: letters, spaces and dots only, with at least 2 letters
 */
export const isValidPersonName = (value) => {
    const name = String(value ?? '').trim();
    return /^[A-Za-z. ]+$/.test(name) && (name.match(/[A-Za-z]/g) || []).length >= 2;
};

/**
 * Collapse repeated spaces and trim a typed vehicle name/model ("  Tata   Nexon " -> "Tata Nexon")
 */
export const cleanVehicleText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

/**
 * Typed vehicle name/model: 2-50 chars, at least one letter, and only letters,
 * digits, spaces and - . / ( ) & + (e.g. "Maruti Swift", "XUV 3XO", "Classic 350", "i20 N-Line")
 */
export const isValidVehicleText = (value) => {
    const text = cleanVehicleText(value);
    return text.length >= 2 && text.length <= 50
        && /[A-Za-z]/.test(text)
        && /^[A-Za-z0-9 .\-/()&+]+$/.test(text);
};

/**
 * Parse a typed amount/number. Returns NaN for empty or malformed input ("", "12.", "1e3", "abc").
 */
export const toNumber = (value) => {
    const text = String(value ?? '').trim();
    if (!/^\d+(\.\d+)?$/.test(text)) {
        return NaN;
    }
    return Number(text);
};

// Rents / prices must be greater than zero
export const isPositiveNumber = (value) => toNumber(value) > 0;

// Km driven, deposit, driver fee may be zero
export const isNonNegativeNumber = (value) => toNumber(value) >= 0;

/**
 * Pickup pin is set: both values present and finite, within lat/lng range
 */
export const isValidCoordinate = (latitude, longitude) => {
    if (latitude === '' || longitude === '' || latitude == null || longitude == null) {
        return false;
    }
    const lat = Number(latitude);
    const lng = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lng)
        && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
};
