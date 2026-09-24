/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
  PAPERTRAIL_EDITOR_KEY?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    if (url.pathname.startsWith("/api/")) {
      const origin = request.headers.get("Origin");
      const allowedOrigins = (env.ALLOWED_ORIGINS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
      if (origin && !allowedOrigins.includes(origin)) return new Response("Origin not allowed", { status: 403 });
      const headers = new Headers({
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-PaperTrail-Editor",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin",
      });
      if (origin && allowedOrigins.includes(origin)) headers.set("Access-Control-Allow-Origin", origin);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

      const editorKey = request.headers.get("X-PaperTrail-Editor") ?? "";
      if (url.pathname === "/api/editor/verify" && request.method === "POST") {
        if (!env.PAPERTRAIL_EDITOR_KEY) return new Response("Editor access is not configured", { status: 503, headers });
        if (editorKey !== env.PAPERTRAIL_EDITOR_KEY) return new Response("Invalid editor key", { status: 401, headers });
        return new Response(null, { status: 204, headers });
      }

      if (["POST", "PATCH", "DELETE"].includes(request.method) && !env.PAPERTRAIL_EDITOR_KEY) {
        return Response.json({ error: "Editing is not configured on this site" }, { status: 503, headers });
      }
      if (["POST", "PATCH", "DELETE"].includes(request.method) && editorKey !== env.PAPERTRAIL_EDITOR_KEY) {
        return Response.json({ error: "Editor access required" }, { status: 401, headers });
      }

      const response = await handler.fetch(request, env, ctx);
      const responseHeaders = new Headers(response.headers);
      headers.forEach((value, key) => responseHeaders.set(key, value));
      const vary = new Set((response.headers.get("Vary") ?? "").split(",").map((value) => value.trim()).filter(Boolean));
      vary.add("Origin");
      responseHeaders.set("Vary", [...vary].join(", "));
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders });
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
