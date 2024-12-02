/**
 * Helper functions for formatting and logging errors
 */

/**
 * Formats AJV validation errors
 *
 * @param {Array<import("ajv").ErrorObject>} validationErrors - array of AJV error objects
 * @returns {Array<string>} - array of formatted error messages
 */
function formatAjvErrors(validationErrors) {
    const errors = [];
    if (!Array.isArray(validationErrors)) {
        return errors;
    }

    validationErrors.forEach((error) => {
        // Omit confusing errors
        if (error.message === 'must NOT be valid') return;

        let formattedError = `${error.instancePath} ${error.message}`;
        if (error.params.additionalProperty) formattedError += `. Found extra property '${error.params.additionalProperty}'`;

        errors.push(formattedError.trim());
    });

    return errors;
}

/**
 * Logs the errors (if any) and sets exit code to failing
 *
 * @param prefix {string} - prefix for the error messages
 * @param {Array<string>} errors
 * @returns {string} the same error (for chaining)
 */
function logErrors(prefix, errors) {
    if (errors.length <= 0) return;

    process.exitCode = 1;
    errors.forEach((error) => {
        console.error(`${prefix} ${error}`);
    });
}

export { formatAjvErrors, logErrors };
