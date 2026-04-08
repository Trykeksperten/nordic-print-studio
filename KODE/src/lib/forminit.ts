export const FORMINIT_FORM_ID = "64u76j89sk2";
export const FORMINIT_ACTION_URL = `https://forminit.com/f/${FORMINIT_FORM_ID}`;

type ForminitSubmitResult = {
  data?: unknown;
  error?: { message?: string };
};

type ForminitSdkClient = {
  submit: (formId: string, formData: FormData) => Promise<ForminitSubmitResult>;
};

declare global {
  interface Window {
    Forminit?: new () => ForminitSdkClient;
  }
}

export const submitToForminit = async (payload: FormData) => {
  if (typeof window !== "undefined" && window.Forminit) {
    const client = new window.Forminit();
    const { error } = await client.submit(FORMINIT_FORM_ID, payload);
    if (error) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ error: error.message || "Forminit submit failed" }),
      } as Response;
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response;
  }

  return fetch(FORMINIT_ACTION_URL, {
    method: "POST",
    body: payload,
  });
};
