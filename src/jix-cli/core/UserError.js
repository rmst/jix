/**
 * User-facing validation error that shouldn't show a stack trace
 */
export class UserError extends Error {
	constructor(message) {
		super(message)
		this.name = 'UserError'
	}
}