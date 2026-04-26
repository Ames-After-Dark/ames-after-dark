export type AuthLikeError = {
    message?: string
    code?: string
    name?: string
}

/**
 * Returns true when an Auth0 Web Auth flow was cancelled by the user. Remove in future if decide to show
 * no logs on sign in screen
 *
 * Notes:
 * - iOS can surface: "The user cancelled the Web Auth operation."
 * - react-native-auth0 can surface: "a0.session.user_cancelled"
 */
export function isAuth0UserCancelledError(err: unknown): boolean {
    const e = err as AuthLikeError | null | undefined
    const message = typeof e?.message === 'string' ? e.message : ''
    const code = typeof e?.code === 'string' ? e.code : ''
    const name = typeof e?.name === 'string' ? e.name : ''

    return (
        message.includes('a0.session.user_cancelled') ||
        message.includes('The user cancelled') ||
        code === 'USER_CANCELLED' ||
        name === 'USER_CANCELLED'
    )
}
