/**
 * Global API Requester for your CRM Applet
 * Gracefully handles rate limiting, network failures, and parsing errors.
 */
export async function safeCRMRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T | { error: true; status?: number; message: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(options.headers || {}),
      },
    });

    // Capture text body first to inspect if it's a raw rate limit string
    const rawText = await response.text();

    if (!response.ok || rawText.includes("Rate exceeded") || rawText.includes("RESOURCE_EXHAUSTED")) {
      console.warn(`⚠️ Rate limit or response issue triggered at ${url}. Status: ${response.status}`);
      return {
        error: true,
        status: response.status || 429,
        message: "The AI Engine is currently processing heavy traffic. Retrying shortly...",
      };
    }

    // Safely parse only when we know it is valid JSON
    try {
      return JSON.parse(rawText) as T;
    } catch (parseErr) {
      console.error("JSON parsing failure:", parseErr, "Raw response was:", rawText);
      return {
        error: true,
        message: "Unable to parse server response. Falling back to safe mock modes.",
      };
    }
  } catch (error: any) {
    console.error("Critical Network Sync Failure:", error);
    return {
      error: true,
      message: error.message || String(error),
    };
  }
}
