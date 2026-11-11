import { http } from "./api/http-client.ts";

const STUB_ENDPOINT = "/posts";

export const StubService = {
  send: (text: string) => http.post(STUB_ENDPOINT, { text }),
};
