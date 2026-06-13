/** Copilot-Plan info to Desktop */
export type CopilotPlanInfo = {
  readonly copilotLicenseType: string
  readonly copilotResetDate: string
  readonly chatQuotas: number
  readonly autoSuggestQuotas: number
}

/**
 * TODO: This is a beta implementation. It uses a private API.
 * NOTE: The structure of the response from the API varies depending on the user's plan.
 * Gets Copilot plan information for the user, including license type,
 * reset date, and remaining quotas for chat and code completions.
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
  //console.warn('userResponse', JSON.stringify(userResponse))
  const isPlanFreeOrPro = userResponse['copilot_plan']?.match('individual')
  const typeSku = userResponse['access_type_sku']
  const plan = userResponse['copilot_plan']
  const returnValue = {
    copilotLicenseType: plan?.match('enterprise')
      ? 'Enterprise'
      : plan?.match('business')
      ? 'Business'
      : plan?.match('pro')
      ? 'Pro'
      : typeSku?.match('free')
      ? 'Free'
      : 'Unknown',
    copilotResetDate: isPlanFreeOrPro
      ? userResponse['quota_reset_date']
      : userResponse['quota_snapshot'],
    chatQuotas:
      1 -
      userResponse['quota_snapshots']?.['chat']?.['percent_remaining'] / 100,
    autoSuggestQuotas:
      1 -
      userResponse['quota_snapshots']?.['completions']?.['percent_remaining'] /
        100,
  } as CopilotPlanInfo
  console.warn('userResponse', JSON.stringify(returnValue))
  return returnValue
}
