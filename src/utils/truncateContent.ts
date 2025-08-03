/**
 * Truncates text content to a specified maximum length, appending ellipsis if truncated.
 * @param content - The string content to potentially truncate
 * @param maxLength - Maximum allowed length before truncation (default: 80 characters)
 * @returns The original string if within limit, or truncated string with "..." suffix
 */
export const truncateContent = (
    content: string,
    maxLength: number = 80
): string => {
    return content.length > maxLength
        ? `${content.substring(0, maxLength)}...`
        : content;
};
