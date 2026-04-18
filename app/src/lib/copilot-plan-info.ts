/** Copilot-Plan info to Desktop */
export type CopilotPlanInfo = {
  readonly copilotLicenseType: string
  readonly copilotResetDate: string
  readonly chatQuotas: number
  readonly autoSuggestQuotas: number
}

/**
 * Gets Copilot plan information for the user, including license type,
 * reset date, and remaining quotas for chat and code completions.
 *
 * NOTE: The structure of the response from the API varies depending on the user's plan.
 *
 * @param response
 * @returns A promise that resolves to a CopilotPlanInfo object containing the user's Copilot plan details.
 * @throws Will throw an error if the response cannot be parsed or does not contain the expected fields.
 */
export async function getCopilotPlanInfo({
  response,
}: {
  response: Response
}): Promise<CopilotPlanInfo> {
  const userResponse = await response.json()
  console.warn('userResponse', JSON.stringify(userResponse))
  const isPlanFreeOrPro = userResponse['copilot_plan']?.match('individual')
  const typeSku = userResponse['access_type_sku']
  return {
    copilotLicenseType: typeSku?.match('enterprise')
      ? 'Enterprise'
      : typeSku?.match('business')
      ? 'Business'
      : typeSku?.match('free')
      ? 'Free'
      : 'Pro',
    copilotResetDate: isPlanFreeOrPro
      ? userResponse['limited_user_reset_date']
      : userResponse['quota_snapshot'],
    chatQuotas: isPlanFreeOrPro
      ? 1 -
        userResponse['limited_user_quotas']?.['chat'] /
          userResponse['monthly_quotas']?.['chat']
      : 1 -
        userResponse['quota_snapshots']?.['chat']?.['percent_remaining'] / 100,
    autoSuggestQuotas: isPlanFreeOrPro
      ? 1 -
        userResponse['limited_user_quotas']?.['completions'] /
          userResponse['monthly_quotas']?.['completions']
      : 1 -
        userResponse['quota_snapshots']?.['completions']?.[
          'percent_remaining'
        ] /
          100,
  } as CopilotPlanInfo
}
