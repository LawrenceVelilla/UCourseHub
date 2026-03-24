const BACKEND_URL = "https://ucoursehub.onrender.com";

export const onRequest: PagesFunction = async (context) => {
    const url = new URL(context.request.url);
    const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

    const headers = new Headers(context.request.headers);
    headers.set("X-Forwarded-Host", url.hostname);

    const response = await fetch(backendUrl, {
        method: context.request.method,
        headers,
        body: context.request.method !== "GET" && context.request.method !== "HEAD"
            ? context.request.body
            : undefined,
    });

    const responseHeaders = new Headers(response.headers);
    // Remove hop-by-hop headers
    responseHeaders.delete("connection");
    responseHeaders.delete("keep-alive");
    responseHeaders.delete("transfer-encoding");

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
    });
};
