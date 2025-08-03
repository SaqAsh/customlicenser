/**
 * @param value - The input value to validate
 * @returns
 */

export const validateInput: (value: string) => string = (value) => {
    if (!value || value.trim().length === 0) {
        return "License content cannot be empty";
    }
    return "";
};
