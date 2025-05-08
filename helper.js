#helper.js
export const Errors = {
    missing_fields: 'All fields must be provided',
    firstName_invalid: 'firstName must be 2–20 letters with no spaces or numbers',
    lastName_invalid: 'lastName must be 2–20 letters with no spaces or numbers',
    userId_invalid: 'userId must be 5-10 characters, letters and numbers only',
    password_type: 'password must be a string with no spaces',
    password_invalid: 'password must be ≥8 chars, include an uppercase letter, a number, and a special character',
    favoriteQuote_invalid: 'favoriteQuote must be 20–255 characters long',
    themePref_type: 'themePreference must be an object',
    themePref_keys: 'themePreference must have exactly backgroundColor and fontColor',
    themePref_hex: 'backgroundColor and fontColor must be valid hex codes',
    themePref_same: 'backgroundColor and fontColor cannot be the same',
    roleType: 'role must be a string',
    role_invalid: 'role must be either "superuser" or "user"',
    userID_exists: id => `A user with userId "${id}" already exists`,
    registration_fail: 'Registration failed; please try again'
};